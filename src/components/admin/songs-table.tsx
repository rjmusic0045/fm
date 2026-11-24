"use client";

import * as React from "react";
import { Eye, EyeOff, Pause, Pencil, Play } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import {
  AccessBadge,
  AccessSelect,
  DeleteButton,
  EditorDialog,
  Field,
  FormError,
  LanguageSelect,
  PublishControl,
  StatusBadge,
  initialPublishMode,
  inputClass,
  useAdminAction,
} from "@/components/admin/kit";
import type { Option } from "@/components/admin/upload-form";
import { Button } from "@/components/ui/button";
import { dtoToItem, type SongDTO } from "@/lib/song-dto";
import { useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";

type SortKey = "createdAt" | "plays" | "listeners" | "likes";

function SongEditor({ song, artists, albums, onClose }: { song: SongDTO; artists: Option[]; albums: Option[]; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const [artistId, setArtistId] = React.useState(song.artistId ?? "");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get("title") ?? "").trim(),
      genre: String(fd.get("genre") ?? "").trim() || "Pop",
      access: fd.get("access"),
      artistId: artistId || null,
      ...(artistId ? {} : { artist: String(fd.get("artist") ?? "").trim() }),
      albumId: String(fd.get("albumId") ?? "") || null,
      language: String(fd.get("language") ?? "") || null,
      releaseDate: fd.get("releaseDate") ? new Date(String(fd.get("releaseDate"))).toISOString() : null,
      // Release control -> isActive + publishAt
      isActive: fd.get("publishMode") !== "draft",
      publishAt: fd.get("publishMode") === "schedule" && fd.get("publishAt") ? String(fd.get("publishAt")) : null,
    };
    if (fd.get("publishMode") === "schedule" && !body.publishAt) return;
    void run(
      () => fetch(`/api/admin/songs/${song.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      onClose,
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input name="title" required defaultValue={song.title} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Genre">
          <input name="genre" defaultValue={song.genre} maxLength={40} className={inputClass} />
        </Field>
        <Field label="Artist">
          <select value={artistId} onChange={(e) => setArtistId(e.target.value)} className={inputClass}>
            <option value="">Not linked (typed name)</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {!artistId && <input name="artist" required defaultValue={song.artist} maxLength={120} className={inputClass} />}
        </Field>
        <Field label="Album">
          <select name="albumId" defaultValue={song.albumId ?? ""} className={inputClass}>
            <option value="">Single (no album)</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LanguageSelect defaultValue={song.language} />
        <Field label="Release date">
          <input type="date" name="releaseDate" defaultValue={song.releaseDate?.slice(0, 10) ?? ""} className={inputClass} />
        </Field>
      </div>
      <AccessSelect defaultValue={song.ownAccess} />
      <PublishControl defaultMode={initialPublishMode(song.isActive, song.publishAt)} defaultAt={song.publishAt} />
      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Save song
        </Button>
      </div>
    </form>
  );
}

function Row({
  song,
  queue,
  index,
  onEdit,
}: {
  song: SongDTO;
  queue: SongDTO[];
  index: number;
  onEdit: () => void;
}) {
  const item = React.useMemo(() => dtoToItem(song), [song]);
  const active = useIsActive("song", item.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const { run, busy } = useAdminAction();
  const playingHere = active && isPlaying;

  const call = (method: "PATCH" | "DELETE", body?: unknown) =>
    run(() =>
      fetch(`/api/admin/songs/${song.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    );

  return (
    <tr className={cn("border-t border-border", !song.isActive && "opacity-60")}>
      <td className="py-2 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <CoverArt title={song.title} palette={song.palette} image={song.coverUrl ?? undefined} showLabel={false} className="size-10 rounded-md" />
            <button
              type="button"
              onClick={() => (active ? toggle() : playQueue(queue.map(dtoToItem), index))}
              aria-label={`${playingHere ? "Pause" : "Preview"} ${song.title}`}
              className={cn(
                "absolute inset-0 grid place-items-center rounded-md bg-black/40 text-white transition-opacity",
                playingHere ? "opacity-100" : "opacity-0 hover:opacity-100 focus-visible:opacity-100",
              )}
            >
              {playingHere ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            </button>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{song.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {song.artist} · {song.album === "Single" ? song.genre : song.album}
              {song.language ? ` · ${song.language}` : ""}
              {!song.uploaded && <span className="ml-1 rounded bg-muted px-1">demo</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2">
        <AccessBadge access={song.access} />
      </td>
      <td className="px-2 text-right tabular-nums text-muted-foreground">{song.duration ? formatDuration(song.duration) : "–"}</td>
      <td className="px-2 text-right font-medium tabular-nums">{song.plays.toLocaleString("en-IN")}</td>
      <td className="px-2 text-right tabular-nums">{song.listeners.toLocaleString("en-IN")}</td>
      <td className="px-2 text-right tabular-nums">{song.likes.toLocaleString("en-IN")}</td>
      <td className="px-2">
        <StatusBadge isActive={song.isActive} publishAt={song.publishAt} />
      </td>
      <td className="py-2 pl-2 pr-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Edit ${song.title}`}
            title="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void call("PATCH", { isActive: !song.isActive })}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label={song.isActive ? `Hide ${song.title}` : `Publish ${song.title}`}
            title={song.isActive ? "Hide from listeners" : "Publish"}
          >
            {song.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <DeleteButton label={`“${song.title}” and its stats`} disabled={busy} onConfirm={() => void call("DELETE")} />
        </div>
      </td>
    </tr>
  );
}

export function SongsTable({ songs, artists = [], albums = [] }: { songs: SongDTO[]; artists?: Option[]; albums?: Option[] }) {
  const [sort, setSort] = React.useState<SortKey>("createdAt");
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<SongDTO | null>(null);

  const sorted = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...songs]
      .filter((s) => !q || `${s.title} ${s.artist} ${s.album} ${s.genre}`.toLowerCase().includes(q))
      .sort((a, b) => (sort === "createdAt" ? b.createdAt.localeCompare(a.createdAt) : (b[sort] as number) - (a[sort] as number)));
  }, [songs, sort, query]);

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-2 py-2 text-right font-medium" aria-sort={sort === k ? "descending" : "none"}>
      <button type="button" onClick={() => setSort(k)} className={cn("hover:text-foreground", sort === k && "text-foreground")}>
        {children}
        {sort === k && " ↓"}
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs, artists, albums…"
        aria-label="Search songs"
        className={cn(inputClass, "max-w-sm")}
      />
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-2 pl-4 pr-2 text-left font-medium">
                <button type="button" onClick={() => setSort("createdAt")} className={cn("hover:text-foreground", sort === "createdAt" && "text-foreground")}>
                  Song{sort === "createdAt" && " (newest)"}
                </button>
              </th>
              <th className="px-2 py-2 text-left font-medium">Access</th>
              <th className="px-2 py-2 text-right font-medium">Length</th>
              <SortTh k="plays">Plays</SortTh>
              <SortTh k="listeners">Listeners</SortTh>
              <SortTh k="likes">Likes</SortTh>
              <th className="px-2 py-2 text-left font-medium">Status</th>
              <th className="py-2 pl-2 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <Row key={s.id} song={s} queue={sorted} index={i} onEdit={() => setEditing(s)} />
            ))}
          </tbody>
        </table>
        {!sorted.length && <p className="p-8 text-center text-muted-foreground">{songs.length ? "No matches." : "No songs yet. Upload the first one above."}</p>}
      </div>

      <EditorDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} title={`Edit “${editing?.title ?? ""}”`}>
        {editing && <SongEditor key={editing.id} song={editing} artists={artists} albums={albums} onClose={() => setEditing(null)} />}
      </EditorDialog>
    </div>
  );
}
