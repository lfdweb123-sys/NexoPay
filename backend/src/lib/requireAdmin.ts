import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";

/** À appeler en tête de chaque route /api/admin/* protégée */
export async function requireAdmin(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  return { admin, response: null };
}
