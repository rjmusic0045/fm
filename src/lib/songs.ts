import "server-only";
import type { Song } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { songStats } from "@/lib/admin";
import type { SongDTO } from "@/lib/song-dto";

export function toDTO(s: Song, extra: { likes: number; listeners: number; liked?: boolean }): SongDTO {
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    genre: s.genre,
    duration: s.duration,
    audioUrl: s.audioUrl,
    coverUrl: s.coverUrl,
    palette: [s.coverFrom, s.coverTo],
    plays: s.plays,
    likes: extra.likes,
    listeners: extra.listeners,
    liked: extra.liked ?? false,
    isActive: s.isActive,
    uploaded: Boolean(s.uploadedById),
    createdAt: s.createdAt.toISOString(),
  };
}

/** Songs with stats. `userId` marks which ones that user has liked. */
export async function listSongs(opts: { includeInactive?: boolean; userId?: string } = {}): Promise<SongDTO[]> {
  const songs = await prisma.song.findMany({
    where: opts.includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  const ids = songs.map((s) => s.id);
  const [stats, liked] = await Promise.all([
    songStats(ids),
    opts.userId
      ? prisma.favorite.findMany({ where: { userId: opts.userId, type: "SONG", songId: { in: ids } }, select: { songId: true } })
      : Promise.resolve([]),
  ]);
  const likedSet = new Set(liked.map((l) => l.songId));
  return songs.map((s) => toDTO(s, { ...(stats.get(s.id) ?? { likes: 0, listeners: 0 }), liked: likedSet.has(s.id) }));
}
