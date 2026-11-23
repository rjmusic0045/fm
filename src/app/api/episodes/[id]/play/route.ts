import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isObjectId } from "@/lib/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

/** Records one counted podcast-episode play (same rules as songs). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Episode not found.");
  const parsed = z.object({ seconds: z.number().min(0).max(24 * 60 * 60) }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { seconds: number }.");

  const session = await getSession();
  const who = session?.user.id ?? `ip:${clientIp(req.headers)}`;
  const limit = await rateLimit(`play:${who}:ep:${params.id}`, 1, 30);
  if (!limit.allowed) return jsonOk({ counted: false });

  const episode = await prisma.podcastEpisode
    .update({
      where: { id: params.id, isActive: true, podcast: { isActive: true } },
      data: { plays: { increment: 1 } },
      select: { plays: true },
    })
    .catch(() => null);
  if (!episode) return jsonError(404, "NOT_FOUND", "Episode not found.");

  if (session) {
    await prisma.listeningHistory
      .create({ data: { userId: session.user.id, episodeId: params.id, secondsListened: Math.round(parsed.data.seconds) } })
      .catch((err) => console.error("[episode play] history write failed", err));
  }
  return jsonOk({ counted: true, plays: episode.plays });
}
