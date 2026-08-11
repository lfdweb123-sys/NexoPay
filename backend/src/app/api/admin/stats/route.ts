import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    const [pendingSnap, processingSnap, successSnap, failedSnap, simsSnap] = await Promise.all([
      db.collection("jobs").where("statut", "==", "pending").count().get(),
      db.collection("jobs").where("statut", "==", "processing").count().get(),
      db.collection("jobs").where("statut", "==", "success").where("createdAt", ">=", last24h).count().get(),
      db.collection("jobs").where("statut", "==", "failed").where("createdAt", ">=", last24h).count().get(),
      db.collection("sims").get(),
    ]);

    console.log("[admin/stats][GET] OK");
    return NextResponse.json({
      pending: pendingSnap.data().count,
      processing: processingSnap.data().count,
      success24h: successSnap.data().count,
      failed24h: failedSnap.data().count,
      sims: simsSnap.docs.map((d) => d.data()),
    });
  } catch (err) {
    console.error("[admin/stats][GET] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur (vérifie les index Firestore composites)" }, { status: 500 });
  }
}
