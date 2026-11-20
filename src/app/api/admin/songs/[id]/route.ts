import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

/** Admin: publish / unpublish a song. Body: { isActive: boolean } */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const parsed = z.object({ isActive: z.boolean() }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { isActive: boolean }.");

  const song = await prisma.song
    .update({ where: { id: params.id }, data: { isActive: parsed.data.isActive }, select: { id: true, isActive: true } })
    .catch(() => null);
  if (!song) return jsonError(404, "NOT_FOUND", "Song not found.");
  return jsonOk({ song });
}

/** Admin: delete a song, its stats (via cascade) and its uploaded files. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const song = await prisma.song.findUnique({ where: { id: params.id }, select: { audioUrl: true, coverUrl: true } });
  if (!song) return jsonError(404, "NOT_FOUND", "Song not found.");

  // MongoDB has no FK cascades; Prisma emulates them, but be explicit for clarity.
  await prisma.$transaction([
    prisma.listeningHistory.deleteMany({ where: { songId: params.id } }),
    prisma.favorite.deleteMany({ where: { songId: params.id } }),
    prisma.playlistSong.deleteMany({ where: { songId: params.id } }),
    prisma.song.delete({ where: { id: params.id } }),
  ]);
  await Promise.all([deleteUpload(song.audioUrl), deleteUpload(song.coverUrl)]);
  return jsonOk();
}
