import "server-only";
import { prisma } from "@/lib/prisma";

/** Creates an in-app notification. Never throws: a failed notification must not fail the action. */
export async function notify(userId: string, title: string, body = "", href?: string) {
  await prisma.notification
    .create({ data: { userId, title: title.slice(0, 160), body: body.slice(0, 1000), href } })
    .catch((err) => console.error("[notify] failed", err));
}
