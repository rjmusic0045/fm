/**
 * Scheduled-release rule shared by every public query and play/like API:
 * an item is out once `publishAt` is unset, null, or in the past.
 * (On MongoDB, Prisma treats a missing field differently from null, hence `isSet`.)
 */
export const released = () => ({
  OR: [{ publishAt: { isSet: false } }, { publishAt: null }, { publishAt: { lte: new Date() } }],
});

/** Admin-facing status derived from isActive + publishAt. */
export type PublishStatus = "live" | "draft" | "scheduled";

export function publishStatus(isActive: boolean, publishAt: Date | string | null | undefined): PublishStatus {
  if (!isActive) return "draft";
  if (publishAt && new Date(publishAt).getTime() > Date.now()) return "scheduled";
  return "live";
}
