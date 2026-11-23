import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/tokens";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signupSchema, fieldErrors } from "@/lib/validations/auth";
import { issueVerificationEmail } from "@/lib/verification";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

/**
 * Creates an email/password account. The client signs in right after and is
 * routed to onboarding (User.onboarded = false). A verification email is sent,
 * but signing in does not wait for it.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");

  const ip = clientIp(req.headers);
  const limit = await rateLimit(`signup:ip:${ip}`, 10, 60 * 60);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many sign-ups from this network. Please try again later.", {
      "Retry-After": String(limit.retryAfter),
    });
  }

  const parsed = signupSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const errors = fieldErrors<string>(parsed.error);
    return Response.json(
      { ok: false, code: "INVALID_INPUT", message: Object.values(errors)[0] ?? "Check the form.", errors },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return jsonError(409, "EMAIL_TAKEN", "An account with this email already exists. Sign in instead, or reset your password.");
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), onboarded: false },
    select: { id: true, email: true, name: true },
  });

  try {
    await issueVerificationEmail(user.email, user.name);
  } catch (err) {
    // The account exists either way; the user can resend from Settings.
    console.error("[register] verification email failed", err);
  }
  return jsonOk({ userId: user.id }, { status: 201 });
}
