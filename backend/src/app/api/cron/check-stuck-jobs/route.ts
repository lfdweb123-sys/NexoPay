import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * À appeler toutes les 5 minutes via cron-job.org, avec le header
 * x-internal-api-key. URL : https://<ton-domaine>/api/cron/check-stuck-jobs
 */
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-internal-api-key");
  if (key !== process.env.INTERNAL_API_KEY) {
    console.warn("[cron/check-stuck-jobs] Clé interne invalide ou manquante");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
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

    console.log("[cron/check-stuck-jobs] Jobs marqués en échec :", count);
    return NextResponse.json({ ok: true, jobsMarquesEchec: count });
  } catch (err) {
    console.error("[cron/check-stuck-jobs] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
