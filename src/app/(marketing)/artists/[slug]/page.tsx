import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft, MapPin, UserRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getArtist, listAlbums, listPodcasts } from "@/lib/catalog-db";
import { listSongs } from "@/lib/songs";
import { SongList } from "@/components/music/song-list";
import { AlbumGrid, PodcastGrid } from "@/components/music/cards";
import { PlayAllButton } from "@/components/music/play-all-button";
import { CoverHero } from "@/components/layout/page-hero";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArtist(params.slug);
  return a ? { title: a.name, description: a.bio.slice(0, 160) } : { title: "Artist not found" };
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await getArtist(params.slug);
  if (!artist) notFound();
  const session = await getSession();
  const [songs, albums, podcasts] = await Promise.all([
    listSongs({ artistId: artist.id, userId: session?.user.id }),
    listAlbums({ artistId: artist.id }),
    listPodcasts({ artistId: artist.id }),
  ]);

  return (
    <div className="container max-w-5xl space-y-10 pb-16">
      <Link href="/music?tab=artists" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Artists
      </Link>
      <CoverHero image={artist.imageUrl} palette={["#4F46E5", "#7C3AED"]}>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
        {artist.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artist.imageUrl} alt={`${artist.name} photo`} className="size-40 shrink-0 rounded-full object-cover shadow-2xl ring-4 ring-white/20" />
        ) : (
          <span className="grid size-40 shrink-0 place-items-center rounded-full bg-white/15 text-white/80 ring-4 ring-white/20">
            <UserRound className="size-16" aria-hidden />
          </span>
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Artist</p>
          <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-5xl">
            {artist.name}
            {artist.verified && <BadgeCheck className="size-7 shrink-0 text-sky-300" aria-label="Verified artist" />}
          </h1>
          {artist.city && (
            <p className="flex items-center gap-1 text-white/80">
              <MapPin className="size-4" aria-hidden /> {artist.city}
            </p>
          )}
          {artist.bio && <p className="line-clamp-4 max-w-2xl whitespace-pre-line text-sm text-white/75">{artist.bio}</p>}
          <div className="pt-2">
            <PlayAllButton songs={songs} />
          </div>
        </div>
      </div>
      </CoverHero>

      <section aria-labelledby="artist-songs" className="space-y-3">
        <h2 id="artist-songs" className="font-sans text-lg font-semibold">
          Songs
        </h2>
        <SongList songs={songs} signedIn={Boolean(session)} />
      </section>
      {albums.length > 0 && (
        <section aria-labelledby="artist-albums" className="space-y-3">
          <h2 id="artist-albums" className="font-sans text-lg font-semibold">
            Albums
          </h2>
          <AlbumGrid albums={albums} />
        </section>
      )}
      {podcasts.length > 0 && (
        <section aria-labelledby="artist-podcasts" className="space-y-3">
          <h2 id="artist-podcasts" className="font-sans text-lg font-semibold">
            Podcasts
          </h2>
          <PodcastGrid podcasts={podcasts} />
        </section>
      )}
    </div>
  );
}
