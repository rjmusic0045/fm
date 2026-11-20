"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Music2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";

const GENRES = ["Pop", "Indie Pop", "Lo-fi", "Hip-Hop", "Electronic", "Rock", "Jazz", "Classical", "Ambient", "R&B", "Devotional", "Folk", "Talk & Music"];

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";

/** Reads duration (seconds) from an audio file in the browser. */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : 0);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });
}

export function UploadForm() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [audio, setAudio] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [cover, setCover] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  React.useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const onAudio = async (file: File | null) => {
    setAudio(file);
    setDuration(0);
    if (!file) return;
    setDuration(await readDuration(file));
    // Prefill the title from the filename when empty.
    const title = formRef.current?.elements.namedItem("title") as HTMLInputElement | null;
    if (title && !title.value) title.value = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  };

  const onCover = (file: File | null) => {
    setCover(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const reset = () => {
    formRef.current?.reset();
    setAudio(null);
    setDuration(0);
    onCover(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDone(null);
    if (!audio) {
      setError("Choose an audio file.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("audio", audio);
    if (cover) fd.set("cover", cover);
    else fd.delete("cover");
    fd.set("duration", String(duration));

    // XHR (not fetch) so we can show upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/songs");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let body: { ok?: boolean; message?: string; song?: { title: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        setDone(`“${body.song?.title}” is live.`);
        reset();
        router.refresh();
      } else {
        setError(body.message ?? `Upload failed (${xhr.status}).`);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Network error. Check your connection and try again.");
    };
    setProgress(0);
    xhr.send(fd);
  };

  const uploading = progress !== null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="glass space-y-5 rounded-2xl p-5 sm:p-6">
      <div>
        <h2 className="font-sans text-lg font-semibold">Upload a song</h2>
        <p className="text-sm text-muted-foreground">MP3, M4A, WAV, OGG or FLAC up to 50 MB. Cover: JPG, PNG or WEBP up to 5 MB.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        {/* Cover picker */}
        <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="Cover preview" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-6" aria-hidden />
              Cover image
            </span>
          )}
          <input
            type="file"
            name="cover"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onCover(e.target.files?.[0] ?? null)}
          />
          {coverPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onCover(null);
              }}
              aria-label="Remove cover"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <div className="space-y-4">
          {/* Audio picker */}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 transition-colors",
              audio ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Music2 className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              {audio ? (
                <>
                  <span className="block truncate font-medium">{audio.name}</span>
                  <span className="text-muted-foreground">
                    {(audio.size / 1024 / 1024).toFixed(1)} MB{duration ? ` · ${formatDuration(duration)}` : ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="block font-medium">Choose audio file</span>
                  <span className="text-muted-foreground">Click to browse</span>
                </>
              )}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              required
              onChange={(e) => void onAudio(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Title *</span>
              <input name="title" required maxLength={120} className={inputClass} placeholder="Song name" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Artist *</span>
              <input name="artist" required maxLength={120} className={inputClass} placeholder="Artist name" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Album</span>
              <input name="album" maxLength={120} className={inputClass} placeholder="Single" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Genre</span>
              <input name="genre" list="genres" maxLength={40} className={inputClass} placeholder="Pop" />
              <datalist id="genres">
                {GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" aria-hidden /> {done}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={reset} disabled={uploading}>
          Clear
        </Button>
        <Button type="submit" loading={uploading}>
          {!uploading && <Upload />}
          Upload song
        </Button>
      </div>
    </form>
  );
}
