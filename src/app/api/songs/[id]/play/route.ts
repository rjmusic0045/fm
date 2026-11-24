import { z } from "zod";
import { released } from "@/lib/release";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isObjectId } from "@/lib/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

// Records one counted play. The player calls this once per listen, after
// PLAY_COUNT_SECONDS of actual playback (or at the end of shorter tracks).
// Guests bump the play counter; signed-in users also get a history row,
// which is what "unique listeners" is computed from.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const parsed = z.object({ seconds: z.number().min(0).max(4 * 60 * 60) }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { seconds: number }.");

  const session = await getSession();
  const who = session?.user.id ?? `ip:${clientIp(req.headers)}`;
  // At most one counted play per listener per song every 30 seconds (stops replay spam).
  const limit = await rateLimit(`play:${who}:${params.id}`, 1, 30);
  if (!limit.allowed) return jsonOk({ counted: false });

  // Check first: an update on a missing/unreleased song would log a Prisma error for a normal 404.
  const playable = await prisma.song.count({ where: { id: params.id, isActive: true, ...released() } });
  if (!playable) return jsonError(404, "NOT_FOUND", "Song not found.");
  const song = await prisma.song.update({ where: { id: params.id }, data: { plays: { increment: 1 } }, select: { plays: true } });

  if (session) {
    await prisma.listeningHistory
      .create({ data: { userId: session.user.id, songId: params.id, secondsListened: Math.round(parsed.data.seconds) } })
      .catch((err) => console.error("[play] history write failed", err));
  }
  return jsonOk({ counted: true, plays: song.plays });
}
