import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { hashPassword, sha256 } from "@/lib/tokens";
import { passwordSchema } from "@/lib/validations/auth";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

const bodySchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

/** Completes a password reset using the emailed token. Tokens are single-use. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");

  const ip = clientIp(req.headers);
  const limit = await rateLimit(`reset:ip:${ip}`, 10, 15 * 60);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many attempts. Please try again later.", {
      "Retry-After": String(limit.retryAfter),
    });
  }

  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError(400, "INVALID_INPUT", issue?.path[0] === "password" ? issue.message : "This reset link is invalid.");
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, emailVerified: true } } },
  });
  if (!record || record.expires < new Date()) {
    if (record) await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => undefined);
    return jsonError(400, "TOKEN_EXPIRED", "This reset link has expired or was already used. Request a new one.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      // Following an emailed link proves ownership of the address.
      data: { passwordHash, emailVerified: record.user.emailVerified ?? new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  await resetRateLimit(`login:email:${record.user.email}`);

  return jsonOk({ email: record.user.email });
}
