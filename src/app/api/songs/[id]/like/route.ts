import { z } from "zod";
import { released } from "@/lib/release";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isObjectId } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

// Like / unlike a song. Body: { liked: boolean }. Signed-in users only.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in to like songs.");
  if (!isObjectId(params.id)) return jsonError(404, "NOT_FOUND", "Song not found.");

  const parsed = z.object({ liked: z.boolean() }).safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { liked: boolean }.");

  const exists = await prisma.song.count({ where: { id: params.id, isActive: true, ...released() } });
  if (!exists) return jsonError(404, "NOT_FOUND", "Song not found.");

  const key = { userId: session.user.id, type: "SONG" as const, targetId: params.id };
  if (parsed.data.liked) {
    await prisma.favorite.upsert({
      where: { userId_type_targetId: key },
      create: { ...key, songId: params.id },
      update: {},
    });
  } else {
    await prisma.favorite.deleteMany({ where: key });
  }

  const likes = await prisma.favorite.count({ where: { type: "SONG", songId: params.id } });
  return jsonOk({ liked: parsed.data.liked, likes });
}
