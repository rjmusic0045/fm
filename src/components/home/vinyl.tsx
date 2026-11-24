"use client";

import * as React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Radio, Users } from "lucide-react";
import { LiveBadge } from "@/components/ui/badge";
import { Visualizer } from "@/components/audio/visualizer";
import { usePlayer } from "@/stores/player-store";

// 3D vinyl turntable. Tilts toward the pointer, spins continuously and
// drops the tonearm onto the record while audio is playing.
export function Vinyl() {
  const reduce = useReducedMotion();
  const isPlaying = usePlayer((s) => s.isPlaying);
  const ref = React.useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [22, 6]), { stiffness: 120, damping: 18 });

  // Platter speed eases between idle (slow) and playing (33⅓-ish) like a real deck.
  const rotation = useMotionValue(0);
  const speed = useSpring(isPlaying ? 120 : 24, { stiffness: 20, damping: 12 });
  React.useEffect(() => speed.set(isPlaying ? 120 : 24), [isPlaying, speed]);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    rotation.set((rotation.get() + (speed.get() * delta) / 1000) % 360);
  });

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto aspect-square w-full max-w-[30rem] [perspective:1400px]"
      aria-hidden
    >
      {/* glow */}
      <motion.div
        className="absolute inset-[8%] rounded-full bg-neon-gradient blur-3xl"
        animate={{ opacity: isPlaying ? 0.55 : 0.3, scale: isPlaying ? 1.05 : 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        style={{ rotateX: reduce ? 14 : rotateX, rotateY: reduce ? 0 : rotateY }}
      >
        {/* plinth */}
        <div className="glass-strong absolute inset-0 rounded-[2.5rem] [transform:translateZ(-30px)]" />

        {/* record */}
        <div className="absolute inset-[9%] [transform:translateZ(10px)]">
          <motion.div
            className="size-full rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)]"
            style={{
              rotate: rotation,
              background:
                "repeating-radial-gradient(circle at center, #0b0b10 0px, #0b0b10 2px, #16161f 3px, #0b0b10 4px)",
            }}
          >
            {/* label */}
            <div className="absolute inset-[33%] grid place-items-center rounded-full bg-neon-gradient shadow-inner">
              <div className="text-center leading-none text-white">
                <p className="font-display text-[clamp(.6rem,2.2vw,1rem)] font-bold">LUMEN</p>
                <p className="mt-1 text-[clamp(.45rem,1.2vw,.6rem)] tracking-[0.3em]">33⅓ RPM</p>
              </div>
              <div className="absolute size-[10%] rounded-full bg-ink-950 ring-2 ring-foreground/40" />
            </div>
          </motion.div>
          {/* static light sheen (does not rotate, like a real record) */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 210deg, transparent 0deg, rgba(255,255,255,0.14) 25deg, transparent 60deg, transparent 180deg, rgba(236,72,153,0.16) 210deg, transparent 245deg)",
            }}
          />
        </div>

        {/* tonearm */}
        <motion.svg
          viewBox="0 0 100 200"
          className="absolute right-[2%] top-[4%] h-[62%] origin-[70%_12%] drop-shadow-2xl [transform:translateZ(40px)]"
          animate={{ rotate: isPlaying ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
        >
          <defs>
            <linearGradient id="arm" x1="0" x2="1">
              <stop offset="0" stopColor="#d4d4e0" />
              <stop offset="1" stopColor="#8a8aa0" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="24" r="16" fill="#1d1d2c" stroke="url(#arm)" strokeWidth="3" />
          <circle cx="70" cy="24" r="6" fill="url(#arm)" />
          <path d="M70 24 L62 150 L44 178" stroke="url(#arm)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <rect x="32" y="172" width="22" height="14" rx="3" fill="#EC4899" transform="rotate(-30 43 179)" />
        </motion.svg>
      </motion.div>

      {/* floating chips */}
      <div className="glass absolute -left-2 top-[18%] flex animate-float items-center gap-2 rounded-2xl px-3 py-2 text-xs sm:-left-6">
        <Radio className="size-4 text-primary" />
        <span className="font-semibold">98.3 FM</span>
        <LiveBadge />
      </div>
      <div
        className="glass absolute -right-2 bottom-[16%] flex animate-float items-center gap-2 rounded-2xl px-3 py-2 text-xs sm:-right-4"
        style={{ animationDelay: "-3s" }}
      >
        <Users className="size-4 text-amber-700" />
        <span>
          <span className="font-semibold">78.2K</span> listening now
        </span>
        <Visualizer bars={3} className="h-3" playing={isPlaying} />
      </div>
    </div>
  );
}
