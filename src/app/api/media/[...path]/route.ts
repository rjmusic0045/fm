import { mediaResponse } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams uploaded media from Azure Blob Storage or local disk (see lib/storage).
// Supports HTTP Range requests so the audio element can seek and start playing
// before the whole file downloads.
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    return await mediaResponse(params.path ?? [], req.headers.get("range"));
  } catch (err) {
    console.error("[media] read failed", err);
    return new Response("Storage unavailable", { status: 503 });
  }
}
