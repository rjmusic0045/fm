import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones, Heart, Music2, Users } from "lucide-react";
import { getAdminSession } from "@/lib/admin";
import { listSongs } from "@/lib/songs";
import { prisma } from "@/lib/prisma";
import { PLAY_COUNT_SECONDS } from "@/lib/player-constants";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UploadForm } from "@/components/admin/upload-form";
import { SongsTable } from "@/components/admin/songs-table";
import { MiniPlayer, PlayerSpacer } from "@/components/player/mini-player";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Middleware already gates /admin; this re-checks the role against the DB.
  const session = await getAdminSession();
  if (!session) redirect("/login?callbackUrl=/admin");

  const [songs, uniqueListeners] = await Promise.all([
    listSongs({ includeInactive: true }),
    prisma.listeningHistory.groupBy({ by: ["userId"], where: { songId: { not: null } } }).then((r) => r.length),
  ]);

  const stats = [
    { label: "Songs", value: songs.length, icon: Music2 },
    { label: "Total plays", value: songs.reduce((n, s) => n + s.plays, 0), icon: Headphones },
    { label: "Unique listeners", value: uniqueListeners, icon: Users },
    { label: "Total likes", value: songs.reduce((n, s) => n + s.likes, 0), icon: Heart },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/music" className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Listener view
            </Link>
            <SignOutButton size="sm" variant="ghost" />
          </nav>
        </div>
      </header>

      <main id="main" className="container max-w-6xl space-y-8 py-8">
        <div>
          <h1 className="text-3xl font-semibold">Music library</h1>
          <p className="mt-1 text-muted-foreground">
            Signed in as {session.user.email}. A play counts after {PLAY_COUNT_SECONDS}s of listening (guests included);
            listeners are unique signed-in users.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" aria-hidden /> {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("en-IN")}</dd>
            </div>
          ))}
        </dl>

        <UploadForm />

        <section aria-labelledby="songs-heading" className="space-y-3">
          <h2 id="songs-heading" className="font-sans text-lg font-semibold">
            All songs
          </h2>
          <SongsTable songs={songs} />
        </section>
      </main>
      <PlayerSpacer />
      <MiniPlayer />
    </>
  );
}
