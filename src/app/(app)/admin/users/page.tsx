import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ACTIVE_SESSION_WINDOW_MS } from "@/lib/auth-errors";
import { PageHeader } from "@/components/admin/kit";
import { UsersManager } from "@/components/admin/users-manager";

export const metadata: Metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      activeSessionId: true,
      lastSeenAt: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true, stripeCustomerId: true } },
    },
  });
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Users & plans"
        description="Grant or renew Premium/Family plans (no payment gateway yet), end plans, and sign users out. One device per account."
      />
      <UsersManager
        users={users.map((u) => {
          const s = u.subscription;
          const paid = s && s.plan !== "FREE";
          const active =
            paid && (s.status === "ACTIVE" || s.status === "TRIALING") && (!s.currentPeriodEnd || s.currentPeriodEnd.getTime() > now);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt.toISOString(),
            lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
            online: Boolean(u.activeSessionId && u.lastSeenAt && now - u.lastSeenAt.getTime() < ACTIVE_SESSION_WINDOW_MS),
            plan: s?.plan ?? "FREE",
            planState: !paid ? "none" : active ? "active" : "expired",
            periodEnd: s?.currentPeriodEnd?.toISOString() ?? null,
            manual: Boolean(s?.stripeCustomerId.startsWith("manual:")),
          };
        })}
      />
    </>
  );
}
