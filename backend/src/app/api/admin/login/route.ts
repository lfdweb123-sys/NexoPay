import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcryptCompare from "@/lib/simpleHash";
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

/**
 * Auth admin simple par identifiants stockés en variables d'environnement.
 * ADMIN_EMAIL + ADMIN_PASSWORD_HASH (hash sha256, voir src/lib/simpleHash.ts).
 * Pour plusieurs admins ou une gestion plus fine, migrer vers Firebase Auth
 * avec un rôle custom claim "admin".
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedEmail || !expectedHash) {
    return NextResponse.json({ error: "Configuration admin manquante" }, { status: 500 });
  }

  if (email !== expectedEmail || !bcryptCompare(password, expectedHash)) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const token = await createAdminSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
