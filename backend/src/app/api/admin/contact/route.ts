import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { ContactInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_CONTACT: ContactInfo = {
  telephoneMobile: "+229 00 00 00 00",
  telephoneFixe: "+229 21 00 00 00",
  whatsapp: "+229 00 00 00 00",
  email: "contact@lfdweb.com",
  adresse: "Abomey-Calavi, Bénin",
  horaires: "Lun–Sam, 8h–20h",
};

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const doc = await db.collection("config").doc("contact").get();
  if (!doc.exists) {
    await db.collection("config").doc("contact").set({ ...DEFAULT_CONTACT, updatedAt: Date.now() });
    return NextResponse.json({ contact: DEFAULT_CONTACT });
  }
  return NextResponse.json({ contact: doc.data() });
}

export async function PUT(req: NextRequest) {
  const { response, admin } = await requireAdmin(req);
  if (response) return response;

  const body = await req.json();
  await db
    .collection("config")
    .doc("contact")
    .set({ ...body, updatedAt: Date.now(), updatedBy: admin?.email }, { merge: true });

  return NextResponse.json({ ok: true });
}
