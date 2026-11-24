import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import { readAudio, readForm } from "@/lib/admin-forms";
import { parseSubmissionForm } from "@/lib/submission-forms";
import { deleteUpload } from "@/lib/storage";

export const runtime = "nodejs";

async function ownSubmission(id: string) {
  const session = await getSession();
  if (!session) return { error: jsonError(401, "UNAUTHENTICATED", "Sign in first.") } as const;
  if (!isObjectId(id)) return { error: jsonError(404, "NOT_FOUND", "Submission not found.") } as const;
  const sub = await prisma.voiceSubmission.findUnique({ where: { id } });
  // Someone else's submission looks the same as a missing one.
  if (!sub || sub.userId !== session.user.id) return { error: jsonError(404, "NOT_FOUND", "Submission not found.") } as const;
  return { sub } as const;
}

// Edit and resubmit (only while pending or when changes were requested). Goes back to the review queue.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const own = await ownSubmission(params.id);
  if ("error" in own) return own.error;
  const { sub } = own;
  if (sub.status !== "PENDING" && sub.status !== "CHANGES_REQUESTED") {
    return jsonError(409, "LOCKED", "This submission has already been reviewed and can't be edited.");
  }
  const form = await readForm(req);
  if (!form) return jsonError(400, "INVALID_INPUT", "Expected a multipart form.");
  const parsed = parseSubmissionForm(form, sub);
  if ("error" in parsed) return jsonError(400, "INVALID_INPUT", parsed.error!);
  const audio = await readAudio(form, "audio", false);
  if (audio.error) return audio.error;

  const updated = await prisma.voiceSubmission.update({
    where: { id: sub.id },
    data: { ...parsed.data, ...(audio.url ? { audioUrl: audio.url } : {}), status: "PENDING" },
  });
  if (audio.url) await deleteUpload(sub.audioUrl);
  return jsonOk({ submission: { id: updated.id, status: updated.status } });
}

// Withdraw a submission that hasn't been published (removes the audio too).
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const own = await ownSubmission(params.id);
  if ("error" in own) return own.error;
  const { sub } = own;
  if (sub.status === "APPROVED") {
    return jsonError(409, "LOCKED", "This story is published. Contact us if you'd like it taken down.");
  }
  await prisma.voiceSubmission.delete({ where: { id: sub.id } });
  await deleteUpload(sub.audioUrl);
  return jsonOk();
}
