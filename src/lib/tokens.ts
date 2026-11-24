import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

// Pre-computed hash used to keep login timing constant when the user doesn't
// exist or has no password (mitigates timing-based account enumeration).
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string): Promise<false> {
  dummyHash ??= bcrypt.hash("lumen-timing-equaliser", BCRYPT_ROUNDS);
  await bcrypt.compare(password, await dummyHash);
  return false;
}

// URL-safe random token (sent by email) and its SHA-256 hash (stored).
export function createToken(bytes = 32) {
  const token = randomBytes(bytes).toString("base64url");
  return { token, hash: sha256(token) };
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
