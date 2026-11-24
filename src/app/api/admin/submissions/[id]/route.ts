import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";
import { uniqueSlug } from "@/lib/admin-forms";
import { notify } from "@/lib/notifications";
import { deleteUpload } from "@/lib/storage";
import { VOICE_CATEGORY_IDS, voiceCategoryById } from "@/config/voices";

export const runtime = "nodejs";

const note = z.string().trim().min(3, "Add a short note for the listener.").max(1000);
const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    note: z.string().trim().max(1000).optional(),
    // Optional editorial adjustments before publishing.
    title: z.string().trim().min(1).max(160).optional(),
    category: z.enum(VOICE_CATEGORY_IDS).optional(),
    topic: z.string().trim().min(1).optional(),
    featured: z.boolean().optional(),
    access: z.enum(["FREE", "PREMIUM"]).optional(),
    publishAt: z.string().datetime({ offset: true }).nullable().optional(),
  }),
  z.object({ action: z.literal("request_changes"), note }),
  z.object({ action: z.literal("reject"), note }),
]);

// Admin review: approve & publish, request changes, or reject a listener submission.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const admin = await getAdminSession();
  if (!admin) return jsonError(403, "FORBIDDEN", "Admins only.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Submission not found.");

  const parsed = bodySchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the review.");
  const body = parsed.data;

  const sub = await prisma.voiceSubmission.findUnique({ where: { id: params.id } });
  if (!sub) return jsonError(404, "NOT_FOUND", "Submission not found.");
  if (sub.status !== "PENDING" && sub.status !== "CHANGES_REQUESTED") {
    return jsonError(409, "ALREADY_REVIEWED", `This submission is already ${sub.status.toLowerCase().replace("_", " ")}.`);
  }
  const reviewed = { reviewedById: admin.user.id, reviewedAt: new Date() };

  if (body.action === "approve") {
    if (!sub.audioUrl) return jsonError(409, "NO_AUDIO", "This submission has no audio.");
    const category = body.category ?? sub.category;
    const topic = body.topic ?? sub.topic;
    const cat = voiceCategoryById(category)!;
    if (!cat.topics.includes(topic)) return jsonError(400, "INVALID_INPUT", `Choose a topic from ${cat.name}.`);
    if (body.publishAt && new Date(body.publishAt).getTime() <= Date.now()) {
      return jsonError(400, "INVALID_INPUT", "The scheduled time must be in the future.");
    }

    const story = await prisma.voiceStory.create({
      data: {
        slug: uniqueSlug(body.title ?? sub.title),
        title: body.title ?? sub.title,
        description: sub.description,
        category,
        topic,
        language: sub.language,
        state: sub.state,
        district: sub.district,
        village: sub.village,
        speakerName: sub.displayName,
        anonymous: sub.anonymous,
        audioUrl: sub.audioUrl,
        duration: sub.duration,
        coverFrom: cat.palette[0],
        coverTo: cat.palette[1],
        access: body.access ?? "FREE",
        featured: body.featured ?? false,
        publishAt: body.publishAt ? new Date(body.publishAt) : null,
        submittedById: sub.userId,
      },
    });
    await prisma.voiceSubmission.update({
      where: { id: sub.id },
      data: { status: "APPROVED", storyId: story.id, reviewNote: body.note || null, ...reviewed },
    });
    await notify(
      sub.userId,
      "Your story is approved 🎉",
      body.publishAt
        ? `“${story.title}” will be published on ${new Date(body.publishAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`
        : `“${story.title}” is now live in ${cat.name}.${body.note ? ` Note: ${body.note}` : ""}`,
      `/voices/story/${story.slug}`,
    );
    return jsonOk({ story: { id: story.id, slug: story.slug } });
  }

  if (body.action === "request_changes") {
    await prisma.voiceSubmission.update({ where: { id: sub.id }, data: { status: "CHANGES_REQUESTED", reviewNote: body.note, ...reviewed } });
    await notify(sub.userId, "Changes requested on your submission", `“${sub.title}”: ${body.note}`, "/submissions");
    return jsonOk();
  }

  // reject: keep the record (for the listener's history) but delete the audio for privacy.
  await prisma.voiceSubmission.update({
    where: { id: sub.id },
    data: { status: "REJECTED", reviewNote: body.note, audioUrl: null, ...reviewed },
  });
  await deleteUpload(sub.audioUrl);
  await notify(sub.userId, "Update on your submission", `“${sub.title}” wasn't accepted. ${body.note}`, "/submissions");
  return jsonOk();
}
