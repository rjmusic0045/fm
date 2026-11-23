"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dtoToItem, type SongDTO } from "@/lib/song-dto";
import { episodeToItem, type EpisodeItemData } from "@/components/music/episode-list";
import type { Palette } from "@/data/catalog";
import { usePlayer, type PlayableItem } from "@/stores/player-store";

type Props =
  | { songs: SongDTO[]; episodes?: never; show?: never }
  | { songs?: never; episodes: EpisodeItemData[]; show: { title: string; coverUrl: string | null; palette: Palette; premium: boolean } };

/** Plays a whole album/artist/show from the top, or toggles it if already playing. */
export function PlayAllButton(props: Props) {
  const items: PlayableItem[] = props.songs ? props.songs.map(dtoToItem) : props.episodes.map((e) => episodeToItem(e, props.show));
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playingThis = usePlayer((s) => items.some((i) => i.id === s.queue[s.index]?.id));

  if (!items.length) return null;
  return (
    <Button onClick={() => (playingThis ? toggle() : playQueue(items, 0))}>
      {playingThis && isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
      {playingThis && isPlaying ? "Pause" : "Play all"}
    </Button>
  );
}
