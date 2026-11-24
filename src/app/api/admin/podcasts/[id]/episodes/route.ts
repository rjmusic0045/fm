import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { episodeSchema, field, isFieldError, publishFields, readAudio, readForm, readImage } from "@/lib/admin-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: upload an episode to a podcast (multipart: title, description?, episodeNumber?, duration?, audio).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id) || !(await prisma.podcast.count({ where: { id: params.id } }))) {
    return jsonError(404, "NOT_FOUND", "Podcast not found.");
  }
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = episodeSchema.safeParse({
    title: field(form, "title"),
    description: field(form, "description") ?? "",
    episodeNumber: field(form, "episodeNumber") || undefined,
    duration: field(form, "duration") || 0,
  });
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form.");

  const seasonRaw = field(form, "season");
  const season = seasonRaw ? Number(seasonRaw) : null;
  if (season !== null && (!Number.isInteger(season) || season < 1 || season > 1000)) {
    return jsonError(400, "INVALID_INPUT", "Season must be a whole number from 1.");
  }
  const pub = publishFields(form);
  if (isFieldError(pub)) return jsonError(400, "INVALID_INPUT", pub.error);

  const audio = await readAudio(form, "audio", true);
  if (audio.error) return audio.error;
  const image = await readImage(form, "image");
  if (image.error) {
    await deleteUpload(audio.url);
    return image.error;
  }

  try {
    // Default to the next number after the latest episode.
    const last = await prisma.podcastEpisode.findFirst({
      where: { podcastId: params.id, season },
      orderBy: { episodeNumber: "desc" },
      select: { episodeNumber: true },
    });
    const episode = await prisma.podcastEpisode.create({
      data: {
        podcastId: params.id,
        title: parsed.data.title,
        description: parsed.data.description,
        duration: parsed.data.duration,
        episodeNumber: parsed.data.episodeNumber ?? (last?.episodeNumber ?? 0) + 1,
        audioUrl: audio.url!,
        season,
        imageUrl: image.url,
        ...(pub ?? {}),
      },
    });
    return jsonOk({ episode }, { status: 201 });
  } catch (err) {
    console.error("[admin/episodes] upload failed", err);
    await Promise.all([deleteUpload(audio.url), deleteUpload(image.url)]);
    return jsonError(500, "SAVE_FAILED", "Couldn't save the episode.");
  }
}
