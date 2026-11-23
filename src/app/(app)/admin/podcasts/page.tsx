import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/kit";
import { PodcastsManager } from "@/components/admin/podcasts-manager";

export const metadata: Metadata = { title: "Admin · Podcasts" };
export const dynamic = "force-dynamic";

export default async function AdminPodcastsPage() {
  const [podcasts, artists] = await Promise.all([
    prisma.podcast.findMany({ orderBy: { createdAt: "desc" }, include: { episodes: true } }),
    prisma.artist.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Podcasts" description="Shows and their episodes, kept separate from music." />
      <PodcastsManager
        artists={artists}
        podcasts={podcasts.map((p) => ({
          id: p.id,
          title: p.title,
          host: p.host,
          description: p.description,
          category: p.category,
          coverUrl: p.coverUrl,
          palette: [p.coverFrom, p.coverTo],
          access: p.access,
          isActive: p.isActive,
          artistId: p.artistId,
          episodes: p.episodes.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            episodeNumber: e.episodeNumber,
            duration: e.duration,
            plays: e.plays,
            isActive: e.isActive,
            publishedAt: e.publishedAt.toISOString(),
          })),
        }))}
      />
    </>
  );
}
