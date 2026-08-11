import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, messaging } from "@/lib/firebaseAdmin";
import { verifyInternalApiKey } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  statut: z.enum(["processing", "success", "failed"]),
  reponseBrute: z.string().optional(),
  erreur: z.string().nullable().optional(),
  ussdSequenceUsed: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("[jobs/result][POST] job =", params.id);

  if (!verifyInternalApiKey(req)) {
    console.warn("[jobs/result][POST] Clé interne invalide ou manquante pour job", params.id);
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[jobs/result][POST] Corps JSON invalide", err);
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    console.error("[jobs/result][POST] Validation échouée", parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const jobRef = db.collection("jobs").doc(params.id);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      console.error("[jobs/result][POST] Job introuvable :", params.id);
      return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
    }
    const job = jobSnap.data()!;

    const update: Record<string, any> = {
      statut: data.statut,
      reponseBrute: data.reponseBrute ?? null,
      erreur: data.erreur ?? null,
    };
    if (data.ussdSequenceUsed) update.ussdSequenceUsed = data.ussdSequenceUsed;
    if (data.statut === "processing") update.startedAt = Date.now();
    if (data.statut === "success" || data.statut === "failed") update.completedAt = Date.now();
    if (data.statut === "failed") update.retryCount = (job.retryCount ?? 0) + 1;

    await jobRef.update(update);
    console.log("[jobs/result][POST] Job", params.id, "mis à jour ->", data.statut);

    await db.collection("admin_logs").add({
      jobId: params.id,
      action: `job_${data.statut}`,
      timestamp: Date.now(),
      details: { reponseBrute: data.reponseBrute, erreur: data.erreur },
    });

    if (data.statut === "failed") {
      const configSnap = await db.collection("config").doc("app").get();
      if (configSnap.data()?.remboursementAutomatique) {
        await jobRef.update({ statut: "refunded" });
        console.log("[jobs/result][POST] Job", params.id, "marqué remboursé (auto)");
        // TODO: appeler l'API de remboursement FeexPay ici une fois la doc confirmée
      }
    }

    try {
      const userDoc = await db.collection("users").doc(job.clientUid).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (fcmToken) {
        const messages: Record<string, { title: string; body: string }> = {
          success: {
            title: "Opération réussie ✅",
            body:
              job.type === "forfait"
                ? "Votre forfait a été activé avec succès."
                : "Le transfert a été envoyé avec succès.",
          },
          failed: {
            title: "Échec de l'opération ❌",
            body: "Une erreur est survenue. Notre équipe a été alertée.",
          },
          processing: {
            title: "Traitement en cours…",
            body: "Votre opération est en cours de traitement.",
          },
        };
        const msg = messages[data.statut];
        if (msg) {
          await messaging.send({
            token: fcmToken,
            notification: { title: msg.title, body: msg.body },
            data: { jobId: params.id, statut: data.statut },
          });
          console.log("[jobs/result][POST] Notification FCM envoyée pour job", params.id);
        }
      } else {
        console.warn("[jobs/result][POST] Pas de fcmToken pour l'utilisateur", job.clientUid);
      }
    } catch (e) {
      console.error("[jobs/result][POST] Erreur envoi notification FCM", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[jobs/result][POST] Erreur inattendue", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
