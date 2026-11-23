import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/kit";
import { ArtistsManager } from "@/components/admin/artists-manager";

export const metadata: Metadata = { title: "Admin · Artists" };
export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { songs: true, albums: true, podcasts: true } } },
  });
  return (
    <>
      <PageHeader title="Artists" description="Create artists, then link songs, albums and podcasts to them." />
      <ArtistsManager
        artists={artists.map((a) => ({
          id: a.id,
          name: a.name,
          bio: a.bio,
          city: a.city,
          imageUrl: a.imageUrl,
          verified: a.verified,
          songs: a._count.songs,
          albums: a._count.albums,
          podcasts: a._count.podcasts,
        }))}
      />
    </>
  );
}
