import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST() {
  console.log("[admin/logout] Déconnexion");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
