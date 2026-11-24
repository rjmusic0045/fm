import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { readAudio, readForm, readImage, uniqueSlug } from "@/lib/admin-forms";
import { parseVoiceForm } from "@/lib/voice-forms";
import { voiceCategoryById } from "@/config/voices";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Admin: create a People & Voices story (multipart: title, category, topic, audio, cover?, speaker, location, language, access, publish controls, featured, anonymous).
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!(await getAdminSession())) return jsonError(403, "FORBIDDEN", "Admins only.");
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");

  const parsed = parseVoiceForm(form);
  if ("error" in parsed) return jsonError(400, "INVALID_INPUT", parsed.error!);

  const audio = await readAudio(form, "audio", true);
  if (audio.error) return audio.error;
  const cover = await readImage(form, "cover");
  if (cover.error) {
    await deleteUpload(audio.url);
    return cover.error;
  }

  try {
    const palette = voiceCategoryById(parsed.data.category)!.palette;
    const story = await prisma.voiceStory.create({
      data: {
        ...parsed.data,
        slug: uniqueSlug(parsed.data.title),
        audioUrl: audio.url!,
        coverUrl: cover.url,
        coverFrom: palette[0],
        coverTo: palette[1],
      },
    });
    return jsonOk({ story }, { status: 201 });
  } catch (err) {
    console.error("[admin/voices] create failed", err);
    await Promise.all([deleteUpload(audio.url), deleteUpload(cover.url)]);
    return jsonError(500, "SAVE_FAILED", "Couldn't save the story.");
  }
}
