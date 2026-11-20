"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveBadge } from "@/components/ui/badge";
import { Visualizer } from "@/components/audio/visualizer";
import { CoverArt } from "@/components/player/cover-art";
import { GUEST_PREVIEW_SECONDS, useCurrentItem, usePlayer } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";

function ProgressBar({ className }: { className?: string }) {
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seek);
  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex w-full items-center gap-3 text-[11px] tabular-nums text-muted-foreground", className)}>
      <span className="w-9 text-right">{formatDuration(currentTime)}</span>
      <input
        type="range"
        className="range"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(duration)}`}
        style={{ "--value": `${pct}%` } as React.CSSProperties}
        disabled={!duration}
      />
      <span className="w-9">{formatDuration(duration)}</span>
    </div>
  );
}

function VolumeControl() {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const effective = muted ? 0 : volume;
  const Icon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <Button variant="ghost" size="icon-sm" noRipple onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
        <Icon />
      </Button>
      <input
        type="range"
        className="range w-24"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        aria-valuetext={`${Math.round(effective * 100)}%`}
        style={{ "--value": `${effective * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

function PreviewMeter() {
  const isGuest = usePlayer((s) => s.isGuest);
  const elapsed = usePlayer((s) => s.previewElapsed);
  if (!isGuest) return null;
  const left = Math.max(0, Math.ceil(GUEST_PREVIEW_SECONDS - elapsed));
  return (
    <Link
      href="/signup"
      className="hidden items-center gap-2 rounded-full border border-neon-amber/30 bg-neon-amber/10 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-neon-amber/20 md:inline-flex"
    >
      <span className="tabular-nums">Preview · {left}s left</span>
    </Link>
  );
}

export function MiniPlayer() {
  const item = useCurrentItem();
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const error = usePlayer((s) => s.error);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);

  const isLive = item?.kind === "station";
  const mobilePct = !isLive && duration ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {item && (
        <motion.section
          aria-label="Audio player"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[60] px-2 pb-2 md:px-4 md:pb-4"
        >
          <div className="glass-strong relative mx-auto max-w-6xl overflow-hidden rounded-2xl">
            {/* thin progress line on mobile */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-foreground/10 md:hidden" aria-hidden>
              <div className="h-full bg-neon-gradient" style={{ width: isLive ? "100%" : `${mobilePct}%` }} />
            </div>

            <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 p-2.5 md:grid-cols-[1fr_minmax(0,1.4fr)_1fr] md:gap-6 md:px-4 md:py-3">
              {/* track info */}
              <div className="flex min-w-0 items-center gap-3">
                <motion.div key={item.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <CoverArt
                    title={item.title}
                    palette={item.palette}
                    kind={item.kind}
                    image={item.image}
                    showLabel={false}
                    className="size-12 rounded-lg shadow-lg md:size-14"
                  />
                </motion.div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    {isPlaying && !isBuffering && <Visualizer bars={3} className="h-3 shrink-0" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground" aria-live="polite">
                    {error ?? item.subtitle}
                  </p>
                </div>
              </div>

              {/* transport */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 md:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    noRipple
                    onClick={prev}
                    aria-label="Previous"
                    className="hidden sm:inline-flex"
                  >
                    <SkipBack className="fill-current" />
                  </Button>
                  <Button
                    variant="gradient"
                    size="icon"
                    onClick={toggle}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    className="size-11"
                  >
                    {isBuffering && isPlaying ? (
                      <Loader2 className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="fill-current" />
                    ) : (
                      <Play className="translate-x-px fill-current" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" noRipple onClick={next} aria-label="Next">
                    <SkipForward className="fill-current" />
                  </Button>
                </div>
                <div className="hidden w-full md:block">
                  {isLive ? (
                    <div className="flex items-center justify-center gap-2 py-0.5">
                      <LiveBadge />
                      <span className="text-[11px] text-muted-foreground">Broadcasting now</span>
                    </div>
                  ) : (
                    <ProgressBar />
                  )}
                </div>
              </div>

              {/* extras */}
              <div className="hidden items-center justify-end gap-3 md:flex">
                <PreviewMeter />
                <VolumeControl />
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** Reserves space at the bottom of the page so the player never covers content. */
export function PlayerSpacer() {
  const active = usePlayer((s) => s.queue.length > 0);
  return <div aria-hidden className={cn("transition-[height] duration-300", active ? "h-24 md:h-28" : "h-0")} />;
}
