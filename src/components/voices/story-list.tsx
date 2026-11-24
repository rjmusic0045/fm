"use client";

import * as React from "react";
import Link from "next/link";
import { Crown, Headphones, MapPin, Pause, Play, Star } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { Visualizer } from "@/components/audio/visualizer";
import { voiceToItem, type VoiceDTO } from "@/lib/voice-dto";
import { voiceCategoryById } from "@/config/voices";
import { useIsActive, usePlayer } from "@/stores/player-store";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

function StoryRow({ story, index, queue, showCategory }: { story: VoiceDTO; index: number; queue: VoiceDTO[]; showCategory?: boolean }) {
  const active = useIsActive("song", `voice-${story.id}`);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;
  const cat = voiceCategoryById(story.category);

  return (
    <li className={cn("flex items-center gap-4 px-3 py-3 transition-colors hover:bg-primary/[0.03] sm:px-4", active && "bg-primary/[0.05]")}>
      <div className="relative shrink-0">
        <CoverArt title={story.title} palette={story.palette} image={story.coverUrl ?? undefined} showLabel={false} className="size-14 rounded-xl" />
        <button
          type="button"
          onClick={() => (active ? toggle() : playQueue(queue.map(voiceToItem), index))}
          aria-label={`${playingHere ? "Pause" : "Play"} ${story.title}`}
          aria-pressed={playingHere}
          className={cn(
            "absolute inset-0 grid place-items-center rounded-xl bg-black/35 text-white transition-opacity",
            playingHere ? "opacity-100" : "opacity-0 hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          {playingHere ? <Visualizer bars={3} className="h-4" /> : <Play className="size-5 translate-x-px fill-current" />}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          {story.featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
          <Link href={`/voices/story/${story.slug}`} className={cn("truncate font-medium hover:text-primary", active && "text-primary")}>
            {story.title}
          </Link>
          {story.premium && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <Crown className="size-2.5" aria-hidden /> PREMIUM
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {story.speaker}
          {showCategory && cat ? ` · ${cat.name}` : ""} · {story.topic}
        </p>
        {(story.place || story.language) && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {story.place && (
              <>
                <MapPin className="size-3 shrink-0" aria-hidden /> {story.place}
              </>
            )}
            {story.place && story.language ? " · " : ""}
            {story.language}
          </p>
        )}
      </div>
      <span className="hidden w-16 items-center justify-end gap-1 text-xs tabular-nums text-muted-foreground sm:inline-flex" title={`${story.plays} plays`}>
        <Headphones className="size-3.5" aria-hidden /> {formatCompact(story.plays)}
      </span>
      <span className="hidden w-12 text-right text-xs tabular-nums text-muted-foreground sm:block">{story.duration ? formatDuration(story.duration) : "–"}</span>
      <button
        type="button"
        onClick={() => (active ? toggle() : playQueue(queue.map(voiceToItem), index))}
        aria-label={`${playingHere ? "Pause" : "Play"} ${story.title}`}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 sm:hidden"
      >
        {playingHere ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
      </button>
    </li>
  );
}

export function StoryList({ stories, showCategory, empty = "No stories here yet." }: { stories: VoiceDTO[]; showCategory?: boolean; empty?: string }) {
  if (!stories.length) {
    return <p className="glass rounded-2xl p-10 text-center text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
      {stories.map((s, i) => (
        <StoryRow key={s.id} story={s} index={i} queue={stories} showCategory={showCategory} />
      ))}
    </ul>
  );
}

/** Large play button for the story page. */
export function PlayStoryButton({ story }: { story: VoiceDTO }) {
  const active = useIsActive("song", `voice-${story.id}`);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const playingHere = active && isPlaying;
  return (
    <button
      type="button"
      onClick={() => (active ? toggle() : playQueue([voiceToItem(story)], 0))}
      className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-indigo-950 shadow-lg transition-transform hover:scale-[1.02]"
    >
      {playingHere ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
      {playingHere ? "Pause" : "Listen to the story"}
    </button>
  );
}
