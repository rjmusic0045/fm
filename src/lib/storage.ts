import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk media storage for testing. Files live in <project>/storage/uploads
 * (git-ignored) and are streamed by /api/media/[...path] with Range support.
 * Swap this module for S3 / Cloudinary / Vercel Blob in production: callers
 * only depend on saveUpload() returning a public URL and deleteUpload(url).
 */
export const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const MEDIA_PREFIX = "/api/media/";

export type UploadKind = "audio" | "covers";

export const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
};
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const CONTENT_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
  flac: "audio/flac",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Writes the file under a random name and returns its public URL. */
export async function saveUpload(kind: UploadKind, file: File, ext: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, kind);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `${MEDIA_PREFIX}${kind}/${name}`;
}

/** Resolves a stored file path safely (no traversal outside UPLOAD_ROOT). */
export function resolveUpload(segments: string[]): string | null {
  if (segments.length !== 2) return null;
  const [kind, name] = segments;
  if (kind !== "audio" && kind !== "covers") return null;
  if (!/^[a-z0-9]+-[a-f0-9]{16}\.[a-z0-9]{2,5}$/.test(name)) return null;
  const full = path.join(UPLOAD_ROOT, kind, name);
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
}

/** Best-effort delete of a previously saved upload (ignores external URLs). */
export async function deleteUpload(url: string | null | undefined) {
  if (!url?.startsWith(MEDIA_PREFIX)) return;
  const full = resolveUpload(url.slice(MEDIA_PREFIX.length).split("/"));
  if (full) await unlink(full).catch(() => undefined);
}
