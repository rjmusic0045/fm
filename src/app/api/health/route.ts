import { prisma } from "@/lib/prisma";
import { storageBackend } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deployment health check. Reports only whether required settings are present
 * (never their values) and whether the database answers, so a misconfigured
 * App Service can be diagnosed without portal access.
 */
export async function GET(req: Request) {
  const nextauthUrl = process.env.NEXTAUTH_URL?.trim();
  let urlOk = false;
  let urlMatchesHost: boolean | null = null;
  if (nextauthUrl) {
    try {
      const u = new URL(nextauthUrl);
      urlOk = u.protocol === "https:" || u.hostname === "localhost";
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      urlMatchesHost = host ? u.host === host : null;
    } catch {
      urlOk = false;
    }
  }

  let database: "ok" | "not-configured" | "unreachable" = "not-configured";
  if (process.env.DATABASE_URL?.trim()) {
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      database = "ok";
    } catch (err) {
      console.error("[health] database ping failed", err);
      database = "unreachable";
    }
  }

  const checks = {
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    NEXTAUTH_URL: urlOk,
    NEXTAUTH_URL_matches_site: urlMatchesHost,
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    database,
    storage: storageBackend(),
  };
  const healthy = checks.NEXTAUTH_SECRET && checks.NEXTAUTH_URL && database === "ok";
  return Response.json({ ok: healthy, checks }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
