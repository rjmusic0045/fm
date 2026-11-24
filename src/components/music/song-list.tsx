"use client";

import * as React from "react";
import Link from "next/link";
import { Crown, Headphones, Heart, Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { Visualizer } from "@/components/audio/visualizer";
import { dtoToItem, type SongDTO } from "@/lib/song-dto";
import { useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

function LikeButton({ song, signedIn }: { song: SongDTO; signedIn: boolean }) {
  const [liked, setLiked] = React.useState(song.liked);
  const [likes, setLikes] = React.useState(song.likes);
  const [busy, setBusy] = React.useState(false);

  if (!signedIn) {
    return (
      <Link
        href="/login?callbackUrl=/music"
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        title="Sign in to like"
      >
        <Heart className="size-3.5" aria-hidden />
        <span className="tabular-nums">{formatCompact(likes)}</span>
        <span className="sr-only">likes. Sign in to like {song.title}</span>
      </Link>
    );
  }

  const toggle = async () => {
    const next = !liked;
    setBusy(true);
    setLiked(next); // optimistic
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/songs/${song.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: next }),
      });
      const data = (await res.json()) as { ok: boolean; liked?: boolean; likes?: number };
      if (!res.ok || !data.ok) throw new Error();
      setLiked(Boolean(data.liked));
      setLikes(data.likes ?? 0);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? `Unlike ${song.title}` : `Like ${song.title}`}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-60",
        liked ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      <Heart className={cn("size-3.5", liked && "fill-current")} aria-hidden />
      <span className="tabular-nums">{formatCompact(likes)}</span>
    </button>
  );
}

function SongRow({ song, index, queue, signedIn }: { song: SongDTO; index: number; queue: SongDTO[]; signedIn: boolean }) {
  const item = React.useMemo(() => dtoToItem(song), [song]);
  const active = useIsActive("song", item.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;

  return (
    <li className={cn("group/row flex items-center gap-4 px-3 py-2.5 transition-colors hover:bg-primary/[0.03] sm:px-4", active && "bg-primary/[0.05]")}>
      <span className="hidden w-6 text-right text-sm tabular-nums text-muted-foreground sm:block">
        {playingHere ? <Visualizer bars={3} className="h-3" /> : index + 1}
      </span>
      <div className="relative shrink-0">
        <CoverArt title={song.title} palette={song.palette} image={song.coverUrl ?? undefined} className="size-14 rounded-lg" />
        <button
          type="button"
          onClick={() => (active ? toggle() : playQueue(queue.map(dtoToItem), index))}
          aria-label={`${playingHere ? "Pause" : "Play"} ${song.title} by ${song.artist}`}
          aria-pressed={playingHere}
          className={cn(
            "absolute inset-0 grid place-items-center rounded-lg bg-black/40 text-white transition-opacity",
            playingHere ? "opacity-100" : "opacity-0 hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          {playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1.5 font-medium", active && "text-primary")}>
          <span className="truncate">{song.title}</span>
          {song.access === "PREMIUM" && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200" title="Premium: preview only without a plan">
              <Crown className="size-2.5" aria-hidden /> PREMIUM
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {song.artist}
          <span className="hidden sm:inline"> · {song.album}</span>
        </p>
      </div>
      <span className="hidden w-24 shrink-0 justify-center md:flex">
        <span className="max-w-full truncate rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{song.genre}</span>
      </span>
      <span className="hidden w-20 items-center justify-end gap-1 text-xs tabular-nums text-muted-foreground sm:inline-flex" title={`${song.plays} plays`}>
        <Headphones className="size-3.5" aria-hidden /> {formatCompact(song.plays)}
      </span>
      <LikeButton song={song} signedIn={signedIn} />
      <span className="hidden w-12 text-right text-xs tabular-nums text-muted-foreground sm:block">
        {song.duration ? formatDuration(song.duration) : "–"}
      </span>
    </li>
  );
}

export function SongList({ songs, signedIn }: { songs: SongDTO[]; signedIn: boolean }) {
  if (!songs.length) {
    return <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No songs yet.</p>;
  }
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="hidden items-center gap-4 border-b border-border/70 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:flex"
      >
        <span className="w-6 text-right">#</span>
        <span className="w-14 shrink-0" />
        <span className="flex-1">Title</span>
        <span className="hidden w-24 text-center md:block">Genre</span>
        <span className="w-20 text-right">Plays</span>
        <span className="w-[68px] text-center">Likes</span>
        <span className="w-12 text-right">Time</span>
      </div>
      <ul className="divide-y divide-border/70">
        {songs.map((s, i) => (
          <SongRow key={s.id} song={s} index={i} queue={songs} signedIn={signedIn} />
        ))}
      </ul>
    </div>
  );
}
