"use client";

import * as React from "react";
import { Headphones, Pause, Play } from "lucide-react";
import { Visualizer } from "@/components/audio/visualizer";
import type { Palette } from "@/data/catalog";
import { useIsActive, usePlayer, type PlayableItem } from "@/stores/player-store";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

export interface EpisodeItemData {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  duration: number;
  audioUrl: string;
  plays: number;
  publishedAt: string;
  season?: number | null;
  imageUrl?: string | null;
}

interface ShowInfo {
  title: string;
  coverUrl: string | null;
  palette: Palette;
  premium: boolean;
}

export const episodeToItem = (e: EpisodeItemData, show: ShowInfo): PlayableItem => ({
  id: `ep-${e.id}`,
  kind: "song",
  title: e.title,
  subtitle: show.title,
  src: e.audioUrl,
  palette: show.palette,
  duration: e.duration || undefined,
  image: e.imageUrl ?? show.coverUrl ?? undefined,
  episodeId: e.id,
  premium: show.premium,
});

function EpisodeRow({ ep, index, queue, show }: { ep: EpisodeItemData; index: number; queue: EpisodeItemData[]; show: ShowInfo }) {
  const active = useIsActive("song", `ep-${ep.id}`);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;
  const label = `${ep.season ? `season ${ep.season} ` : ""}episode ${ep.episodeNumber}`;
  const date = new Date(ep.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <li className={cn("glass flex gap-4 rounded-xl p-4", active && "border-primary/40")}>
      <button
        type="button"
        onClick={() => (active ? toggle() : playQueue(queue.map((e) => episodeToItem(e, show)), index))}
        aria-label={`${playingHere ? "Pause" : "Play"} ${label}: ${ep.title}`}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
      >
        {playingHere ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
      </button>
      {ep.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ep.imageUrl} alt="" loading="lazy" className="hidden size-14 shrink-0 rounded-lg object-cover sm:block" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {ep.season ? `Season ${ep.season} · ` : ""}Episode {ep.episodeNumber} · {date}
          {ep.duration ? ` · ${formatDuration(ep.duration)}` : ""}
        </p>
        <h3 className={cn("flex items-center gap-2 font-sans font-semibold", active && "text-primary")}>
          <span className="truncate">{ep.title}</span>
          {playingHere && <Visualizer bars={3} className="h-3 shrink-0" />}
        </h3>
        {ep.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ep.description}</p>}
      </div>
      <span className="hidden shrink-0 items-start gap-1 text-xs tabular-nums text-muted-foreground sm:inline-flex" title={`${ep.plays} plays`}>
        <Headphones className="size-3.5" aria-hidden /> {formatCompact(ep.plays)}
      </span>
    </li>
  );
}

export function EpisodeList({ episodes, show }: { episodes: EpisodeItemData[]; show: ShowInfo }) {
  if (!episodes.length) {
    return <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No episodes yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {episodes.map((e, i) => (
        <EpisodeRow key={e.id} ep={e} index={i} queue={episodes} show={show} />
      ))}
    </ul>
  );
}
