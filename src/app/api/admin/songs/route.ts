import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { isSameOrigin, jsonError, jsonOk } from "@/lib/api";
import {
  AUDIO_TYPES,
  IMAGE_TYPES,
  MAX_AUDIO_BYTES,
  MAX_IMAGE_BYTES,
  deleteUpload,
  saveUpload,
} from "@/lib/storage";
import { accessSchema, dateField, isFieldError, languageField, publishFields, refField } from "@/lib/admin-forms";

export const runtime = "nodejs";

const fieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  artist: z.string().trim().min(1, "Artist is required").max(120),
  album: z.string().trim().max(120).optional().default(""),
  genre: z.string().trim().max(40).optional().default(""),
  duration: z.coerce.number().int().min(0).max(4 * 60 * 60).optional().default(0),
  access: accessSchema.optional().default("FREE"),
});

const palettes: [string, string][] = [
  ["#4F46E5", "#EC4899"],
  ["#0EA5E9", "#6366F1"],
  ["#F59E0B", "#EF4444"],
  ["#22C55E", "#0EA5E9"],
  ["#DB2777", "#7C3AED"],
  ["#F97316", "#DB2777"],
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60) || "track";

// Admin: upload a song (multipart form: title, artist, album?, genre?, duration?, audio, cover?).
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError(403, "FORBIDDEN", "Invalid origin.");
  const session = await getAdminSession();
  if (!session) return jsonError(403, "FORBIDDEN", "Admins only.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "INVALID_INPUT", "Expected a multipart form upload.");
  }

  const parsed = fieldsSchema.safeParse({
    title: form.get("title"),
    artist: form.get("artist"),
    album: form.get("album") ?? undefined,
    genre: form.get("genre") ?? undefined,
    duration: form.get("duration") ?? undefined,
    access: form.get("access") || undefined,
  });
  if (!parsed.success) {
    return jsonError(400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the form fields.");
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return jsonError(400, "INVALID_INPUT", "Choose an audio file.");
  const audioExt = AUDIO_TYPES[audio.type];
  if (!audioExt) return jsonError(415, "UNSUPPORTED_TYPE", "Audio must be MP3, M4A, AAC, WAV, OGG, WEBM or FLAC.");
  if (audio.size > MAX_AUDIO_BYTES) return jsonError(413, "TOO_LARGE", "Audio file must be 50 MB or smaller.");

  const cover = form.get("cover");
  let coverExt: string | undefined;
  if (cover instanceof File && cover.size > 0) {
    coverExt = IMAGE_TYPES[cover.type];
    if (!coverExt) return jsonError(415, "UNSUPPORTED_TYPE", "Cover must be a JPG, PNG or WEBP image.");
    if (cover.size > MAX_IMAGE_BYTES) return jsonError(413, "TOO_LARGE", "Cover image must be 5 MB or smaller.");
  }

  const { title, album, genre, duration, access } = parsed.data;
  let { artist } = parsed.data;

  // Optional links to managed artist/album records (their names win over typed text).
  const artistId = refField(form, "artistId") ?? null;
  const albumId = refField(form, "albumId") ?? null;
  const [artistRow, albumRow] = await Promise.all([
    artistId ? prisma.artist.findUnique({ where: { id: artistId }, select: { name: true } }) : null,
    albumId ? prisma.album.findUnique({ where: { id: albumId }, select: { title: true, _count: { select: { songs: true } } } }) : null,
  ]);
  if (artistId && !artistRow) return jsonError(400, "INVALID_INPUT", "Choose an existing artist.");
  if (albumId && !albumRow) return jsonError(400, "INVALID_INPUT", "Choose an existing album.");
  if (artistRow) artist = artistRow.name;
  const language = languageField(form);
  const releaseDate = dateField(form, "releaseDate");
  const pub = publishFields(form);
  for (const v of [language, releaseDate, pub]) if (isFieldError(v)) return jsonError(400, "INVALID_INPUT", v.error);
  let audioUrl: string | undefined;
  let coverUrl: string | undefined;
  try {
    audioUrl = await saveUpload("audio", audio, audioExt);
    if (cover instanceof File && coverExt) coverUrl = await saveUpload("covers", cover, coverExt);

    const [coverFrom, coverTo] = palettes[Math.floor(Math.random() * palettes.length)];
    const song = await prisma.song.create({
      data: {
        slug: `${slugify(title)}-${randomBytes(3).toString("hex")}`,
        title,
        artist,
        album: albumRow?.title ?? (album || "Single"),
        genre: genre || "Pop",
        duration,
        audioUrl,
        coverUrl,
        coverFrom,
        coverTo,
        uploadedById: session.user.id,
        access,
        artistId,
        albumId,
        trackNumber: albumRow ? albumRow._count.songs + 1 : null,
        language: (language as string | null | undefined) ?? null,
        releaseDate: (releaseDate as Date | null | undefined) ?? null,
        ...((pub as { isActive: boolean; publishAt: Date | null } | undefined) ?? {}),
      },
    });
    return jsonOk({ song }, { status: 201 });
  } catch (err) {
    console.error("[admin/songs] upload failed", err);
    // Don't leave orphaned files behind if the DB write failed.
    await Promise.all([deleteUpload(audioUrl), deleteUpload(coverUrl)]);
    return jsonError(500, "UPLOAD_FAILED", "Upload failed. Please try again.");
  }
}
