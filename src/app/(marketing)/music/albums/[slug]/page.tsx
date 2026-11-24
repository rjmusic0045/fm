import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getAlbum } from "@/lib/catalog-db";
import { listSongs } from "@/lib/songs";
import { formatDuration } from "@/lib/utils";
import { CoverArt } from "@/components/player/cover-art";
import { SongList } from "@/components/music/song-list";
import { PlayAllButton } from "@/components/music/play-all-button";
import { PremiumBadge } from "@/components/music/cards";
import { CoverHero } from "@/components/layout/page-hero";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const album = await getAlbum(params.slug);
  return album ? { title: `${album.title}${album.artistName ? ` · ${album.artistName}` : ""}` } : { title: "Album not found" };
}

export default async function AlbumPage({ params }: { params: { slug: string } }) {
  const album = await getAlbum(params.slug);
  if (!album) notFound();
  const session = await getSession();
  const songs = await listSongs({ albumId: album.id, userId: session?.user.id });
  const total = songs.reduce((n, s) => n + s.duration, 0);

  return (
    <div className="container max-w-5xl space-y-8 pb-16">
      <Link href="/music?tab=albums" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Albums
      </Link>
      <CoverHero image={album.coverUrl} palette={album.palette}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <CoverArt title={album.title} palette={album.palette} image={album.coverUrl ?? undefined} className="w-44 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/20 sm:w-56" />
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Album</p>
          <h1 className="text-3xl font-semibold sm:text-5xl">{album.title}</h1>
          <p className="text-white/80">
            {album.artistSlug ? (
              <Link href={`/artists/${album.artistSlug}`} className="font-semibold text-white hover:underline">
                {album.artistName}
              </Link>
            ) : (
              "Various artists"
            )}
            {album.releaseYear ? ` · ${album.releaseYear}` : ""} · {album.genre}
            {album.language ? ` · ${album.language}` : ""} · {songs.length} tracks
            {total ? ` · ${formatDuration(total)}` : ""}
          </p>
          {album.access === "PREMIUM" && <PremiumBadge />}
          {album.description && <p className="max-w-2xl text-sm text-white/75">{album.description}</p>}
          <div className="pt-2">
            <PlayAllButton songs={songs} />
          </div>
        </div>
      </div>
      </CoverHero>
      <SongList songs={songs} signedIn={Boolean(session)} />
    </div>
  );
}
