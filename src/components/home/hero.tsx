"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Headphones, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Visualizer } from "@/components/audio/visualizer";
import { Vinyl } from "@/components/home/vinyl";
import { stations } from "@/data/catalog";
import { stationToItem, usePlayer } from "@/stores/player-store";

const words: { text: string; gradient?: boolean }[] = [
  { text: "Your" },
  { text: "City." },
  { text: "Your", gradient: true },
  { text: "Sound.", gradient: true },
  { text: "Live." },
];

const stats = [
  { value: "120+", label: "Live stations" },
  { value: "2M+", label: "Monthly listeners" },
  { value: "320", label: "kbps HD audio" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const isPlaying = usePlayer((s) => s.isPlaying);
  const hasQueue = usePlayer((s) => s.queue.length > 0);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);

  const start = () => {
    if (hasQueue) toggle();
    else playQueue(stations.map(stationToItem), 0);
  };

  return (
    <section aria-labelledby="hero-title" className="container relative grid items-center gap-12 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
      <div className="text-center lg:text-left">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="glass" className="mb-6 gap-2 px-3 py-1.5 text-[13px] font-medium">
            <Visualizer bars={3} className="h-3" />
            8 stations broadcasting right now
          </Badge>
        </motion.div>

        <h1 id="hero-title" className="text-5xl font-bold leading-[1.02] sm:text-6xl xl:text-7xl">
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block"
              initial={reduce ? false : { opacity: 0, y: 40, rotateX: -60 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {w.gradient ? <span className="text-gradient animate-gradient-pan">{w.text}</span> : w.text}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          Tune into live FM from across India, discover handpicked tracks and listen ad-free in studio-grade HD.
          One tap and you&apos;re on air.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Button size="lg" onClick={start} aria-label={isPlaying ? "Pause radio" : "Start listening"}>
            {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            {isPlaying ? "Pause" : "Start Listening"}
          </Button>
          <Button asChild size="lg" variant="glass" className="group">
            <Link href="#stations">
              <Headphones />
              Explore stations
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </motion.div>

        <motion.dl
          className="mt-12 grid max-w-md grid-cols-3 gap-6 max-lg:mx-auto"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-2xl font-semibold sm:text-3xl">{s.value}</dd>
              <dd className="text-xs text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <Vinyl />
      </motion.div>
    </section>
  );
}
