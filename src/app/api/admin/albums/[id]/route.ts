import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { albumSchema, boolField, field, readForm, readImage, refField } from "@/lib/admin-forms";
import { parseSongIds, setAlbumTracks } from "@/lib/album-tracks";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

/** Admin: edit an album (multipart, any subset of the create fields; plus removeCover). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Album not found.");
  const existing = await prisma.album.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Album not found.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const year = field(form, "releaseYear");
  const parsed = albumSchema.safeParse({
    title: field(form, "title") ?? existing.title,
    description: field(form, "description") ?? existing.description,
    genre: field(form, "genre") || existing.genre,
    releaseYear: year === undefined ? existing.releaseYear : year || null,
    access: field(form, "access") || existing.access,
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const artistRef = refField(form, "artistId");
  if (artistRef && !(await prisma.artist.count({ where: { id: artistRef } }))) {
    return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
  }
  const cover = await readImage(form, "cover");
  if (cover.error) return cover.error;
  const coverUrl = cover.url ?? (boolField(form, "removeCover") ? null : existing.coverUrl);

  const album = await prisma.album.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      artistId: artistRef === undefined ? existing.artistId : artistRef,
      coverUrl,
      isActive: boolField(form, "isActive") ?? existing.isActive,
    },
  });

  const songIds = parseSongIds(field(form, "songIds"));
  if (songIds) await setAlbumTracks(album.id, album.title, songIds);
  else if (album.title !== existing.title) {
    await prisma.song.updateMany({ where: { albumId: album.id }, data: { album: album.title } });
  }
  if (coverUrl !== existing.coverUrl) await deleteUpload(existing.coverUrl);
  return jsonOk({ album });
}

/** Admin: delete an album. Its songs are kept as singles. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Album not found.");
  const album = await prisma.album.findUnique({ where: { id: params.id }, select: { coverUrl: true } });
  if (!album) return jsonError(404, "NOT_FOUND", "Album not found.");

  await prisma.$transaction([
    prisma.song.updateMany({ where: { albumId: params.id }, data: { albumId: null, trackNumber: null, album: "Single" } }),
    prisma.album.delete({ where: { id: params.id } }),
  ]);
  await deleteUpload(album.coverUrl);
  return jsonOk();
}
