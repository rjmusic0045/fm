"use client";

import * as React from "react";
import Link from "next/link";
import { Headphones, Heart, Pause, Play } from "lucide-react";
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
    <li className={cn("glass flex items-center gap-4 rounded-xl p-3 transition-colors", active && "border-primary/40")}>
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
        <p className={cn("truncate font-medium", active && "text-primary")}>{song.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {song.artist}
          <span className="hidden sm:inline"> · {song.album}</span>
        </p>
      </div>
      <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground md:inline">{song.genre}</span>
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
    <ul className="space-y-2">
      {songs.map((s, i) => (
        <SongRow key={s.id} song={s} index={i} queue={songs} signedIn={signedIn} />
      ))}
    </ul>
  );
}
