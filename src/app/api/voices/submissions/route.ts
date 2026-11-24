import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { readAudio, readForm } from "@/lib/admin-forms";
import { parseSubmissionForm } from "@/lib/submission-forms";
import { notify } from "@/lib/notifications";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Submit Your Voice: a signed-in listener sends audio for review.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in to submit your voice.");

  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");
  const parsed = parseSubmissionForm(form);
  if ("error" in parsed) return jsonError(400, "INVALID_INPUT", parsed.error!);

  // Counted only for valid submissions, so form mistakes don't use up the daily allowance.
  const limit = await rateLimit(`voice-submit:${session.user.id}`, 5, 24 * 60 * 60);
  if (!limit.allowed) return jsonError(429, "RATE_LIMITED", "You can send up to 5 submissions a day. Please try again tomorrow.");

  const audio = await readAudio(form, "audio", true);
  if (audio.error) return audio.error;

  try {
    const submission = await prisma.voiceSubmission.create({
      data: { ...parsed.data, userId: session.user.id, audioUrl: audio.url!, status: "PENDING" },
    });
    await notify(
      session.user.id,
      "We received your submission",
      `“${submission.title}” is in our review queue. We'll let you know when it's reviewed.`,
      "/submissions",
    );
    return jsonOk({ submission: { id: submission.id, status: submission.status } }, { status: 201 });
  } catch (err) {
    console.error("[voices/submit] failed", err);
    await deleteUpload(audio.url);
    return jsonError(500, "SAVE_FAILED", "Couldn't save your submission. Please try again.");
  }
}
