import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { DEFAULT_MESSAGES } from "@/lib/defaultMessages";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(req);
    if (response) return response;

    const snap = await db.collection("ussd_messages").get();

    if (snap.empty) {
      const batch = db.batch();
      for (const msg of DEFAULT_MESSAGES) {
        batch.set(db.collection("ussd_messages").doc(msg.id), { ...msg, updatedAt: Date.now() });
      }
      await batch.commit();
      console.log("[admin/messages][GET] Seed initial créé,", DEFAULT_MESSAGES.length, "messages");
      return NextResponse.json({ messages: DEFAULT_MESSAGES });
    }

    return NextResponse.json({ messages: snap.docs.map((d) => d.data()) });
  } catch (err) {
    console.error("[admin/messages][GET] Erreur", err);
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
      .collection("ussd_messages")
      .doc(body.id)
      .set({ ...body, updatedAt: Date.now() }, { merge: true });

    await db.collection("admin_logs").add({
      action: "message_updated",
      timestamp: Date.now(),
      details: { id: body.id, by: admin?.email },
    });

    console.log("[admin/messages][PUT] Message", body.id, "mis à jour par", admin?.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/messages][PUT] Erreur", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
