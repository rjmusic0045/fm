import "server-only";
import type { Plan, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SubscriptionState = "none" | "active" | "expired";

export interface Entitlement {
  plan: Plan;
  state: SubscriptionState;
  // ISO date the current/last paid period ends (null = open-ended or none).
  periodEnd: string | null;
  // Whole days left in the period (active only).
  daysLeft: number | null;
  // May stream PREMIUM items in full. Admins always can.
  canPlayPremium: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

export const FREE_ENTITLEMENT: Entitlement = { plan: "FREE", state: "none", periodEnd: null, daysLeft: null, canPlayPremium: false };

// Works out what a user may play from their Subscription row.
export async function getEntitlement(userId: string | null | undefined, role?: Role): Promise<Entitlement> {
  if (!userId) return FREE_ENTITLEMENT;
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, currentPeriodEnd: true },
  });
  const isAdmin = role === "ADMIN";
  if (!sub || sub.plan === "FREE") return { ...FREE_ENTITLEMENT, canPlayPremium: isAdmin };

  const now = Date.now();
  const end = sub.currentPeriodEnd?.getTime() ?? null;
  const paidStatus = sub.status === "ACTIVE" || sub.status === "TRIALING";
  const active = paidStatus && (end === null || end > now);

  return {
    plan: sub.plan,
    state: active ? "active" : "expired",
    periodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    daysLeft: active && end !== null ? Math.max(0, Math.ceil((end - now) / DAY)) : null,
    canPlayPremium: active || isAdmin,
  };
}
