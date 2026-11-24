import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isSameOrigin, jsonError, jsonOk, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

// The signed-in user's latest notifications and unread count.
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);
  return jsonOk(
    {
      unread,
      items: items.map((n) => ({ id: n.id, title: n.title, body: n.body, href: n.href, read: Boolean(n.readAt), createdAt: n.createdAt.toISOString() })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// Mark notifications read. Body: { ids?: string[] } (no ids = all).
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getSession();
  if (!session) return jsonError(401, "UNAUTHENTICATED", "Sign in first.");
  const parsed = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(100).optional() }).safeParse((await readJson(req)) ?? {});
  if (!parsed.success) return jsonError(400, "INVALID_INPUT", "Expected { ids?: string[] }.");
  const r = await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null, ...(parsed.data.ids ? { id: { in: parsed.data.ids } } : {}) },
    data: { readAt: new Date() },
  });
  return jsonOk({ marked: r.count });
}
