"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Disc3, Pencil, Plus, X } from "lucide-react";
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

export interface AlbumRow {
  id: string;
  title: string;
  description: string;
  genre: string;
  releaseYear: number | null;
  coverUrl: string | null;
  palette: [string, string];
  access: AccessValue;
  isActive: boolean;
  artistId: string | null;
  artistName: string | null;
  songIds: string[];
}

export interface SongOption {
  id: string;
  title: string;
  artist: string;
  duration: number;
  albumId: string | null;
}

function TrackPicker({ songs, value, onChange, albumId }: { songs: SongOption[]; value: string[]; onChange: (ids: string[]) => void; albumId?: string }) {
  const [q, setQ] = React.useState("");
  const byId = React.useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const available = songs.filter(
    (s) => !value.includes(s.id) && (!q || `${s.title} ${s.artist}`.toLowerCase().includes(q.toLowerCase())),
  );
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 text-sm">
        <span className="font-medium">Tracklist ({value.length})</span>
        <ol className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-input p-1">
          {value.map((id, i) => {
            const s = byId.get(id);
            if (!s) return null;
            return (
              <li key={id} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
                <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${s.title} up`} className="text-muted-foreground disabled:opacity-30">
                  <ArrowUp className="size-3.5" />
                </button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${s.title} down`} className="text-muted-foreground disabled:opacity-30">
                  <ArrowDown className="size-3.5" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((x) => x !== id))} aria-label={`Remove ${s.title}`} className="text-muted-foreground hover:text-red-600">
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
          {!value.length && <li className="p-3 text-center text-xs text-muted-foreground">Add songs from the right.</li>}
        </ol>
      </div>
      <div className="space-y-1.5 text-sm">
        <span className="font-medium">Add songs</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs" aria-label="Search songs to add" className={inputClass} />
        <ul className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-input p-1">
          {available.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onChange([...value, s.id])}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
              >
                <Plus className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  {s.title} <span className="text-muted-foreground">· {s.artist}</span>
                </span>
                {s.albumId && s.albumId !== albumId && <span className="shrink-0 text-[10px] text-amber-600">in another album</span>}
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.duration ? formatDuration(s.duration) : ""}</span>
              </button>
            </li>
          ))}
          {!available.length && <li className="p-3 text-center text-xs text-muted-foreground">No more songs.</li>}
        </ul>
      </div>
    </div>
  );
}

function AlbumForm({ album, artists, songs, onClose }: { album?: AlbumRow; artists: Option[]; songs: SongOption[]; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const [songIds, setSongIds] = React.useState<string[]>(album?.songIds ?? []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("songIds", JSON.stringify(songIds));
    fd.set("isActive", (e.currentTarget.elements.namedItem("isActive") as HTMLInputElement).checked ? "true" : "false");
    void run(() => fetch(album ? `/api/admin/albums/${album.id}` : "/api/admin/albums", { method: album ? "PATCH" : "POST", body: fd }), onClose);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <ImagePicker name="cover" removeName="removeCover" currentUrl={album?.coverUrl} label="Album cover" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *">
              <input name="title" required maxLength={120} defaultValue={album?.title} className={inputClass} placeholder="Album title" />
            </Field>
            <Field label="Artist">
              <select name="artistId" defaultValue={album?.artistId ?? ""} className={inputClass}>
                <option value="">Various / not linked</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genre">
              <input name="genre" maxLength={40} defaultValue={album?.genre} className={inputClass} placeholder="Pop" />
            </Field>
            <Field label="Release year">
              <input name="releaseYear" type="number" min={1900} max={2100} defaultValue={album?.releaseYear ?? new Date().getFullYear()} className={inputClass} />
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" maxLength={2000} defaultValue={album?.description} className={textareaClass} />
          </Field>
        </div>
      </div>
      <TrackPicker songs={songs} value={songIds} onChange={setSongIds} albumId={album?.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessSelect defaultValue={album?.access} />
        <label className="flex items-center gap-2 self-center text-sm">
          <input type="checkbox" name="isActive" defaultChecked={album?.isActive ?? true} className="size-4 accent-[hsl(var(--primary))]" />
          Published (visible to listeners)
        </label>
      </div>
      <p className="text-xs text-muted-foreground">A Premium album makes all of its songs Premium.</p>
      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {album ? "Save album" : "Create album"}
        </Button>
      </div>
    </form>
  );
}

function AlbumCard({ album, onEdit }: { album: AlbumRow; onEdit: () => void }) {
  const { run, busy } = useAdminAction();
  return (
    <li className={cn("glass flex gap-4 rounded-xl p-4", !album.isActive && "opacity-60")}>
      <CoverArt title={album.title} palette={album.palette} image={album.coverUrl ?? undefined} className="size-20 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{album.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {album.artistName ?? "Various artists"}
          {album.releaseYear ? ` · ${album.releaseYear}` : ""} · {album.genre}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <AccessBadge access={album.access} />
          <span className="inline-flex items-center gap-1">
            <Disc3 className="size-3" aria-hidden /> {album.songIds.length} tracks
          </span>
          {!album.isActive && <span className="rounded-full bg-muted px-2 py-0.5">Hidden</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <button type="button" onClick={onEdit} aria-label={`Edit ${album.title}`} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Pencil className="size-4" />
        </button>
        <DeleteButton
          label={`album “${album.title}” (its songs are kept as singles)`}
          disabled={busy}
          onConfirm={() => void run(() => fetch(`/api/admin/albums/${album.id}`, { method: "DELETE" }))}
        />
      </div>
    </li>
  );
}

export function AlbumsManager({ albums, artists, songs }: { albums: AlbumRow[]; artists: Option[]; songs: SongOption[] }) {
  const [editing, setEditing] = React.useState<AlbumRow | "new" | null>(null);
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing("new")}>
        <Plus /> New album
      </Button>
      {albums.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} onEdit={() => setEditing(a)} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No albums yet. Upload some songs, then group them into an album here.
        </p>
      )}
      <EditorDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New album" : `Edit ${editing?.title ?? ""}`}>
        {editing && (
          <AlbumForm
            key={editing === "new" ? "new" : editing.id}
            album={editing === "new" ? undefined : editing}
            artists={artists}
            songs={songs}
            onClose={() => setEditing(null)}
          />
        )}
      </EditorDialog>
    </div>
  );
}
