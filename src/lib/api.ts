import "server-only";
import { NextResponse } from "next/server";

export function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, code, message }, { status, headers });
}

export function jsonOk<T extends Record<string, unknown>>(data: T = {} as T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

/** Parses a JSON body, returning null on malformed input instead of throwing. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** Rejects cross-site form posts to JSON endpoints (defence in depth on top of SameSite cookies). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / server-to-server
  try {
    return new URL(origin).host === new URL(req.url).host || origin === process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  } catch {
    return false;
  }
}
