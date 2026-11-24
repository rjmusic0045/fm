import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlement } from "@/lib/entitlement";
import { SettingsPanels } from "@/components/account/settings-panels";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/settings");
  const [user, ent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        passwordHash: true,
        favoriteGenres: true,
        preferredLanguages: true,
        audioQuality: true,
        accounts: { select: { provider: true } },
      },
    }),
    getEntitlement(session.user.id, session.user.role),
  ]);
  if (!user) redirect("/login");

  const methods = [...(user.passwordHash ? ["Email & password"] : []), ...user.accounts.map((a) => a.provider[0].toUpperCase() + a.provider.slice(1))];
  return (
    <div className="container max-w-3xl space-y-6 pb-16">
      <PageHero eyebrow="Account" title="Settings" description="Your profile, listening preferences, subscription and security." />
      <SettingsPanels
        data={{
          name: user.name ?? "",
          email: user.email,
          emailVerified: Boolean(user.emailVerified),
          hasPassword: Boolean(user.passwordHash),
          signInMethods: methods,
          favoriteGenres: user.favoriteGenres,
          preferredLanguages: user.preferredLanguages,
          audioQuality: user.audioQuality,
          plan: {
            name: ent.plan.charAt(0) + ent.plan.slice(1).toLowerCase(),
            state: ent.state,
            periodEnd: ent.periodEnd,
            daysLeft: ent.daysLeft,
            canPlayPremium: ent.canPlayPremium,
          },
        }}
      />
    </div>
  );
}
