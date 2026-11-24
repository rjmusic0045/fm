import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { artistSchema, boolField, field, readForm, readImage, uniqueSlug } from "@/lib/admin-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: create an artist (multipart: name, bio?, city?, verified?, image?).
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = artistSchema.safeParse({ name: field(form, "name"), bio: field(form, "bio") ?? "", city: field(form, "city") ?? "" });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const image = await readImage(form, "image");
  if (image.error) return image.error;
  try {
    const artist = await prisma.artist.create({
      data: { ...parsed.data, slug: uniqueSlug(parsed.data.name), verified: boolField(form, "verified") ?? false, imageUrl: image.url },
    });
    return jsonOk({ artist }, { status: 201 });
  } catch (err) {
    console.error("[admin/artists] create failed", err);
    await deleteUpload(image.url);
    return jsonError(500, "SAVE_FAILED", "Couldn't save the artist.");
  }
}
