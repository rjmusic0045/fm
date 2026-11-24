import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listSongs } from "@/lib/songs";
import { listAlbums, listArtists, listPodcasts } from "@/lib/catalog-db";
import { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS } from "@/lib/player-constants";
import { SongList } from "@/components/music/song-list";
import { AlbumGrid, ArtistGrid, PodcastGrid } from "@/components/music/cards";
import { HeroTabs, PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

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
    <div className="container max-w-6xl space-y-8 pb-16">
      <PageHero
        eyebrow="Browse"
        title="Music"
        description={
          <>
            {count}
            {!session && <span className="mt-1 block text-sm text-indigo-200/80">Guests hear {GUEST_PREVIEW_SECONDS}-second previews. Sign in to listen in full and like songs.</span>}
          </>
        }
        actions={
          !session && (
            <Button asChild variant="glass" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/login?callbackUrl=/music">Sign in</Link>
            </Button>
          )
        }
      >
        <HeroTabs active={tab} tabs={TABS.map((t) => ({ id: t.id, label: t.label, href: t.id === "songs" ? "/music" : `/music?tab=${t.id}` }))} />
      </PageHero>

      {body}
    </div>
  );
}
