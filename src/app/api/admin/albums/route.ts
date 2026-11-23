import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { albumSchema, boolField, field, randomPalette, readForm, readImage, refField, uniqueSlug } from "@/lib/admin-forms";
import { parseSongIds, setAlbumTracks } from "@/lib/album-tracks";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Admin: create an album.
 * Multipart: title, artistId?, description?, genre?, releaseYear?, access?, isActive?, cover?, songIds? (JSON array, in order)
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = albumSchema.safeParse({
    title: field(form, "title"),
    description: field(form, "description") ?? "",
    genre: field(form, "genre") || "Pop",
    releaseYear: field(form, "releaseYear") || null,
    access: field(form, "access") || "FREE",
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const artistId = refField(form, "artistId") ?? null;
  if (artistId && !(await prisma.artist.count({ where: { id: artistId } }))) {
    return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
  }
  const cover = await readImage(form, "cover");
  if (cover.error) return cover.error;

  try {
    const [coverFrom, coverTo] = randomPalette();
    const album = await prisma.album.create({
      data: {
        ...parsed.data,
        slug: uniqueSlug(parsed.data.title),
        artistId,
        coverUrl: cover.url,
        coverFrom,
        coverTo,
        isActive: boolField(form, "isActive") ?? true,
      },
    });
    const songIds = parseSongIds(field(form, "songIds"));
    if (songIds?.length) await setAlbumTracks(album.id, album.title, songIds);
    return jsonOk({ album }, { status: 201 });
  } catch (err) {
    console.error("[admin/albums] create failed", err);
    await deleteUpload(cover.url);
    return jsonError(500, "SAVE_FAILED", "Couldn't save the album.");
  }
}
