import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyTransactionStatus } from "@/lib/feexpay";
import { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * FeexPay n'offrant pas de secret de signature sur cette offre, on ne fait
 * JAMAIS confiance au contenu brut du webhook reçu (un tiers connaissant
 * l'URL pourrait sinon envoyer un faux "SUCCESSFUL" et se faire livrer un
 * forfait/transfert gratuitement). Le webhook ne sert qu'à déclencher une
 * vérification active : on rappelle nous-mêmes l'API FeexPay pour connaître
 * le VRAI statut de la transaction avant de créer le moindre job.
 */
export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const reference = payload.reference;
  if (!reference) {
    return NextResponse.json({ error: "reference manquante" }, { status: 400 });
  }

  const pendingRef = db.collection("pending_payments").doc(reference);
  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    // Idempotence : si déjà traité ou inconnu, on répond 200 pour éviter les retries infinis de FeexPay
    return NextResponse.json({ ok: true, note: "reference inconnue ou déjà traitée" });
  }

  const pending = pendingSnap.data()!;

  // Vérification active auprès de FeexPay — on ignore complètement le statut
  // annoncé dans le payload du webhook, on ne fait confiance qu'à cet appel.
  let verified: { status: string; amount?: number; transactionId?: string };
  try {
    verified = await verifyTransactionStatus(reference);
  } catch (err: any) {
    console.error("Échec vérification statut FeexPay", err);
    return NextResponse.json({ error: "Vérification FeexPay impossible" }, { status: 502 });
  }

  if (verified.status !== "SUCCESSFUL") {
    await pendingRef.update({ statut: "echec_paiement", updatedAt: Date.now() });
    return NextResponse.json({ ok: true });
  }

  const feexpayTransactionId = verified.transactionId ?? reference;

  // Empêche le double traitement si FeexPay renvoie 2x le même webhook
  const existingJob = await db
    .collection("jobs")
    .where("feexpayTransactionId", "==", feexpayTransactionId)
    .limit(1)
    .get();

  if (!existingJob.empty) {
    return NextResponse.json({ ok: true, note: "job déjà créé pour cette transaction" });
  }

  const jobRef = db.collection("jobs").doc();
  const job: Job = {
    id: jobRef.id,
    clientUid: pending.clientUid,
    clientPhone: pending.clientPhone,
    type: pending.type,
    operateur: pending.operateur,
    sousType: pending.sousType ?? null,
    palier: pending.palier ?? null,
    ussdCodeId: pending.ussdCodeId,
    montant: pending.montant,
    numeroClient: pending.numeroClient,
    feexpayTransactionId,
    montantPaye: verified.amount ?? pending.montant,
    frais: pending.frais ?? 0,
    statut: "pending",
    retryCount: 0,
    createdAt: Date.now(),
  } as Job;

  await jobRef.set(job);
  await pendingRef.update({ statut: "job_cree", jobId: job.id, updatedAt: Date.now() });

  return NextResponse.json({ ok: true, jobId: job.id });
}
