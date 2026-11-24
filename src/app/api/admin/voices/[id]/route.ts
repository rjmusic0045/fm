import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { boolField, readAudio, readForm, readImage } from "@/lib/admin-forms";
import { parseVoiceForm } from "@/lib/voice-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: edit a story (multipart, any subset; new audio/cover replace the old files; removeCover clears it).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Story not found.");
  const existing = await prisma.voiceStory.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "NOT_FOUND", "Story not found.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = parseVoiceForm(form, existing);
  if ("error" in parsed) return jsonError(400, "INVALID_INPUT", parsed.error!);

  const audio = await readAudio(form, "audio", false);
  if (audio.error) return audio.error;
  const cover = await readImage(form, "cover");
  if (cover.error) {
    await deleteUpload(audio.url);
    return cover.error;
  }
  const coverUrl = cover.url ?? (boolField(form, "removeCover") ? null : existing.coverUrl);

  const story = await prisma.voiceStory.update({
    where: { id: params.id },
    data: { ...parsed.data, coverUrl, ...(audio.url ? { audioUrl: audio.url } : {}) },
  });
  await Promise.all([
    audio.url ? deleteUpload(existing.audioUrl) : undefined,
    coverUrl !== existing.coverUrl ? deleteUpload(existing.coverUrl) : undefined,
  ]);
  return jsonOk({ story });
}

// Admin: delete a story and its files.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Story not found.");
  const story = await prisma.voiceStory.findUnique({ where: { id: params.id }, select: { audioUrl: true, coverUrl: true } });
  if (!story) return jsonError(404, "NOT_FOUND", "Story not found.");
  await prisma.voiceStory.delete({ where: { id: params.id } });
  await Promise.all([deleteUpload(story.audioUrl), deleteUpload(story.coverUrl)]);
  return jsonOk();
}
