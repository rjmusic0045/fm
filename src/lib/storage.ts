import "server-only";
import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";

/**
 * Media storage for uploaded songs and covers, with two backends:
 *
 *  - Azure Blob Storage, when AZURE_STORAGE_CONNECTION_STRING (or
 *    AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY) is set. Container:
 *    AZURE_STORAGE_CONTAINER(_NAME), default "uploads", kept private.
 *  - Local disk otherwise: UPLOAD_DIR, or <project>/storage/uploads (git-ignored).
 *
 * Either way files are addressed as /api/media/<kind>/<name> and streamed by
 * that route with HTTP Range support, so URLs stored in the database don't
 * depend on the backend.
 */
const MEDIA_PREFIX = "/api/media/";

export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

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

/* ------------------------------------------------------------------------- */
/* Backend selection                                                          */
/* ------------------------------------------------------------------------- */

let containerPromise: Promise<ContainerClient> | null = null;

/**
 * Azure connection string from either AZURE_STORAGE_CONNECTION_STRING, or
 * AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY. A connection string
 * still holding the portal's "YOUR_KEY" placeholder is ignored.
 */
function azureConnectionString(): string | null {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (conn && !/AccountKey=(YOUR_KEY|<|;|$)/i.test(conn)) return conn;
  const name = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  const key = process.env.AZURE_STORAGE_ACCOUNT_KEY?.trim();
  if (name && key) return `DefaultEndpointsProtocol=https;AccountName=${name};AccountKey=${key};EndpointSuffix=core.windows.net`;
  return null;
}

const containerName = () =>
  process.env.AZURE_STORAGE_CONTAINER?.trim() || process.env.AZURE_STORAGE_CONTAINER_NAME?.trim() || "uploads";

/** Blob container client, or null when running on local disk. Created (private) on first use. */
function blobContainer(): Promise<ContainerClient> | null {
  const conn = azureConnectionString();
  if (!conn) return null;
  containerPromise ??= (async () => {
    const container = BlobServiceClient.fromConnectionString(conn).getContainerClient(containerName());
    await container.createIfNotExists(); // no `access` option = private container
    return container;
  })().catch((err) => {
    containerPromise = null; // retry on the next request instead of caching the failure
    throw err;
  });
  return containerPromise;
}

export const storageBackend = () => (azureConnectionString() ? "azure-blob" : "local");

/* ------------------------------------------------------------------------- */
/* Names                                                                      */
/* ------------------------------------------------------------------------- */

/** Validates /api/media/<kind>/<name> segments; returns the "<kind>/<name>" key or null. */
function mediaKey(segments: string[]): string | null {
  if (segments.length !== 2) return null;
  const [kind, name] = segments;
  if (kind !== "audio" && kind !== "covers") return null;
  if (!/^[a-z0-9]+-[a-f0-9]{16}\.[a-z0-9]{2,5}$/.test(name)) return null;
  return `${kind}/${name}`;
}

/** Local path for a key, guarded against traversal outside UPLOAD_ROOT. */
function localPath(key: string): string | null {
  const full = path.join(UPLOAD_ROOT, ...key.split("/"));
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
}

/** Kept for callers that only need local path resolution. */
export function resolveUpload(segments: string[]): string | null {
  const key = mediaKey(segments);
  return key ? localPath(key) : null;
}

/* ------------------------------------------------------------------------- */
/* Write / delete                                                             */
/* ------------------------------------------------------------------------- */

/** Stores the file under a random name and returns its public /api/media URL. */
export async function saveUpload(kind: UploadKind, file: File, ext: string): Promise<string> {
  const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
  const key = `${kind}/${name}`;
  const data = Buffer.from(await file.arrayBuffer());

  const container = blobContainer();
  if (container) {
    await (await container).getBlockBlobClient(key).uploadData(data, {
      blobHTTPHeaders: {
        blobContentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
        blobCacheControl: "public, max-age=31536000, immutable",
      },
    });
  } else {
    const full = localPath(key)!;
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }
  return `${MEDIA_PREFIX}${key}`;
}

/** Best-effort delete of a previously saved upload (ignores external URLs). */
export async function deleteUpload(url: string | null | undefined) {
  if (!url?.startsWith(MEDIA_PREFIX)) return;
  const key = mediaKey(url.slice(MEDIA_PREFIX.length).split("/"));
  if (!key) return;
  try {
    const container = blobContainer();
    if (container) {
      await (await container).getBlockBlobClient(key).deleteIfExists();
    } else {
      const full = localPath(key);
      if (full) await unlink(full);
    }
  } catch (err) {
    // The DB row is already gone; an orphaned file is harmless, a failed request isn't.
    console.warn("[storage] could not delete", key, err instanceof Error ? err.message : err);
  }
}

/* ------------------------------------------------------------------------- */
/* Read (streaming with Range support)                                        */
/* ------------------------------------------------------------------------- */

type ByteRange = { start: number; end: number } | "unsatisfiable" | null;

/** Parses a single "bytes=a-b" Range header against a known size. */
function parseRange(header: string | null, size: number): ByteRange {
  const m = header && /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return null;
  let start: number;
  let end: number;
  if (!m[1]) {
    // suffix range: the last N bytes
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  return start > end || start >= size ? "unsatisfiable" : { start, end };
}

const notFound = () => new Response("Not found", { status: 404 });

/** Builds the HTTP response for /api/media/<kind>/<name>, from whichever backend is active. */
export async function mediaResponse(segments: string[], rangeHeader: string | null): Promise<Response> {
  const key = mediaKey(segments);
  if (!key) return notFound();
  const type = CONTENT_TYPES[path.extname(key).slice(1)] ?? "application/octet-stream";

  const container = blobContainer();
  let size: number;
  let open: (start: number, end: number) => Promise<ReadableStream>;

  if (container) {
    const blob = (await container).getBlockBlobClient(key);
    try {
      size = (await blob.getProperties()).contentLength ?? 0;
    } catch {
      return notFound();
    }
    open = async (start, end) => {
      const res = await blob.download(start, end - start + 1);
      return Readable.toWeb(res.readableStreamBody as Readable) as ReadableStream;
    };
  } else {
    const full = localPath(key);
    if (!full) return notFound();
    try {
      size = (await stat(full)).size;
    } catch {
      return notFound();
    }
    open = async (start, end) => Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
  }

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // Names are random and never reused, so they can be cached for a long time.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  if (size === 0) return new Response(null, { status: 200, headers: { ...headers, "Content-Length": "0" } });

  const range = parseRange(rangeHeader, size);
  if (range === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  if (range) {
    return new Response(await open(range.start, range.end), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    });
  }
  return new Response(await open(0, size - 1), { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
