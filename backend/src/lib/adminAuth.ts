import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const COOKIE_NAME = "lfd_admin_session";

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET manquant dans les variables d'environnement");
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(adminEmail: string): Promise<string> {
  return await new SignJWT({ email: adminEmail, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return { email: payload.email as string };
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

/** Vérifie la clé API interne utilisée par le bot Android / webhooks internes */
export function verifyInternalApiKey(req: NextRequest): boolean {
  const provided = req.headers.get("x-internal-api-key");
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) return false;
  return provided === expected;
}
