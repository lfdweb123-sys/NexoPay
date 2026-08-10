import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { Operateur, SimAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

const OPERATEURS: Operateur[] = ["mtn", "moov", "celtiis"];

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const snap = await db.collection("sims").get();
  if (snap.empty) {
    const batch = db.batch();
    const defaults: SimAccount[] = OPERATEURS.map((op) => ({
      operateur: op,
      numero: "",
      soldePrincipal: 0,
      soldeCommission: 0,
      seuilAlerte: 5000,
      actif: true,
      dernierMaj: Date.now(),
    }));
    for (const s of defaults) batch.set(db.collection("sims").doc(s.operateur), s);
    await batch.commit();
    return NextResponse.json({ sims: defaults });
  }
  return NextResponse.json({ sims: snap.docs.map((d) => d.data()) });
}

export async function PUT(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const body = await req.json();
  if (!body.operateur || !OPERATEURS.includes(body.operateur)) {
    return NextResponse.json({ error: "opérateur invalide" }, { status: 400 });
  }

  await db
    .collection("sims")
    .doc(body.operateur)
    .set({ ...body, dernierMaj: Date.now() }, { merge: true });

  return NextResponse.json({ ok: true });
}
