import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { boolField, field, podcastSchema, randomPalette, isFieldError, languageField, readForm, readImage, refField, uniqueSlug } from "@/lib/admin-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: create a podcast show (multipart: title, host?, artistId?, description?, category?, access?, isActive?, cover?).
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = podcastSchema.safeParse({
    title: field(form, "title"),
    host: field(form, "host") ?? "",
    description: field(form, "description") ?? "",
    category: field(form, "category") || "Talk",
    access: field(form, "access") || "FREE",
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const artistId = refField(form, "artistId") ?? null;
  if (artistId && !(await prisma.artist.count({ where: { id: artistId } }))) {
    return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
  }
  const language = languageField(form);
  if (isFieldError(language)) return jsonError(400, "INVALID_INPUT", language.error);
  const cover = await readImage(form, "cover");
  if (cover.error) return cover.error;

  try {
    const [coverFrom, coverTo] = randomPalette();
    const podcast = await prisma.podcast.create({
      data: {
        ...parsed.data,
        slug: uniqueSlug(parsed.data.title),
        artistId,
        coverUrl: cover.url,
        coverFrom,
        coverTo,
        isActive: boolField(form, "isActive") ?? true,
        language: language ?? null,
      },
    });
    return jsonOk({ podcast }, { status: 201 });
  } catch (err) {
    console.error("[admin/podcasts] create failed", err);
    await deleteUpload(cover.url);
    return jsonError(500, "SAVE_FAILED", "Couldn't save the podcast.");
  }
}
