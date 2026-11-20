"use client";

import { motion } from "framer-motion";
import { Clock, Pause, Play } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Visualizer } from "@/components/audio/visualizer";
import { CoverArt } from "@/components/player/cover-art";
import { SectionHeading } from "@/components/layout/section-heading";
import { staggerContainer, staggerItem } from "@/components/motion/reveal";
import { songs, type Song } from "@/data/catalog";
import { GUEST_PREVIEW_SECONDS, songToItem, useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";

const queue = songs.map(songToItem);

function SongCard({ song, index }: { song: Song; index: number }) {
  const active = useIsActive("song", song.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const progress = usePlayer((s) => (active && s.duration ? s.currentTime / s.duration : 0));
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;

  return (
    <motion.li variants={staggerItem}>
      <GlassCard interactive className={cn("p-3", active && "border-neon-violet/50 shadow-glow")}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <CoverArt title={song.title} palette={song.palette} className="size-16 rounded-lg" />
            <button
              type="button"
              onClick={() => (active ? toggle() : playQueue(queue, index))}
              aria-label={`${playingHere ? "Pause" : "Play"} ${song.title} by ${song.artist}`}
              aria-pressed={playingHere}
              className={cn(
                "absolute inset-0 grid place-items-center rounded-lg bg-black/50 text-white transition-opacity duration-200",
                playingHere ? "opacity-100" : "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover/card:opacity-100",
              )}
            >
              {playingHere ? (
                <>
                  <Visualizer className="h-5 group-hover/card:hidden" />
                  <Pause className="hidden size-6 fill-current group-hover/card:block" />
                </>
              ) : (
                <Play className="size-6 translate-x-px fill-current" />
              )}
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("truncate font-sans text-sm font-semibold", active && "text-gradient")}>{song.title}</h3>
            <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
            <p className="truncate text-xs text-muted-foreground/80">{song.album}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 pr-1 text-xs tabular-nums text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {formatDuration(song.duration)}
          </span>
        </div>
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-foreground/[0.06]" aria-hidden>
          <div className="h-full bg-neon-gradient transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </GlassCard>
    </motion.li>
  );
}

export function SongsSection() {
  const isGuest = usePlayer((s) => s.isGuest);
  return (
    <section id="songs" aria-labelledby="songs-title" className="container scroll-mt-28 py-20">
      <SectionHeading
        id="songs-title"
        eyebrow="Fresh drops"
        title={
          <>
            Sample the <span className="text-gradient">sound</span>
          </>
        }
        description={
          isGuest
            ? `Hit play on anything. Guests get a ${GUEST_PREVIEW_SECONDS}-second preview per track.`
            : "Hit play on anything. Unlimited listening is on us."
        }
      />
      <motion.ul
        className="grid gap-4 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {songs.map((s, i) => (
          <SongCard key={s.id} song={s} index={i} />
        ))}
      </motion.ul>
    </section>
  );
}
