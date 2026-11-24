import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { artistSchema, boolField, field, readForm, readImage } from "@/lib/admin-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: edit an artist (multipart; any of name, bio, city, verified, image, removeImage).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Artist not found.");
  const existing = await prisma.artist.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Artist not found.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = artistSchema.safeParse({
    name: field(form, "name") ?? existing.name,
    bio: field(form, "bio") ?? existing.bio,
    city: field(form, "city") ?? existing.city,
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const image = await readImage(form, "image");
  if (image.error) return image.error;
  const removeImage = boolField(form, "removeImage") === true;
  const imageUrl = image.url ?? (removeImage ? null : existing.imageUrl);

  const artist = await prisma.artist.update({
    where: { id: params.id },
    data: { ...parsed.data, verified: boolField(form, "verified") ?? existing.verified, imageUrl },
  });
  // Keep the display name on linked songs in sync.
  if (artist.name !== existing.name) {
    await prisma.song.updateMany({ where: { artistId: artist.id }, data: { artist: artist.name } });
  }
  if (imageUrl !== existing.imageUrl) await deleteUpload(existing.imageUrl);
  return jsonOk({ artist });
}

// Admin: delete an artist. Their songs/albums/podcasts stay, just unlinked.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Artist not found.");
  const artist = await prisma.artist.findUnique({ where: { id: params.id }, select: { imageUrl: true } });
  if (!artist) return jsonError(404, "NOT_FOUND", "Artist not found.");

  await prisma.$transaction([
    prisma.song.updateMany({ where: { artistId: params.id }, data: { artistId: null } }),
    prisma.album.updateMany({ where: { artistId: params.id }, data: { artistId: null } }),
    prisma.podcast.updateMany({ where: { artistId: params.id }, data: { artistId: null } }),
    prisma.artist.delete({ where: { id: params.id } }),
  ]);
  await deleteUpload(artist.imageUrl);
  return jsonOk();
}
