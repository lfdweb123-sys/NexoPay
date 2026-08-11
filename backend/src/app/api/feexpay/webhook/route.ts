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
  console.log("[feexpay/webhook] Requête reçue");

  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[feexpay/webhook] Payload JSON invalide", err);
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const reference = payload.reference;
  if (!reference) {
    console.error("[feexpay/webhook] reference manquante dans le payload", payload);
    return NextResponse.json({ error: "reference manquante" }, { status: 400 });
  }

  console.log("[feexpay/webhook] reference =", reference);

  try {
    const pendingRef = db.collection("pending_payments").doc(reference);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      console.warn("[feexpay/webhook] reference inconnue ou déjà traitée :", reference);
      return NextResponse.json({ ok: true, note: "reference inconnue ou déjà traitée" });
    }

    const pending = pendingSnap.data()!;

    let verified: { status: string; amount?: number; transactionId?: string };
    try {
      verified = await verifyTransactionStatus(reference);
      console.log("[feexpay/webhook] Statut vérifié auprès de FeexPay :", verified.status);
    } catch (err: any) {
      console.error("[feexpay/webhook] Échec vérification statut FeexPay", err);
      return NextResponse.json({ error: "Vérification FeexPay impossible" }, { status: 502 });
    }

    if (verified.status !== "SUCCESSFUL") {
      await pendingRef.update({ statut: "echec_paiement", updatedAt: Date.now() });
      console.log("[feexpay/webhook] Paiement non réussi, statut =", verified.status);
      return NextResponse.json({ ok: true });
    }

    const feexpayTransactionId = verified.transactionId ?? reference;

    const existingJob = await db
      .collection("jobs")
      .where("feexpayTransactionId", "==", feexpayTransactionId)
      .limit(1)
      .get();

    if (!existingJob.empty) {
      console.warn("[feexpay/webhook] Job déjà créé pour cette transaction :", feexpayTransactionId);
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

    console.log("[feexpay/webhook] Job créé :", job.id);
    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (err) {
    console.error("[feexpay/webhook] Erreur inattendue", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
