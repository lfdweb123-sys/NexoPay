import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, auth, messaging } from "@/lib/firebaseAdmin";
import { verifyInternalApiKey } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  statut: z.enum(["processing", "success", "failed"]),
  reponseBrute: z.string().optional(),
  erreur: z.string().nullable().optional(),
  ussdSequenceUsed: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyInternalApiKey(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const jobRef = db.collection("jobs").doc(params.id);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) {
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

  await db.collection("admin_logs").add({
    jobId: params.id,
    action: `job_${data.statut}`,
    timestamp: Date.now(),
    details: { reponseBrute: data.reponseBrute, erreur: data.erreur },
  });

  // Remboursement auto si échec et activé en config
  if (data.statut === "failed") {
    const configSnap = await db.collection("config").doc("app").get();
    if (configSnap.data()?.remboursementAutomatique) {
      await jobRef.update({ statut: "refunded" });
      // TODO: appeler l'API de remboursement FeexPay ici une fois la doc confirmée
    }
  }

  // Notification push au client
  try {
    const user = await auth.getUser(job.clientUid);
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
      }
    }
  } catch (e) {
    console.error("Erreur envoi notification FCM", e);
  }

  return NextResponse.json({ ok: true });
}
