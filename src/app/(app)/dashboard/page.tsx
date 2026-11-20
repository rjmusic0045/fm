import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Phase 4 landing spot after sign-in: proves the session round-trip end to end.
 * The full dashboard (sidebar, For You rows, Now Playing) replaces this in Phase 6.
 */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerified: true, role: true, passwordHash: true, accounts: { select: { provider: true } } },
  });
  if (!user) redirect("/login");

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <main id="main" className="container flex min-h-dvh items-center justify-center py-16">
      <GlassCard gradientBorder className="w-full max-w-lg p-8">
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-neon-gradient shadow-glow">
          <Radio className="size-6 text-white" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold">Welcome back, {firstName}</h1>
        <p className="mt-2 text-muted-foreground">You&apos;re signed in. Your full dashboard is on its way.</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="flex items-center gap-2 truncate">
              {user.email}
              <Badge variant={user.emailVerified ? "violet" : "amber"}>{user.emailVerified ? "Verified" : "Unverified"}</Badge>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Sign-in methods</dt>
            <dd>{[...(user.passwordHash ? ["Email"] : []), ...user.accounts.map((a) => a.provider[0].toUpperCase() + a.provider.slice(1))].join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {user.role === "ADMIN" && (
            <Button asChild>
              <Link href="/admin">Admin panel</Link>
            </Button>
          )}
          <Button asChild variant={user.role === "ADMIN" ? "outline" : "gradient"}>
            <Link href="/music">Listen to music</Link>
          </Button>
          <SignOutButton />
        </div>
      </GlassCard>
    </main>
  );
}
