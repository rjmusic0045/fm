import { prisma } from "@/lib/prisma";
import { storageBackend } from "@/lib/storage";
import { authSecretSource } from "@/lib/auth-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deployment health check. Reports only whether required settings are present
// (never their values) and whether the database answers, so a misconfigured
// App Service can be diagnosed without portal access.
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

  const secretSource = authSecretSource();
  const checks: Record<string, unknown> = {
    NEXTAUTH_SECRET: Boolean(secretSource),
    ...(secretSource && secretSource !== "NEXTAUTH_SECRET" ? { NEXTAUTH_SECRET_from: secretSource } : {}),
    NEXTAUTH_URL: urlOk,
    NEXTAUTH_URL_matches_site: urlMatchesHost,
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    database,
    storage: storageBackend(),
  };
  if (!secretSource) {
    // Help spot typos: NAMES ONLY of settings that look auth/secret related. Never values.
    checks.similar_setting_names = Object.keys(process.env)
      .filter((k) => /secret|nextauth|auth/i.test(k) && !/^(PATH|HOME)$/i.test(k))
      .sort();
  }
  const healthy = Boolean(secretSource) && urlOk && database === "ok";
  return Response.json({ ok: healthy, checks }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
