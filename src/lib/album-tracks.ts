import "server-only";
import { prisma } from "@/lib/prisma";

// Parses the "songIds" form field: a JSON array of song ids in track order.
export function parseSongIds(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  try {
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return undefined;
    return [...new Set(ids.filter((x): x is string => typeof x === "string" && /^[a-f0-9]{24}$/i.test(x)))];
  } catch {
    return undefined;
  }
}

// Makes `songIds` (in order) the album's tracklist: numbers them 1..n, sets
// their album display name, and detaches songs no longer listed.
export async function setAlbumTracks(albumId: string, albumTitle: string, songIds: string[]) {
  await prisma.song.updateMany({
    where: { albumId, id: { notIn: songIds } },
    data: { albumId: null, trackNumber: null, album: "Single" },
  });
  await Promise.all(
    songIds.map((id, i) =>
      prisma.song.update({ where: { id }, data: { albumId, trackNumber: i + 1, album: albumTitle } }).catch(() => undefined),
    ),
  );
}
