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
    console.warn("[jobs/pending][GET] Clé interne invalide ou manquante");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const snap = await db
      .collection("jobs")
      .where("statut", "==", "pending")
      .orderBy("createdAt", "asc")
      .limit(10)
      .get();

    console.log("[jobs/pending][GET]", snap.size, "job(s) en attente");
    const jobs = snap.docs.map((d) => d.data());
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[jobs/pending][GET] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur (vérifie l'index Firestore statut+createdAt)" }, { status: 500 });
  }
}
