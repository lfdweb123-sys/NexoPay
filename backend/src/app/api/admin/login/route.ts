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
  console.log("[admin/login] Requête reçue");

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[admin/login] Corps de requête JSON invalide", err);
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    console.error("[admin/login] Validation échouée", parsed.error.flatten());
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const expectedSalt = process.env.ADMIN_PASSWORD_SALT;
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (!expectedEmail || !expectedHash || !expectedSalt || !jwtSecret) {
    // On ne log jamais les valeurs elles-mêmes, seulement leur présence,
    // pour identifier précisément quelle variable manque sur Vercel
    // (Project Settings > Environment Variables) sans exposer de secret
    // dans les logs.
    console.error("[admin/login] Configuration admin manquante", {
      ADMIN_EMAIL: Boolean(expectedEmail),
      ADMIN_PASSWORD_HASH: Boolean(expectedHash),
      ADMIN_PASSWORD_SALT: Boolean(expectedSalt),
      ADMIN_JWT_SECRET: Boolean(jwtSecret),
    });
    return NextResponse.json(
      { error: "Configuration admin manquante côté serveur. Vérifie les variables d'environnement sur Vercel." },
      { status: 500 }
    );
  }

  if (email !== expectedEmail) {
    console.warn("[admin/login] Tentative avec un email différent de ADMIN_EMAIL");
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  if (!bcryptCompare(password, expectedHash)) {
    console.warn("[admin/login] Mot de passe incorrect");
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
  console.log("[admin/login] Connexion réussie pour", email);
  return res;
}
