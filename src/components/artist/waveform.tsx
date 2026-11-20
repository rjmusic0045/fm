"use client";

import * as React from "react";
import { cn, formatDuration } from "@/lib/utils";

/** Deterministic pseudo-random peaks from a seed string, so SSR and client agree. */
function peaksFor(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  const out: number[] = [];
  let prev = 0.5;
  for (let i = 0; i < count; i++) {
    // Smooth random walk + a slow "song shape" envelope (quiet intro/outro).
    const env = 0.55 + 0.45 * Math.sin((Math.PI * i) / count);
    prev = Math.min(1, Math.max(0.12, prev * 0.55 + rand() * 0.6));
    out.push(Math.max(0.1, prev * env));
  }
  return out;
}

interface WaveformProps {
  seed: string;
  /** 0..1 */
  progress: number;
  duration: number;
  active: boolean;
  /** Seek to fraction 0..1 */
  onSeek: (fraction: number) => void;
  bars?: number;
  className?: string;
  label: string;
}

export function Waveform({ seed, progress, duration, active, onSeek, bars = 72, className, label }: WaveformProps) {
  const peaks = React.useMemo(() => peaksFor(seed, bars), [seed, bars]);
  const [hover, setHover] = React.useState<number | null>(null);

  const fractionFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 5 / Math.max(duration, 1);
    if (e.key === "ArrowRight") onSeek(Math.min(1, progress + step));
    else if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - step));
    else return;
    e.preventDefault();
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`Seek ${label}`}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(progress * duration)}
      aria-valuetext={`${formatDuration(progress * duration)} of ${formatDuration(duration)}`}
      onPointerMove={(e) => setHover(fractionFromEvent(e))}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => onSeek(fractionFromEvent(e))}
      onKeyDown={onKeyDown}
      className={cn("group/wave relative flex h-12 cursor-pointer items-center gap-[3px] rounded-md", className)}
    >
      {peaks.map((p, i) => {
        const pos = (i + 0.5) / bars;
        const played = pos <= progress;
        const hovered = hover !== null && pos <= hover && !played;
        return (
          <span
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors duration-150",
              played ? "bg-primary" : hovered ? "bg-primary/40" : "bg-foreground/15",
            )}
            style={{ height: `${Math.round(p * 100)}%` }}
          />
        );
      })}

      {active && (
        <span className="pointer-events-none absolute -top-4 left-0 rounded bg-background/90 px-1 text-[10px] font-medium tabular-nums text-primary">
          {formatDuration(progress * duration)}
        </span>
      )}
      <span className="pointer-events-none absolute -top-4 right-0 rounded bg-background/90 px-1 text-[10px] tabular-nums text-muted-foreground">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
