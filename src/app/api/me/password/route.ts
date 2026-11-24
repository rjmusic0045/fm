import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/tokens";
import { passwordSchema } from "@/lib/validations/auth";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

// Changes (or, for Facebook-only accounts, sets) the signed-in user's password.
// Body: { currentPassword?: string, newPassword: string }
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");

  const limit = await rateLimit(`password-change:${session.user.id}`, 5, 15 * 60);
  if (!limit.allowed) return jsonError(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.");

  const parsed = z
    .object({ currentPassword: z.string().max(128).optional(), newPassword: passwordSchema })
    .safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the password.");
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (!user) return jsonError(404, "NOT_FOUND", "Account not found.");
  if (user.passwordHash) {
    if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return jsonError(400, "INVALID_CREDENTIALS", "Your current password is incorrect.");
    }
    if (await verifyPassword(newPassword, user.passwordHash)) {
      return jsonError(400, "INVALID_INPUT", "Choose a password you haven't used for this account.");
    }
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  return jsonOk({ message: "Password updated." });
}
