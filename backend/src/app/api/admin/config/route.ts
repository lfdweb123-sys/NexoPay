import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { AppConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG: AppConfig = {
  fraisParOperateur: { mtn: 0, moov: 0, celtiis: 0 },
  seuilAlerteSoldeGlobal: 10000,
  remboursementAutomatique: true,
  maintenance: false,
  messageMaintenance: "Service momentanément indisponible, revenez bientôt.",
};

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const doc = await db.collection("config").doc("app").get();
    if (!doc.exists) {
      await db.collection("config").doc("app").set(DEFAULT_CONFIG);
      console.log("[admin/config][GET] Config par défaut créée");
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }
    return NextResponse.json({ config: doc.data() });
  } catch (err) {
    console.error("[admin/config][GET] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { response, admin } = await requireAdmin(req);
    if (response) return response;

    const body = await req.json();
    await db
      .collection("config")
      .doc("app")
      .set({ ...body, updatedAt: Date.now(), updatedBy: admin?.email }, { merge: true });

    console.log("[admin/config][PUT] Mis à jour par", admin?.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/config][PUT] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
