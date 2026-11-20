import "server-only";
import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

/**
 * Fixed-window rate limiter backed by MongoDB, so limits hold across every
 * serverless instance. One small document per key.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true, remaining: limit - 1, retryAfter: windowSeconds };
    }

    const retryAfter = Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000));
    if (existing.count >= limit) return { allowed: false, remaining: 0, retryAfter };

    const updated = await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { allowed: updated.count <= limit, remaining: Math.max(0, limit - updated.count), retryAfter };
  } catch (err) {
    // Fail open: a rate-limiter outage must not lock everyone out.
    console.error("[rate-limit] store unavailable", err);
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}

/** Clears a key, e.g. after a successful login. */
export async function resetRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } }).catch(() => undefined);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const v = headers[name];
    return Array.isArray(v) ? v[0] : v;
  };
  return get("x-forwarded-for")?.split(",")[0]?.trim() || get("x-real-ip") || "unknown";
}
