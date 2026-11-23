import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { issueVerificationEmail } from "@/lib/verification";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";

/** Re-sends the verification email to the signed-in user. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true, emailVerified: true } });
  if (!user) return jsonError(404, "NOT_FOUND", "Account not found.");
  if (user.emailVerified) return jsonOk({ alreadyVerified: true });

  const limit = await rateLimit(`verify-resend:${session.user.id}`, 3, 60 * 60);
  if (!limit.allowed) return jsonError(429, "RATE_LIMITED", "You've requested a few emails already. Try again in a while.");

  try {
    await issueVerificationEmail(user.email, user.name);
  } catch (err) {
    console.error("[verify-resend] email failed", err);
    return jsonError(502, "EMAIL_FAILED", "We couldn't send the email right now. Please try again shortly.");
  }
  return jsonOk();
}
