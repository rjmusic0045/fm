"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pause, Play, Trash2 } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { dtoToItem, type SongDTO } from "@/lib/song-dto";
import { useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";

type SortKey = "createdAt" | "plays" | "listeners" | "likes";

function Row({ song, queue, index }: { song: SongDTO; queue: SongDTO[]; index: number }) {
  const router = useRouter();
  const item = React.useMemo(() => dtoToItem(song), [song]);
  const active = useIsActive("song", item.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const [busy, setBusy] = React.useState(false);
  const playingHere = active && isPlaying;

  const call = async (method: "PATCH" | "DELETE", body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/songs/${song.id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        alert(data.message ?? "Action failed.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

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
              {song.artist} · {song.genre}
              {!song.uploaded && <span className="ml-1 rounded bg-muted px-1">demo</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2 text-right tabular-nums text-muted-foreground">{song.duration ? formatDuration(song.duration) : "–"}</td>
      <td className="px-2 text-right font-medium tabular-nums">{song.plays.toLocaleString("en-IN")}</td>
      <td className="px-2 text-right tabular-nums">{song.listeners.toLocaleString("en-IN")}</td>
      <td className="px-2 text-right tabular-nums">{song.likes.toLocaleString("en-IN")}</td>
      <td className="px-2">
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            song.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
          )}
        >
          {song.isActive ? "Live" : "Hidden"}
        </span>
      </td>
      <td className="py-2 pl-2 pr-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => call("PATCH", { isActive: !song.isActive })}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label={song.isActive ? `Hide ${song.title}` : `Publish ${song.title}`}
            title={song.isActive ? "Hide from listeners" : "Publish"}
          >
            {song.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm(`Delete “${song.title}” and its stats? This can't be undone.`) && call("DELETE")}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label={`Delete ${song.title}`}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function SongsTable({ songs }: { songs: SongDTO[] }) {
  const [sort, setSort] = React.useState<SortKey>("createdAt");
  const sorted = React.useMemo(
    () =>
      [...songs].sort((a, b) =>
        sort === "createdAt" ? b.createdAt.localeCompare(a.createdAt) : (b[sort] as number) - (a[sort] as number),
      ),
    [songs, sort],
  );

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-2 py-2 text-right font-medium" aria-sort={sort === k ? "descending" : "none"}>
      <button type="button" onClick={() => setSort(k)} className={cn("hover:text-foreground", sort === k && "text-foreground")}>
        {children}
        {sort === k && " ↓"}
      </button>
    </th>
  );

  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="py-2 pl-4 pr-2 text-left font-medium">
              <button type="button" onClick={() => setSort("createdAt")} className={cn("hover:text-foreground", sort === "createdAt" && "text-foreground")}>
                Song{sort === "createdAt" && " (newest)"}
              </button>
            </th>
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
            <Row key={s.id} song={s} queue={sorted} index={i} />
          ))}
        </tbody>
      </table>
      {!songs.length && <p className="p-8 text-center text-muted-foreground">No songs yet. Upload the first one above.</p>}
    </div>
  );
}
