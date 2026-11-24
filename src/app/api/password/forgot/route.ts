import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { emailSchema } from "@/lib/validations/auth";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Starts a password reset. Always answers with the same generic success so
// the endpoint can't be used to discover which emails are registered.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");

  const parsed = z.object({ email: emailSchema }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Enter a valid email address.");
  const { email } = parsed.data;

  const ip = clientIp(req.headers);
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`forgot:ip:${ip}`, 10, 60 * 60),
    rateLimit(`forgot:email:${email}`, 3, 60 * 60),
  ]);
  if (!byIp.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Please try again later.", {
      "Retry-After": String(byIp.retryAfter),
    });
  }

  const generic = jsonOk({ message: "If an account exists for that email, a reset link is on its way." });
  // Silently drop per-email floods so we never spam an inbox.
  if (!byEmail.allowed) return generic;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!user) return generic;

  const { token, hash } = createToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expires: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);

  try {
    await sendPasswordResetEmail(user.email, user.name, token);
  } catch (err) {
    console.error("[forgot-password] email failed", err);
    return jsonError(502, "EMAIL_FAILED", "We couldn't send the email right now. Please try again shortly.");
  }
  return generic;
}
