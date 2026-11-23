"use client";

import * as React from "react";
import { ChevronDown, Eye, EyeOff, Headphones, Music2, Pencil, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/player/cover-art";
import {
  AccessBadge,
  AccessSelect,
  DeleteButton,
  EditorDialog,
  Field,
  FormError,
  ImagePicker,
  inputClass,
  textareaClass,
  useAdminAction,
  type AccessValue,
} from "@/components/admin/kit";
import type { Option } from "@/components/admin/upload-form";
import { cn, formatDuration } from "@/lib/utils";

export interface EpisodeRow {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  duration: number;
  plays: number;
  isActive: boolean;
  publishedAt: string;
}

export interface PodcastRow {
  id: string;
  title: string;
  host: string;
  description: string;
  category: string;
  coverUrl: string | null;
  palette: [string, string];
  access: AccessValue;
  isActive: boolean;
  artistId: string | null;
  episodes: EpisodeRow[];
}

const CATEGORIES = ["Talk", "Music", "Comedy", "News", "Education", "Business", "Health", "Technology", "Sports", "Society & Culture", "Devotional"];

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

function PodcastForm({ podcast, artists, onClose }: { podcast?: PodcastRow; artists: Option[]; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("isActive", (e.currentTarget.elements.namedItem("isActive") as HTMLInputElement).checked ? "true" : "false");
    void run(() => fetch(podcast ? `/api/admin/podcasts/${podcast.id}` : "/api/admin/podcasts", { method: podcast ? "PATCH" : "POST", body: fd }), onClose);
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <ImagePicker name="cover" removeName="removeCover" currentUrl={podcast?.coverUrl} label="Show artwork" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Show title *">
              <input name="title" required maxLength={120} defaultValue={podcast?.title} className={inputClass} placeholder="Podcast name" />
            </Field>
            <Field label="Host">
              <input name="host" maxLength={120} defaultValue={podcast?.host} className={inputClass} placeholder="Host name" />
            </Field>
            <Field label="Category">
              <input name="category" list="podcast-categories" maxLength={40} defaultValue={podcast?.category ?? "Talk"} className={inputClass} />
              <datalist id="podcast-categories">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Linked artist">
              <select name="artistId" defaultValue={podcast?.artistId ?? ""} className={inputClass}>
                <option value="">None</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" maxLength={4000} defaultValue={podcast?.description} className={textareaClass} />
          </Field>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessSelect defaultValue={podcast?.access} />
        <label className="flex items-center gap-2 self-center text-sm">
          <input type="checkbox" name="isActive" defaultChecked={podcast?.isActive ?? true} className="size-4 accent-[hsl(var(--primary))]" />
          Published (visible to listeners)
        </label>
      </div>
      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {podcast ? "Save show" : "Create show"}
        </Button>
      </div>
    </form>
  );
}

function EpisodeUpload({ podcastId, nextNumber }: { podcastId: string; nextNumber: number }) {
  const { run, busy, error, setError } = useAdminAction();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return setError("Choose an audio file.");
    const fd = new FormData(e.currentTarget);
    fd.set("audio", file);
    fd.set("duration", String(duration));
    void run(
      () => fetch(`/api/admin/podcasts/${podcastId}/episodes`, { method: "POST", body: fd }),
      () => {
        formRef.current?.reset();
        setFile(null);
        setDuration(0);
      },
    );
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Upload episode {nextNumber}</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
        <input name="title" required maxLength={160} placeholder="Episode title" aria-label="Episode title" className={inputClass} />
        <label className={cn(inputClass, "flex cursor-pointer items-center gap-2 truncate text-muted-foreground")}>
          <Music2 className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{file ? `${file.name}${duration ? ` · ${formatDuration(duration)}` : ""}` : "Choose audio…"}</span>
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setDuration(f ? await readDuration(f) : 0);
            }}
          />
        </label>
        <input name="episodeNumber" type="number" min={1} defaultValue={nextNumber} aria-label="Episode number" className={inputClass} />
      </div>
      <textarea name="description" maxLength={4000} placeholder="Show notes (optional)" aria-label="Episode description" className={textareaClass} />
      <FormError error={error} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={busy}>
          {!busy && <Upload />} Upload episode
        </Button>
      </div>
    </form>
  );
}

function EpisodeItem({ ep }: { ep: EpisodeRow }) {
  const { run, busy } = useAdminAction();
  return (
    <li className={cn("flex items-center gap-3 border-t border-border py-2 text-sm", !ep.isActive && "opacity-60")}>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">#{ep.episodeNumber}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{ep.title}</span>
      <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{ep.duration ? formatDuration(ep.duration) : "–"}</span>
      <span className="inline-flex w-16 items-center justify-end gap-1 text-xs tabular-nums text-muted-foreground">
        <Headphones className="size-3" aria-hidden /> {ep.plays}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void run(() =>
            fetch(`/api/admin/episodes/${ep.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: !ep.isActive }),
            }),
          )
        }
        aria-label={ep.isActive ? `Hide ${ep.title}` : `Publish ${ep.title}`}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {ep.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      <DeleteButton label={`episode “${ep.title}”`} disabled={busy} onConfirm={() => void run(() => fetch(`/api/admin/episodes/${ep.id}`, { method: "DELETE" }))} />
    </li>
  );
}

function PodcastCard({ podcast, onEdit }: { podcast: PodcastRow; onEdit: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { run, busy } = useAdminAction();
  const plays = podcast.episodes.reduce((n, e) => n + e.plays, 0);
  const nextNumber = Math.max(0, ...podcast.episodes.map((e) => e.episodeNumber)) + 1;

  return (
    <li className={cn("glass rounded-xl p-4", !podcast.isActive && "opacity-70")}>
      <div className="flex gap-4">
        <CoverArt title={podcast.title} palette={podcast.palette} image={podcast.coverUrl ?? undefined} className="size-20 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{podcast.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {podcast.host || "No host"} · {podcast.category}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <AccessBadge access={podcast.access} />
            <span>{podcast.episodes.length} episodes</span>
            <span className="inline-flex items-center gap-1">
              <Headphones className="size-3" aria-hidden /> {plays} plays
            </span>
            {!podcast.isActive && <span className="rounded-full bg-muted px-2 py-0.5">Hidden</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <button type="button" onClick={onEdit} aria-label={`Edit ${podcast.title}`} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-4" />
          </button>
          <DeleteButton
            label={`podcast “${podcast.title}” and all ${podcast.episodes.length} episodes`}
            disabled={busy}
            onConfirm={() => void run(() => fetch(`/api/admin/podcasts/${podcast.id}`, { method: "DELETE" }))}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        {open ? "Hide episodes" : "Manage episodes"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <ul>
            {[...podcast.episodes]
              .sort((a, b) => b.episodeNumber - a.episodeNumber)
              .map((ep) => (
                <EpisodeItem key={ep.id} ep={ep} />
              ))}
          </ul>
          <EpisodeUpload podcastId={podcast.id} nextNumber={nextNumber} />
        </div>
      )}
    </li>
  );
}

export function PodcastsManager({ podcasts, artists }: { podcasts: PodcastRow[]; artists: Option[] }) {
  const [editing, setEditing] = React.useState<PodcastRow | "new" | null>(null);
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing("new")}>
        <Plus /> New podcast
      </Button>
      {podcasts.length ? (
        <ul className="space-y-3">
          {podcasts.map((p) => (
            <PodcastCard key={p.id} podcast={p} onEdit={() => setEditing(p)} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No podcasts yet. Create a show, then upload episodes.</p>
      )}
      <EditorDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New podcast" : `Edit ${editing?.title ?? ""}`}>
        {editing && (
          <PodcastForm key={editing === "new" ? "new" : editing.id} podcast={editing === "new" ? undefined : editing} artists={artists} onClose={() => setEditing(null)} />
        )}
      </EditorDialog>
    </div>
  );
}
