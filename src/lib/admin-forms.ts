import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { AUDIO_TYPES, IMAGE_TYPES, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, saveUpload } from "@/lib/storage";

/** Shared parsing/upload helpers for the admin multipart APIs. */

export const accessSchema = z.enum(["FREE", "PREMIUM"]);

export const artistSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  bio: z.string().trim().max(2000).default(""),
  city: z.string().trim().max(80).default(""),
});

export const albumSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).default(""),
  genre: z.string().trim().max(40).default("Pop"),
  releaseYear: z.coerce.number().int().min(1900).max(2100).nullable().default(null),
  access: accessSchema.default("FREE"),
});

export const podcastSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  host: z.string().trim().max(120).default(""),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().max(40).default("Talk"),
  access: accessSchema.default("FREE"),
});

export const episodeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(4000).default(""),
  episodeNumber: z.coerce.number().int().min(1).max(100000).optional(),
  duration: z.coerce.number().int().min(0).max(24 * 60 * 60).default(0),
});

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60) || "item";

/** URL slug with a short random suffix so titles can repeat. */
export const uniqueSlug = (title: string) => `${slugify(title)}-${randomBytes(3).toString("hex")}`;

const PALETTES: [string, string][] = [
  ["#4F46E5", "#EC4899"],
  ["#0EA5E9", "#6366F1"],
  ["#F59E0B", "#EF4444"],
  ["#22C55E", "#0EA5E9"],
  ["#DB2777", "#7C3AED"],
  ["#F97316", "#DB2777"],
];
export const randomPalette = () => PALETTES[Math.floor(Math.random() * PALETTES.length)];

/** Reads a text field: undefined if absent, trimmed string otherwise. */
export const field = (form: FormData, name: string): string | undefined => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : undefined;
};

/** "true"/"on"/"1" → true, "false"/"off"/"0" → false, absent → undefined. */
export const boolField = (form: FormData, name: string): boolean | undefined => {
  const v = field(form, name);
  if (v === undefined || v === "") return undefined;
  return ["true", "on", "1", "yes"].includes(v.toLowerCase());
};

/** Optional ObjectId reference: "" or "none" clears it (null), absent leaves it (undefined). */
export const refField = (form: FormData, name: string): string | null | undefined => {
  const v = field(form, name);
  if (v === undefined) return undefined;
  if (v === "" || v === "none") return null;
  return /^[a-f0-9]{24}$/i.test(v) ? v : undefined;
};

type FileResult = { url?: string; error?: Response };

/** Validates and stores an optional image upload field. */
export async function readImage(form: FormData, name: string): Promise<FileResult> {
  const file = form.get(name);
  if (!(file instanceof File) || file.size === 0) return {};
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: jsonError(415, "UNSUPPORTED_TYPE", "Images must be JPG, PNG or WEBP.") };
  if (file.size > MAX_IMAGE_BYTES) return { error: jsonError(413, "TOO_LARGE", "Images must be 5 MB or smaller.") };
  return { url: await saveUpload("covers", file, ext) };
}

/** Validates and stores a required/optional audio upload field. */
export async function readAudio(form: FormData, name: string, required: boolean): Promise<FileResult> {
  const file = form.get(name);
  if (!(file instanceof File) || file.size === 0) {
    return required ? { error: jsonError(400, "INVALID_INPUT", "Choose an audio file.") } : {};
  }
  const ext = AUDIO_TYPES[file.type];
  if (!ext) return { error: jsonError(415, "UNSUPPORTED_TYPE", "Audio must be MP3, M4A, AAC, WAV, OGG, WEBM or FLAC.") };
  if (file.size > MAX_AUDIO_BYTES) return { error: jsonError(413, "TOO_LARGE", "Audio files must be 50 MB or smaller.") };
  return { url: await saveUpload("audio", file, ext) };
}

export async function readForm(req: Request): Promise<FormData | null> {
  try {
    return await req.formData();
  } catch {
    return null;
  }
}
