import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/kit";
import { AlbumsManager } from "@/components/admin/albums-manager";

export const metadata: Metadata = { title: "Admin · Albums" };
export const dynamic = "force-dynamic";

export default async function AdminAlbumsPage() {
  const [albums, artists, songs] = await Promise.all([
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        artist: { select: { name: true } },
        songs: { select: { id: true }, orderBy: [{ trackNumber: "asc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.artist.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.song.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, artist: true, duration: true, albumId: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Albums" description="Group songs into albums with a cover image. Track order follows the tracklist." />
      <AlbumsManager
        albums={albums.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          genre: a.genre,
          releaseYear: a.releaseYear,
          coverUrl: a.coverUrl,
          palette: [a.coverFrom, a.coverTo],
          access: a.access,
          isActive: a.isActive,
          artistId: a.artistId,
          artistName: a.artist?.name ?? null,
          songIds: a.songs.map((s) => s.id),
          language: a.language,
          releaseDate: a.releaseDate?.toISOString() ?? null,
          publishAt: a.publishAt?.toISOString() ?? null,
        }))}
        artists={artists}
        songs={songs}
      />
    </>
  );
}
