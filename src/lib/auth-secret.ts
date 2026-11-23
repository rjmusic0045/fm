/**
 * The NextAuth signing secret. Edge-safe (used by middleware too).
 *
 * Accepts NEXTAUTH_SECRET, the newer AUTH_SECRET name, and the forms Azure
 * App Service produces when a value is added on the "Connection strings" tab
 * instead of "App settings" (CUSTOMCONNSTR_/APPSETTING_ prefixes).
 */
const NAMES = [
  "NEXTAUTH_SECRET",
  "AUTH_SECRET",
  "APPSETTING_NEXTAUTH_SECRET",
  "CUSTOMCONNSTR_NEXTAUTH_SECRET",
  "CUSTOMCONNSTR_AUTH_SECRET",
] as const;

export function authSecret(): string | undefined {
  for (const name of NAMES) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  return undefined;
}

/** Which accepted name supplied the secret (for diagnostics; never the value). */
export function authSecretSource(): string | null {
  for (const name of NAMES) if (process.env[name]?.trim()) return name;
  return null;
}
