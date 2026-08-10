import crypto from "crypto";

/**
 * Hash simple SHA-256 salé, suffisant pour un compte admin unique généré côté
 * serveur. Pour générer ADMIN_PASSWORD_HASH :
 *   node -e "console.log(require('./src/lib/simpleHash').hashPassword('TonMotDePasse'))"
 */
export function hashPassword(password: string): string {
  const salt = process.env.ADMIN_PASSWORD_SALT ?? "lfd-momo-static-salt-change-me";
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

export default function bcryptCompare(password: string, expectedHash: string): boolean {
  const computed = hashPassword(password);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}
