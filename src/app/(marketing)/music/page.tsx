import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listSongs } from "@/lib/songs";
import { listAlbums, listArtists, listPodcasts } from "@/lib/catalog-db";
import { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS } from "@/lib/player-constants";
import { SongList } from "@/components/music/song-list";
import { AlbumGrid, ArtistGrid, PodcastGrid } from "@/components/music/cards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Music",
  description: "Songs, albums, podcasts and artists on Lumen FM.",
};

// Stats change on every play/like: always render fresh.
export const dynamic = "force-dynamic";

const TABS = [
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "podcasts", label: "Podcasts" },
  { id: "artists", label: "Artists" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default async function MusicPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab: Tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as Tab) : "songs";
  const session = await getSession();

  let body: React.ReactNode;
  let count = "";
  if (tab === "songs") {
    const songs = await listSongs({ userId: session?.user.id });
    count = `${songs.length} songs. A play counts after ${PLAY_COUNT_SECONDS} seconds of listening.`;
    body = <SongList songs={songs} signedIn={Boolean(session)} />;
  } else if (tab === "albums") {
    const albums = await listAlbums();
    count = `${albums.length} albums`;
    body = <AlbumGrid albums={albums} />;
  } else if (tab === "podcasts") {
    const podcasts = await listPodcasts();
    count = `${podcasts.length} shows`;
    body = <PodcastGrid podcasts={podcasts} />;
  } else {
    const artists = await listArtists();
    count = `${artists.length} artists`;
    body = <ArtistGrid artists={artists} />;
  }

  return (
    <div className="container max-w-5xl pb-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Music</h1>
          <p className="mt-2 text-muted-foreground">{count}</p>
        </div>
        {!session && (
          <p className="text-sm text-muted-foreground">
            Guests hear {GUEST_PREVIEW_SECONDS}s previews.{" "}
            <Link href="/login?callbackUrl=/music" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{" "}
            to listen fully and like songs.
          </p>
        )}
      </header>

      <nav aria-label="Browse" className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "songs" ? "/music" : `/music?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {body}
    </div>
  );
}
