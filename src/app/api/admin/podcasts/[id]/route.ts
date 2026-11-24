import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { boolField, field, podcastSchema, isFieldError, languageField, readForm, readImage, refField } from "@/lib/admin-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: edit a podcast show (multipart, any subset of the create fields; plus removeCover).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Podcast not found.");
  const existing = await prisma.podcast.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Podcast not found.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = podcastSchema.safeParse({
    title: field(form, "title") ?? existing.title,
    host: field(form, "host") ?? existing.host,
    description: field(form, "description") ?? existing.description,
    category: field(form, "category") || existing.category,
    access: field(form, "access") || existing.access,
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const artistRef = refField(form, "artistId");
  if (artistRef && !(await prisma.artist.count({ where: { id: artistRef } }))) {
    return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
  }
  const language = languageField(form);
  if (isFieldError(language)) return jsonError(400, "INVALID_INPUT", language.error);
  const cover = await readImage(form, "cover");
  if (cover.error) return cover.error;
  const coverUrl = cover.url ?? (boolField(form, "removeCover") ? null : existing.coverUrl);

  const podcast = await prisma.podcast.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      artistId: artistRef === undefined ? existing.artistId : artistRef,
      coverUrl,
      isActive: boolField(form, "isActive") ?? existing.isActive,
      ...(language !== undefined ? { language } : {}),
    },
  });
  if (coverUrl !== existing.coverUrl) await deleteUpload(existing.coverUrl);
  return jsonOk({ podcast });
}

// Admin: delete a podcast with all its episodes, their stats and audio files.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Podcast not found.");
  const podcast = await prisma.podcast.findUnique({
    where: { id: params.id },
    select: { coverUrl: true, episodes: { select: { id: true, audioUrl: true, imageUrl: true } } },
  });
  if (!podcast) return jsonError(404, "NOT_FOUND", "Podcast not found.");

  const episodeIds = podcast.episodes.map((e) => e.id);
  await prisma.$transaction([
    prisma.listeningHistory.deleteMany({ where: { episodeId: { in: episodeIds } } }),
    prisma.podcastEpisode.deleteMany({ where: { podcastId: params.id } }),
    prisma.podcast.delete({ where: { id: params.id } }),
  ]);
  await Promise.all([deleteUpload(podcast.coverUrl), ...podcast.episodes.flatMap((e) => [deleteUpload(e.audioUrl), deleteUpload(e.imageUrl)])]);
  return jsonOk();
}
