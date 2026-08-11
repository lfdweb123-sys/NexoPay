import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

/** Route publique lue par l'app client pour afficher la page "Nous contacter" */
export async function GET() {
  try {
    const doc = await db.collection("config").doc("contact").get();
    if (!doc.exists) {
      console.warn("[contact][GET] Aucun document contact configuré, valeurs par défaut renvoyées");
      return NextResponse.json({
        contact: {
          telephoneMobile: "+229 00 00 00 00",
          telephoneFixe: "+229 21 00 00 00",
        },
      });
    }
    return NextResponse.json({ contact: doc.data() });
  } catch (err) {
    console.error("[contact][GET] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
