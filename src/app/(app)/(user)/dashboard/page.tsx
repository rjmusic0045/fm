import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Crown, Disc3, Mic2, Music2, Podcast, Settings, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlement } from "@/lib/entitlement";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Signed-in home: plan, account and quick links. (The personalised feed arrives in Phase F.) */
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const [user, ent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, emailVerified: true, role: true, passwordHash: true, accounts: { select: { provider: true } } },
    }),
    getEntitlement(session.user.id, session.user.role),
  ]);
  if (!user) redirect("/login");

  const firstName = user.name?.split(" ")[0] ?? "there";
  const methods = [...(user.passwordHash ? ["Email"] : []), ...user.accounts.map((a) => a.provider[0].toUpperCase() + a.provider.slice(1))];
  const planName = ent.plan.charAt(0) + ent.plan.slice(1).toLowerCase();

  const links = [
    { href: "/music", label: "Songs", hint: "Browse and play", icon: Music2 },
    { href: "/music?tab=albums", label: "Albums", hint: "Full records", icon: Disc3 },
    { href: "/music?tab=podcasts", label: "Podcasts", hint: "Shows and episodes", icon: Podcast },
    { href: "/music?tab=artists", label: "Artists", hint: "Who's on Lumen", icon: Mic2 },
  ];

  return (
    <div className="container max-w-6xl space-y-8 pb-16">
      <PageHero
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}`}
        description="Pick up where the music left off."
        actions={
          <>
            {user.role === "ADMIN" && (
              <Button asChild variant="glass" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Link href="/admin">
                  <ShieldCheck /> Admin panel
                </Link>
              </Button>
            )}
            <Button asChild className="bg-white text-indigo-950 shadow-none hover:bg-white/90">
              <Link href="/music">
                Start listening <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {links.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="glass group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your plan</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                {ent.state === "active" && <Crown className="size-5 text-amber-500" aria-hidden />}
                {ent.state === "none" ? "Free" : planName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ent.state === "active" && (ent.periodEnd ? `Active until ${fmt(ent.periodEnd)} · ${ent.daysLeft} days left` : "Active")}
                {ent.state === "expired" && `Ended on ${fmt(ent.periodEnd)}. Premium content plays as previews.`}
                {ent.state === "none" && "Free songs in full; Premium songs, albums and podcasts as previews."}
              </p>
            </div>
            <Button asChild variant={ent.state === "active" ? "outline" : "gradient"} size="sm">
              <Link href="/#pricing">{ent.state === "active" ? "View plans" : ent.state === "expired" ? "Renew" : "Upgrade"}</Link>
            </Button>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Account</p>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <span className="truncate">{user.email}</span>
                <Badge variant={user.emailVerified ? "violet" : "amber"}>{user.emailVerified ? "Verified" : "Unverified"}</Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sign-in methods</dt>
              <dd>{methods.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{user.role === "ADMIN" ? "Admin" : "Listener"}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </Button>
            <SignOutButton size="sm" variant="ghost" />
          </div>
        </section>
      </div>
    </div>
  );
}
