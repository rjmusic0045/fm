import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPodcast } from "@/lib/catalog-db";
import { CoverArt } from "@/components/player/cover-art";
import { EpisodeList } from "@/components/music/episode-list";
import { PlayAllButton } from "@/components/music/play-all-button";
import { PremiumBadge } from "@/components/music/cards";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPodcast(params.slug);
  return p ? { title: p.title, description: p.description.slice(0, 160) } : { title: "Podcast not found" };
}

export default async function PodcastPage({ params }: { params: { slug: string } }) {
  const podcast = await getPodcast(params.slug);
  if (!podcast) notFound();
  const show = { title: podcast.title, coverUrl: podcast.coverUrl, palette: podcast.palette, premium: podcast.access === "PREMIUM" };

  return (
    <div className="container max-w-4xl space-y-8 pb-16">
      <Link href="/music?tab=podcasts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> Podcasts
      </Link>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <CoverArt title={podcast.title} palette={podcast.palette} image={podcast.coverUrl ?? undefined} className="w-48 shrink-0 rounded-2xl shadow-lg" />
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Podcast · {podcast.category}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{podcast.title}</h1>
          {podcast.host && <p className="text-muted-foreground">Hosted by {podcast.host}</p>}
          {podcast.access === "PREMIUM" && <PremiumBadge />}
          {podcast.description && <p className="max-w-2xl whitespace-pre-line text-sm text-muted-foreground">{podcast.description}</p>}
          <div className="pt-2">
            <PlayAllButton episodes={podcast.episodes} show={show} />
          </div>
        </div>
      </header>
      <section aria-labelledby="episodes-heading" className="space-y-3">
        <h2 id="episodes-heading" className="font-sans text-lg font-semibold">
          {podcast.episodes.length} episodes
        </h2>
        <EpisodeList episodes={podcast.episodes} show={show} />
      </section>
    </div>
  );
}
