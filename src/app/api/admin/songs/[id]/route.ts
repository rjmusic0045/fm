import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  artist: z.string().trim().min(1).max(120).optional(),
  genre: z.string().trim().min(1).max(40).optional(),
  access: z.enum(["FREE", "PREMIUM"]).optional(),
  isActive: z.boolean().optional(),
  /** null unlinks */
  artistId: objectId.nullable().optional(),
  albumId: objectId.nullable().optional(),
});

/**
 * Admin: edit a song. JSON body: any of title, artist, genre, access, isActive,
 * artistId (null = unlink), albumId (null = make it a single).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Check the song fields.");
  const { artistId, albumId, ...rest } = parsed.data;

  const existing = await prisma.song.findUnique({ where: { id: params.id }, select: { albumId: true } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Song not found.");

  const data: Record<string, unknown> = { ...rest };
  if (artistId !== undefined) {
    data.artistId = artistId;
    if (artistId) {
      const a = await prisma.artist.findUnique({ where: { id: artistId }, select: { name: true } });
      if (!a) return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
      data.artist = a.name;
    }
  }
  if (albumId !== undefined && albumId !== existing.albumId) {
    data.albumId = albumId;
    if (albumId) {
      const al = await prisma.album.findUnique({ where: { id: albumId }, select: { title: true, _count: { select: { songs: true } } } });
      if (!al) return jsonError(400, "INVALID_INPUT", "Choose an existing album.");
      data.album = al.title;
      data.trackNumber = al._count.songs + 1;
    } else {
      data.album = "Single";
      data.trackNumber = null;
    }
  }

  const song = await prisma.song.update({ where: { id: params.id }, data }).catch(() => null);
  if (!song) return jsonError(404, "NOT_FOUND", "Song not found.");
  return jsonOk({ song });
}

/** Admin: delete a song, its stats and its uploaded files. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const song = await prisma.song.findUnique({ where: { id: params.id }, select: { audioUrl: true, coverUrl: true } });
  if (!song) return jsonError(404, "NOT_FOUND", "Song not found.");

  await prisma.$transaction([
    prisma.listeningHistory.deleteMany({ where: { songId: params.id } }),
    prisma.favorite.deleteMany({ where: { songId: params.id } }),
    prisma.playlistSong.deleteMany({ where: { songId: params.id } }),
    prisma.song.delete({ where: { id: params.id } }),
  ]);
  await Promise.all([deleteUpload(song.audioUrl), deleteUpload(song.coverUrl)]);
  return jsonOk();
}
