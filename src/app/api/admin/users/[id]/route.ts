import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

const DAY = 24 * 60 * 60 * 1000;

const bodySchema = z.discriminatedUnion("action", [
  // Grant or renew a paid plan for N days from today (or from the current end, if still active).
  z.object({ action: z.literal("grant"), plan: z.enum(["PREMIUM", "FAMILY"]), days: z.number().int().min(1).max(3660) }),
  // End the plan now (keeps the record so the user sees the "plan ended" notice).
  z.object({ action: z.literal("expire") }),
  // Remove the plan entirely (back to Free, no notice).
  z.object({ action: z.literal("remove") }),
  // Sign the user out of every device.
  z.object({ action: z.literal("signout") }),
  z.object({ action: z.literal("role"), role: z.enum(["USER", "ADMIN"]) }),
  // Deactivate (blocks sign-in, ends sessions) or reactivate an account.
  z.object({ action: z.literal("disable") }),
  z.object({ action: z.literal("enable") }),
]);

// Admin: manage a user's plan and sessions (no payment gateway yet, so
// admins grant/renew subscriptions by hand).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const admin = await getAdminSession();
  if (!admin) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "User not found.");
  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Unknown action.");
  const body = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, subscription: true } });
  if (!user) return jsonError(404, "NOT_FOUND", "User not found.");

  switch (body.action) {
    case "grant": {
      const current = user.subscription;
      const now = Date.now();
      const stillActive =
        current && current.plan !== "FREE" && current.currentPeriodEnd && current.currentPeriodEnd.getTime() > now &&
        (current.status === "ACTIVE" || current.status === "TRIALING");
      const from = stillActive ? current!.currentPeriodEnd!.getTime() : now;
      const data = {
        plan: body.plan,
        status: "ACTIVE" as const,
        currentPeriodEnd: new Date(from + body.days * DAY),
        cancelAtPeriodEnd: false,
      };
      await prisma.subscription.upsert({
        where: { userId: user.id },
        // No Stripe customer yet: a unique placeholder marks admin-granted plans.
        create: { userId: user.id, stripeCustomerId: `manual:${user.id}`, ...data },
        update: data,
      });
      break;
    }
    case "expire":
      if (!user.subscription) return jsonError(400, "INVALID_INPUT", "This user has no plan.");
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { status: "CANCELED", currentPeriodEnd: new Date() },
      });
      break;
    case "remove":
      await prisma.subscription.deleteMany({ where: { userId: user.id } });
      break;
    case "signout":
      await prisma.user.update({ where: { id: user.id }, data: { activeSessionId: null, lastSeenAt: null } });
      break;
    case "disable":
      if (user.id === admin.user.id) return jsonError(400, "INVALID_INPUT", "You can't deactivate your own account.");
      await prisma.user.update({ where: { id: user.id }, data: { disabled: true, activeSessionId: null, lastSeenAt: null } });
      break;
    case "enable":
      await prisma.user.update({ where: { id: user.id }, data: { disabled: false } });
      break;
    case "role":
      if (user.id === admin.user.id && body.role !== "ADMIN") {
        return jsonError(400, "INVALID_INPUT", "You can't remove your own admin role.");
      }
      await prisma.user.update({ where: { id: user.id }, data: { role: body.role } });
      break;
  }
  return jsonOk();
}
