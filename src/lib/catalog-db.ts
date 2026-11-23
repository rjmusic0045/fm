import "server-only";
import { prisma } from "@/lib/prisma";
import type { Palette } from "@/data/catalog";

/** Read models for the public Albums / Podcasts / Artists pages (published items only). */

export interface AlbumCard {
  id: string;
  slug: string;
  title: string;
  artistName: string | null;
  artistSlug: string | null;
  releaseYear: number | null;
  genre: string;
  coverUrl: string | null;
  palette: Palette;
  access: "FREE" | "PREMIUM";
  trackCount: number;
}

export interface PodcastCard {
  id: string;
  slug: string;
  title: string;
  host: string;
  category: string;
  coverUrl: string | null;
  palette: Palette;
  access: "FREE" | "PREMIUM";
  episodeCount: number;
}

export interface EpisodeDTO {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  duration: number;
  audioUrl: string;
  plays: number;
  publishedAt: string;
}

export interface ArtistCard {
  id: string;
  slug: string;
  name: string;
  city: string;
  imageUrl: string | null;
  verified: boolean;
  songCount: number;
}

const albumInclude = {
  artist: { select: { name: true, slug: true } },
  _count: { select: { songs: { where: { isActive: true } } } },
} as const;

type AlbumWithRefs = Awaited<ReturnType<typeof prisma.album.findFirst<{ include: typeof albumInclude }>>>;

const toAlbumCard = (a: NonNullable<AlbumWithRefs>): AlbumCard => ({
  id: a.id,
  slug: a.slug,
  title: a.title,
  artistName: a.artist?.name ?? null,
  artistSlug: a.artist?.slug ?? null,
  releaseYear: a.releaseYear,
  genre: a.genre,
  coverUrl: a.coverUrl,
  palette: [a.coverFrom, a.coverTo],
  access: a.access,
  trackCount: a._count.songs,
});

export async function listAlbums(opts: { artistId?: string } = {}): Promise<AlbumCard[]> {
  const rows = await prisma.album.findMany({
    where: { isActive: true, ...(opts.artistId ? { artistId: opts.artistId } : {}) },
    orderBy: { createdAt: "desc" },
    include: albumInclude,
  });
  return rows.map(toAlbumCard);
}

export async function getAlbum(slug: string) {
  const a = await prisma.album.findFirst({ where: { slug, isActive: true }, include: albumInclude });
  return a ? { ...toAlbumCard(a), description: a.description } : null;
}

const podcastInclude = { _count: { select: { episodes: { where: { isActive: true } } } } } as const;

export async function listPodcasts(opts: { artistId?: string } = {}): Promise<PodcastCard[]> {
  const rows = await prisma.podcast.findMany({
    where: { isActive: true, ...(opts.artistId ? { artistId: opts.artistId } : {}) },
    orderBy: { createdAt: "desc" },
    include: podcastInclude,
  });
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    host: p.host,
    category: p.category,
    coverUrl: p.coverUrl,
    palette: [p.coverFrom, p.coverTo],
    access: p.access,
    episodeCount: p._count.episodes,
  }));
}

export async function getPodcast(slug: string) {
  const p = await prisma.podcast.findFirst({
    where: { slug, isActive: true },
    include: { episodes: { where: { isActive: true }, orderBy: { episodeNumber: "desc" } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    host: p.host,
    description: p.description,
    category: p.category,
    coverUrl: p.coverUrl,
    palette: [p.coverFrom, p.coverTo] as Palette,
    access: p.access,
    episodes: p.episodes.map(
      (e): EpisodeDTO => ({
        id: e.id,
        title: e.title,
        description: e.description,
        episodeNumber: e.episodeNumber,
        duration: e.duration,
        audioUrl: e.audioUrl,
        plays: e.plays,
        publishedAt: e.publishedAt.toISOString(),
      }),
    ),
  };
}

export async function listArtists(): Promise<ArtistCard[]> {
  const rows = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { songs: { where: { isActive: true } } } } },
  });
  return rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    city: a.city,
    imageUrl: a.imageUrl,
    verified: a.verified,
    songCount: a._count.songs,
  }));
}

export async function getArtist(slug: string) {
  return prisma.artist.findUnique({ where: { slug } });
}
