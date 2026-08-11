import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { DEFAULT_USSD_CODES } from "@/lib/defaultUssdCodes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const snap = await db.collection("ussd_codes").get();

    if (snap.empty) {
      const batch = db.batch();
      for (const code of DEFAULT_USSD_CODES) {
        batch.set(db.collection("ussd_codes").doc(code.id), { ...code, updatedAt: Date.now() });
      }
      await batch.commit();
      console.log("[admin/ussd-codes][GET] Seed initial créé,", DEFAULT_USSD_CODES.length, "codes");
      return NextResponse.json({ codes: DEFAULT_USSD_CODES });
    }

    return NextResponse.json({ codes: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("[admin/ussd-codes][GET] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { response, admin } = await requireAdmin(req);
    if (response) return response;

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    await db
      .collection("ussd_codes")
      .doc(body.id)
      .set(
        {
          ...body,
          updatedAt: Date.now(),
          updatedBy: admin?.email ?? "admin",
        },
        { merge: true }
      );

    await db.collection("admin_logs").add({
      action: "ussd_code_updated",
      timestamp: Date.now(),
      details: { id: body.id, by: admin?.email },
    });

    console.log("[admin/ussd-codes][PUT] Code", body.id, "mis à jour par", admin?.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ussd-codes][PUT] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
