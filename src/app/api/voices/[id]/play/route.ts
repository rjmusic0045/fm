import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { released } from "@/lib/release";
import { getSession } from "@/lib/auth";
import { isObjectId } from "@/lib/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

// Records one counted People & Voices play (same rules as songs and episodes).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Story not found.");
  const parsed = z.object({ seconds: z.number().min(0).max(24 * 60 * 60) }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { seconds: number }.");

  const session = await getSession();
  const who = session?.user.id ?? `ip:${clientIp(req.headers)}`;
  const limit = await rateLimit(`play:${who}:voice:${params.id}`, 1, 30);
  if (!limit.allowed) return jsonOk({ counted: false });

  const playable = await prisma.voiceStory.count({ where: { id: params.id, isActive: true, ...released() } });
  if (!playable) return jsonError(404, "NOT_FOUND", "Story not found.");
  const story = await prisma.voiceStory.update({ where: { id: params.id }, data: { plays: { increment: 1 } }, select: { plays: true } });
  return jsonOk({ counted: true, plays: story.plays });
}
