import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const operateur = searchParams.get("operateur");
  const type = searchParams.get("type");
  const limitParam = Number(searchParams.get("limit") ?? 50);

  let query: FirebaseFirestore.Query = db.collection("jobs");
  if (statut) query = query.where("statut", "==", statut);
  if (operateur) query = query.where("operateur", "==", operateur);
  if (type) query = query.where("type", "==", type);
  query = query.orderBy("createdAt", "desc").limit(Math.min(limitParam, 200));

  const snap = await query.get();
  return NextResponse.json({ jobs: snap.docs.map((d) => d.data()) });
}
