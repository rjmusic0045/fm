"use client";

import { signIn } from "next-auth/react";
import { authErrorMessages, type AuthErrorCode } from "@/lib/auth-errors";

export type { AuthErrorCode };
export type AuthResult = { ok: true; redirectTo: string } | { ok: false; code: AuthErrorCode; message: string };

const knownCodes = new Set(Object.keys(authErrorMessages));

export async function signInWithCredentials(input: {
  email: string;
  password: string;
  remember: boolean;
  callbackUrl?: string;
  // Sign out the other device that is using this account.
  force?: boolean;
}): Promise<AuthResult> {
  try {
    const res = await signIn("credentials", {
      redirect: false,
      email: input.email,
      password: input.password,
      remember: String(input.remember),
      force: String(Boolean(input.force)),
      callbackUrl: input.callbackUrl ?? "/dashboard",
    });
    if (!res) return { ok: false, code: "UNKNOWN", message: authErrorMessages.UNKNOWN };
    if (res.ok && !res.error) {
      return { ok: true, redirectTo: input.callbackUrl ?? "/dashboard" };
    }
    const code = (res.error && knownCodes.has(res.error) ? res.error : res.status >= 500 ? "BACKEND_UNAVAILABLE" : "UNKNOWN") as AuthErrorCode;
    return { ok: false, code, message: authErrorMessages[code] };
  } catch {
    return { ok: false, code: "BACKEND_UNAVAILABLE", message: authErrorMessages.BACKEND_UNAVAILABLE };
  }
}

// Redirects to Facebook. Only resolves (with an error) if the redirect can't start.
export async function signInWithFacebook(enabled: boolean, callbackUrl?: string): Promise<AuthResult> {
  if (!enabled) {
    return {
      ok: false,
      code: "BACKEND_UNAVAILABLE",
      message: "Facebook login isn't configured on this server yet. Use email and password for now.",
    };
  }
  await signIn("facebook", { callbackUrl: callbackUrl ?? "/dashboard" });
  return { ok: true, redirectTo: callbackUrl ?? "/dashboard" };
}
