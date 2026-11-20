"use client";

import { motion } from "framer-motion";
import { MapPin, Pause, Play, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiveBadge } from "@/components/ui/badge";
import { Visualizer } from "@/components/audio/visualizer";
import { CoverArt } from "@/components/player/cover-art";
import { SectionHeading } from "@/components/layout/section-heading";
import { staggerContainer, staggerItem } from "@/components/motion/reveal";
import { stations, type Station } from "@/data/catalog";
import { stationToItem, useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatCompact } from "@/lib/utils";

const queue = stations.map(stationToItem);

function StationCard({ station, index }: { station: Station; index: number }) {
  const active = useIsActive("station", station.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;

  const onClick = () => (active ? toggle() : playQueue(queue, index));

  return (
    <motion.li variants={staggerItem}>
      <GlassCard interactive className={cn("h-full p-4", active && "border-neon-pink/40 shadow-glow-pink")}>
        <button
          type="button"
          onClick={onClick}
          aria-label={`${playingHere ? "Pause" : "Play"} ${station.name}, ${station.frequency}`}
          aria-pressed={playingHere}
          className="group/play block w-full rounded-xl text-left"
        >
          <div className="relative">
            <CoverArt title={station.name} palette={station.palette} kind="station" className="rounded-xl" />
            <div className="absolute left-3 top-3">
              <LiveBadge className="bg-white/95 ring-0" />
            </div>
            <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 font-mono text-xs font-semibold text-white backdrop-blur">
              {station.frequency}
            </span>
            <span
              className={cn(
                "absolute bottom-3 right-3 grid size-12 place-items-center rounded-full bg-neon-gradient text-white shadow-glow-pink transition-all duration-300",
                playingHere
                  ? "scale-100 opacity-100"
                  : "translate-y-2 scale-90 opacity-0 group-hover/play:translate-y-0 group-hover/play:scale-100 group-hover/play:opacity-100 group-focus-visible/play:translate-y-0 group-focus-visible/play:opacity-100",
              )}
              aria-hidden
            >
              {playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
            </span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-sans text-base font-semibold">{station.name}</h3>
              <p className="text-sm text-muted-foreground">{station.genre}</p>
            </div>
            {playingHere && <Visualizer className="mt-1 h-4" />}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {station.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              <span className="tabular-nums">{formatCompact(station.listeners + (playingHere ? 1 : 0))}</span>
              <span className="sr-only">listeners</span>
            </span>
          </div>
        </button>
      </GlassCard>
    </motion.li>
  );
}

export function StationsSection() {
  return (
    <section id="stations" aria-labelledby="stations-title" className="container scroll-mt-28 py-20">
      <SectionHeading
        id="stations-title"
        eyebrow="On air now"
        title={
          <>
            Live <span className="text-gradient">FM stations</span>
          </>
        }
        description="Real-time radio from cities you love. Tap any station to tune in instantly."
      />
      <motion.ul
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        {stations.map((s, i) => (
          <StationCard key={s.id} station={s} index={i} />
        ))}
      </motion.ul>
    </section>
  );
}
