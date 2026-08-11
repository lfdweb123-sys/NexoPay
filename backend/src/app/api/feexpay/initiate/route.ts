import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, auth } from "@/lib/firebaseAdmin";
import { initiateFeexpayPayment } from "@/lib/feexpay";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  idToken: z.string(), // Firebase ID token du client (auth par numéro)
  type: z.enum(["forfait", "transfert"]),
  operateur: z.enum(["mtn", "moov", "celtiis"]),
  sousType: z.string().optional(),
  palier: z.string().optional(),
  ussdCodeId: z.string(),
  montant: z.number().positive(),
  numeroClient: z.string().min(8),
  numeroPaiement: z.string().min(8), // numéro depuis lequel le client paie (peut différer du bénéficiaire)
  reseauPaiement: z.enum(["mtn", "moov", "celtiis"]),
});

export async function POST(req: NextRequest) {
  console.log("[feexpay/initiate] Requête reçue");

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[feexpay/initiate] Corps JSON invalide", err);
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    console.error("[feexpay/initiate] Validation échouée", parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(data.idToken);
    uid = decoded.uid;
  } catch (err) {
    console.error("[feexpay/initiate] idToken invalide", err);
    return NextResponse.json({ error: "Authentification invalide" }, { status: 401 });
  }

  try {
    const configSnap = await db.collection("config").doc("app").get();
    const config = configSnap.data();
    if (config?.maintenance) {
      console.warn("[feexpay/initiate] Service en maintenance, requête bloquée");
      return NextResponse.json(
        { error: config.messageMaintenance ?? "Service temporairement indisponible" },
        { status: 503 }
      );
    }

    const frais = config?.fraisParOperateur?.[data.operateur] ?? 0;
    const montantTotal = data.montant + frais;

    const reference = `NEXOPAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log("[feexpay/initiate] Nouvelle référence :", reference, "montant total :", montantTotal);

    await db
      .collection("pending_payments")
      .doc(reference)
      .set({
        clientUid: uid,
        clientPhone: (await auth.getUser(uid)).phoneNumber ?? "",
        type: data.type,
        operateur: data.operateur,
        sousType: data.sousType ?? null,
        palier: data.palier ?? null,
        ussdCodeId: data.ussdCodeId,
        montant: data.montant,
        frais,
        numeroClient: data.numeroClient,
        statut: "en_attente_paiement",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

    try {
      const feexpayResponse = await initiateFeexpayPayment({
        amount: montantTotal,
        phoneNumber: data.numeroPaiement,
        network: data.reseauPaiement,
        reference,
        callbackUrl: `${process.env.PUBLIC_BASE_URL}/api/feexpay/webhook`,
      });

      console.log("[feexpay/initiate] Paiement FeexPay initié avec succès pour", reference);
      return NextResponse.json({ ok: true, reference, feexpayResponse });
    } catch (err: any) {
      console.error("[feexpay/initiate] Échec initiation FeexPay", err);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  } catch (err) {
    console.error("[feexpay/initiate] Erreur inattendue", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
