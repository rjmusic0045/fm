"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Heart, Link2, MessageCircle, MoreHorizontal, Pause, Play, Repeat2, Share2 } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { Visualizer } from "@/components/audio/visualizer";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/artist/waveform";
import { staggerItem } from "@/components/motion/reveal";
import type { ArtistTrack } from "@/data/artist";
import { getAudio, type PlayableItem, useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatCompact } from "@/lib/utils";

export const trackToItem = (t: ArtistTrack): PlayableItem => ({
  id: t.id,
  kind: "song",
  title: t.title,
  subtitle: t.artist,
  src: t.src,
  palette: t.palette,
  duration: t.duration,
  image: t.image,
});

export function timeAgo(iso: string): string {
  const days = Math.round((Date.parse(iso) - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  if (Math.abs(days) < 30) return rtf.format(Math.round(days / 7), "week");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}

function ActionButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/5 text-primary"
          : "border-foreground/10 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", active && Icon === Heart && "fill-current")} aria-hidden />
      {count !== undefined && <span className="tabular-nums">{formatCompact(count)}</span>}
    </button>
  );
}

interface TrackRowProps {
  track: ArtistTrack;
  /** The list this row belongs to, so "next" continues through it. */
  queue: ArtistTrack[];
  index: number;
  rank?: number;
}

export function TrackRow({ track, queue, index, rank }: TrackRowProps) {
  const active = useIsActive("song", track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const progress = usePlayer((s) => (active && s.duration ? s.currentTime / s.duration : 0));
  const duration = usePlayer((s) => (active && s.duration ? s.duration : track.duration));
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const seek = usePlayer((s) => s.seek);
  const playingHere = active && isPlaying;

  const [liked, setLiked] = React.useState(false);
  const [reposted, setReposted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [ago, setAgo] = React.useState<string | null>(null);
  React.useEffect(() => setAgo(timeAgo(track.postedAt)), [track.postedAt]);

  const start = () => playQueue(queue.map(trackToItem), index);

  const onSeek = (fraction: number) => {
    if (active) {
      seek(fraction * duration);
      return;
    }
    start();
    // Seek once the new source has loaded its metadata.
    const el = getAudio();
    el?.addEventListener("loadedmetadata", () => seek(fraction * (el.duration || track.duration)), { once: true });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/artist#${track.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: ignore in demo */
    }
  };

  return (
    <motion.li variants={staggerItem} id={track.id} className="scroll-mt-28">
      {track.repostedFrom && (
        <p className="mb-2 flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
          <Repeat2 className="size-3.5" aria-hidden /> RJ Kiran reposted
        </p>
      )}
      <article
        className={cn(
          "glass group/row flex gap-4 rounded-xl p-3 transition-[border-color,box-shadow] duration-200 sm:p-4",
          active && "border-primary/40 shadow-glow",
        )}
      >
        {/* Cover */}
        <div className="relative hidden shrink-0 sm:block">
          <CoverArt title={track.title} palette={track.palette} image={track.image} className="size-32 rounded-lg md:size-36" />
          {rank !== undefined && (
            <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-background/95 text-xs font-semibold tabular-nums text-foreground shadow-sm">
              {rank}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => (active ? toggle() : start())}
              aria-label={`${playingHere ? "Pause" : "Play"} ${track.title}`}
              aria-pressed={playingHere}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              {playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
            </button>
            <CoverArt
              title={track.title}
              palette={track.palette}
              image={track.image}
              className="size-12 shrink-0 rounded-lg sm:hidden"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
              <h3 className={cn("flex items-center gap-2 truncate font-sans text-base font-semibold", active && "text-gradient")}>
                <span className="truncate">{track.title}</span>
                {playingHere && <Visualizer bars={3} className="h-3 shrink-0" />}
              </h3>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1.5 text-right md:flex">
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {ago ?? " "}
              </span>
              <Badge variant="violet">#{track.genre}</Badge>
            </div>
          </div>

          {/* Waveform */}
          <Waveform
            seed={track.id}
            progress={progress}
            duration={duration}
            active={active}
            onSeek={onSeek}
            label={track.title}
            className="mt-6"
          />

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <ActionButton
                icon={Heart}
                label={liked ? "Unlike" : "Like"}
                count={track.likes + (liked ? 1 : 0)}
                active={liked}
                onClick={() => setLiked((v) => !v)}
              />
              <ActionButton
                icon={Repeat2}
                label={reposted ? "Undo repost" : "Repost"}
                count={track.reposts + (reposted ? 1 : 0)}
                active={reposted}
                onClick={() => setReposted((v) => !v)}
              />
              <ActionButton icon={Share2} label="Share" />
              <ActionButton icon={Link2} label={copied ? "Link copied" : "Copy link"} active={copied} onClick={copyLink} />
              <ActionButton icon={MoreHorizontal} label="More" />
            </div>
            <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
              <span className="inline-flex items-center gap-1" title={`${track.plays.toLocaleString("en-IN")} plays`}>
                <Play className="size-3.5" aria-hidden /> {formatCompact(track.plays)}
              </span>
              <span className="inline-flex items-center gap-1" title={`${track.comments} comments`}>
                <MessageCircle className="size-3.5" aria-hidden /> {formatCompact(track.comments)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </motion.li>
  );
}
