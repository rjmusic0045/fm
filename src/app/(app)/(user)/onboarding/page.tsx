import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingFlow } from "@/components/account/onboarding-flow";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/onboarding");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, favoriteGenres: true, preferredLanguages: true },
  });
  if (!user) redirect("/login");
  return <OnboardingFlow name={user.name} initialGenres={user.favoriteGenres} initialLanguages={user.preferredLanguages} />;
}
