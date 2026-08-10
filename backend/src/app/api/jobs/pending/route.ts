import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { verifyInternalApiKey } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Appelé par le bot Android (polling de secours ; en priorité le bot doit
 * écouter Firestore en temps réel, cette route sert de filet de sécurité
 * si la connexion Firestore du bot tombe).
 */
export async function GET(req: NextRequest) {
  if (!verifyInternalApiKey(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const snap = await db
    .collection("jobs")
    .where("statut", "==", "pending")
    .orderBy("createdAt", "asc")
    .limit(10)
    .get();

  const jobs = snap.docs.map((d) => d.data());
  return NextResponse.json({ jobs });
}
