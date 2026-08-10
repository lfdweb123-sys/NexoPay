import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * À appeler toutes les 5 minutes via cron-job.org (comme ton paymentgateway),
 * avec le header x-internal-api-key pour sécuriser l'appel.
 * URL : https://<ton-domaine>/api/cron/check-stuck-jobs
 */
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-internal-api-key");
  if (key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cutoff = Date.now() - STUCK_THRESHOLD_MS;
  const snap = await db
    .collection("jobs")
    .where("statut", "==", "processing")
    .where("startedAt", "<=", cutoff)
    .get();

  const batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.update(doc.ref, {
      statut: "failed",
      erreur: "Timeout : bloqué en traitement trop longtemps",
      completedAt: Date.now(),
    });
    count++;
  }
  if (count > 0) await batch.commit();

  return NextResponse.json({ ok: true, jobsMarquesEchec: count });
}
