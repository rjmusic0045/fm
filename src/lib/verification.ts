import "server-only";
import { prisma } from "@/lib/prisma";
import { createToken, sha256 } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

/** Issues a fresh email-verification link (old ones for this email stop working) and emails it. */
export async function issueVerificationEmail(email: string, name: string | null) {
  const { token, hash } = createToken();
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({ data: { identifier: email, token: hash, expires: new Date(Date.now() + VERIFY_TTL_MS) } }),
  ]);
  await sendVerificationEmail(email, name, token);
}

/** Consumes a verification token. Returns the verified email, or null if invalid/expired. */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  if (!token || token.length > 200) return null;
  const row = await prisma.verificationToken.findUnique({ where: { token: sha256(token) } });
  if (!row) return null;
  await prisma.verificationToken.delete({ where: { id: row.id } }).catch(() => undefined);
  if (row.expires.getTime() < Date.now()) return null;
  const updated = await prisma.user.updateMany({ where: { email: row.identifier }, data: { emailVerified: new Date() } });
  return updated.count ? row.identifier : null;
}
