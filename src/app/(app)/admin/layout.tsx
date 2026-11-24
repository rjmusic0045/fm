import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { prisma } from "@/lib/prisma";
import { MiniPlayer, PlayerSpacer } from "@/components/player/mini-player";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates /admin; this re-checks the role against the DB.
  const session = await getAdminSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  const pendingReviews = await prisma.voiceSubmission.count({ where: { status: "PENDING" } });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,0.04)] backdrop-blur-md">
        <div className="container flex h-16 max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="hidden text-muted-foreground md:inline">{session.user.email}</span>
            <Link href="/music" className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Listener view
            </Link>
            <SignOutButton size="sm" variant="ghost" />
          </div>
        </div>
        <div className="container max-w-6xl">
          <AdminNav pendingReviews={pendingReviews} />
        </div>
      </header>
      <main id="main" className="container max-w-6xl space-y-8 py-8">
        {children}
      </main>
      <PlayerSpacer />
      <MiniPlayer />
    </>
  );
}
