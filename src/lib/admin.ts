import "server-only";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns the session only if the signed-in user is an ADMIN. Re-checks the
// role in the database so a demoted admin loses access immediately, even
// though their JWT still says ADMIN.
export async function getAdminSession() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === "ADMIN" ? session : null;
}

export const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

export interface SongStats {
  plays: number;
  listeners: number;
  likes: number;
}

// Per-song unique listeners (signed-in users) and like counts, keyed by song id.
export async function songStats(songIds: string[]): Promise<Map<string, Omit<SongStats, "plays">>> {
  const map = new Map<string, Omit<SongStats, "plays">>();
  if (!songIds.length) return map;
  const [listenerPairs, likeCounts] = await Promise.all([
    prisma.listeningHistory.groupBy({ by: ["songId", "userId"], where: { songId: { in: songIds } } }),
    prisma.favorite.groupBy({ by: ["songId"], where: { type: "SONG", songId: { in: songIds } }, _count: { _all: true } }),
  ]);
  for (const id of songIds) map.set(id, { listeners: 0, likes: 0 });
  for (const p of listenerPairs) if (p.songId) map.get(p.songId)!.listeners += 1;
  for (const l of likeCounts) if (l.songId) map.get(l.songId)!.likes = l._count._all;
  return map;
}
