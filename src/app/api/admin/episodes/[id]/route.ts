import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  episodeNumber: z.number().int().min(1).max(100000).optional(),
  isActive: z.boolean().optional(),
  season: z.number().int().min(1).max(1000).nullable().optional(),
  publishAt: z.string().datetime({ offset: true }).nullable().optional(),
});

// Admin: edit an episode. JSON body: any of title, description, episodeNumber, isActive.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Episode not found.");
  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Check the episode fields.");

  const { publishAt, ...rest } = parsed.data;
  const data = { ...rest, ...(publishAt !== undefined ? { publishAt: publishAt ? new Date(publishAt) : null } : {}) };
  const episode = await prisma.podcastEpisode.update({ where: { id: params.id }, data }).catch(() => null);
  if (!episode) return jsonError(404, "NOT_FOUND", "Episode not found.");
  return jsonOk({ episode });
}

// Admin: delete an episode, its stats and audio file.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Episode not found.");
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: params.id }, select: { audioUrl: true, imageUrl: true } });
  if (!episode) return jsonError(404, "NOT_FOUND", "Episode not found.");

  await prisma.$transaction([
    prisma.listeningHistory.deleteMany({ where: { episodeId: params.id } }),
    prisma.podcastEpisode.delete({ where: { id: params.id } }),
  ]);
  await Promise.all([deleteUpload(episode.audioUrl), deleteUpload(episode.imageUrl)]);
  return jsonOk();
}
