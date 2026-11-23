import type { Metadata } from "next";
import { Disc3, Headphones, Heart, Mic2, Music2, Podcast, Users } from "lucide-react";
import { listSongs } from "@/lib/songs";
import { prisma } from "@/lib/prisma";
import { PLAY_COUNT_SECONDS } from "@/lib/player-constants";
import { UploadForm } from "@/components/admin/upload-form";
import { SongsTable } from "@/components/admin/songs-table";
import { PageHeader } from "@/components/admin/kit";

export const metadata: Metadata = { title: "Admin · Songs" };
export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const [songs, uniqueListeners, artists, albums, podcastCount, episodePlays, activeSubs] = await Promise.all([
    listSongs({ includeInactive: true }),
    prisma.listeningHistory.groupBy({ by: ["userId"] }).then((r) => r.length),
    prisma.artist.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.album.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.podcast.count(),
    prisma.podcastEpisode.aggregate({ _sum: { plays: true } }),
    prisma.subscription.count({ where: { plan: { not: "FREE" }, status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { gt: new Date() } } }),
  ]);

  const stats = [
    { label: "Songs", value: songs.length, icon: Music2 },
    { label: "Song plays", value: songs.reduce((n, s) => n + s.plays, 0), icon: Headphones },
    { label: "Unique listeners", value: uniqueListeners, icon: Users },
    { label: "Song likes", value: songs.reduce((n, s) => n + s.likes, 0), icon: Heart },
    { label: "Artists", value: artists.length, icon: Mic2 },
    { label: "Albums", value: albums.length, icon: Disc3 },
    { label: "Podcasts", value: podcastCount, icon: Podcast },
    { label: "Episode plays", value: episodePlays._sum.plays ?? 0, icon: Headphones },
    { label: "Active paid plans", value: activeSubs, icon: Users },
  ];
  const artistOptions = artists.map((a) => ({ id: a.id, name: a.name }));
  const albumOptions = albums.map((a) => ({ id: a.id, name: a.title }));

  return (
    <>
      <PageHeader
        title="Songs"
        description={`A play counts after ${PLAY_COUNT_SECONDS}s of listening (guests included); listeners are unique signed-in users.`}
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-xl p-4">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4" aria-hidden /> {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("en-IN")}</dd>
          </div>
        ))}
      </dl>

      <UploadForm artists={artistOptions} albums={albumOptions} />

      <section aria-labelledby="songs-heading" className="space-y-3">
        <h2 id="songs-heading" className="font-sans text-lg font-semibold">
          All songs
        </h2>
        <SongsTable songs={songs} artists={artistOptions} albums={albumOptions} />
      </section>
    </>
  );
}
