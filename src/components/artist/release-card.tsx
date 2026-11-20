"use client";

import { motion } from "framer-motion";
import { ListMusic, Pause, Play } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { trackToItem } from "@/components/artist/track-row";
import { staggerItem } from "@/components/motion/reveal";
import { findTracks, type Release } from "@/data/artist";
import { usePlayer } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";

export function ReleaseCard({ release }: { release: Release }) {
  const tracks = findTracks(release.trackIds);
  const total = tracks.reduce((n, t) => n + t.duration, 0);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playingThis = usePlayer(
    (s) => s.queue.length === tracks.length && s.queue.every((q, i) => q.id === tracks[i]?.id),
  );
  const playingHere = playingThis && isPlaying;

  return (
    <motion.li variants={staggerItem} className="group/rel">
      <div className="relative">
        <CoverArt
          title={release.title}
          palette={tracks[0]?.palette ?? ["#7C3AED", "#EC4899"]}
          image={release.image}
          className="rounded-2xl shadow-glass transition-transform duration-300 group-hover/rel:-translate-y-1"
        />
        {release.kind === "Playlist" && (
          <span className="absolute inset-y-0 right-0 flex w-1/3 flex-col items-center justify-center gap-1 rounded-r-2xl bg-black/55 text-xs font-semibold text-white">
            <ListMusic className="size-5" aria-hidden />
            {tracks.length}
          </span>
        )}
        <button
          type="button"
          onClick={() => (playingThis ? toggle() : playQueue(tracks.map(trackToItem), 0))}
          aria-label={`${playingHere ? "Pause" : "Play"} ${release.title}`}
          className={cn(
            "absolute bottom-3 left-3 grid size-12 place-items-center rounded-full bg-neon-gradient text-white shadow-glow transition-all duration-300",
            playingHere ? "opacity-100" : "translate-y-2 opacity-0 group-hover/rel:translate-y-0 group-hover/rel:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
          )}
        >
          {playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
        </button>
      </div>
      <h3 className={cn("mt-3 truncate font-sans text-sm font-semibold", playingThis && "text-gradient")}>{release.title}</h3>
      <p className="text-xs text-muted-foreground">
        {release.kind} · {release.year} · {tracks.length} tracks · {formatDuration(total)}
      </p>
    </motion.li>
  );
}
