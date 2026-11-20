"use client";

import * as React from "react";
import { BadgeCheck, Check, MapPin, Mail, Pause, Play, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackToItem } from "@/components/artist/track-row";
import { artist, artistTracks } from "@/data/artist";
import { usePlayer } from "@/stores/player-store";
import { formatCompact } from "@/lib/utils";

const queue = artistTracks.map(trackToItem);

export function ProfileHeader() {
  const [following, setFollowing] = React.useState(false);
  const playQueue = usePlayer((s) => s.playQueue);
  const toggle = usePlayer((s) => s.toggle);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playingArtist = usePlayer((s) => artistTracks.some((t) => t.id === s.queue[s.index]?.id));
  const paused = !(playingArtist && isPlaying);

  const stats = [
    { label: "Followers", value: artist.followers + (following ? 1 : 0) },
    { label: "Following", value: artist.following },
    { label: "Tracks", value: artist.tracksCount },
  ];

  return (
    <header className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Banner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artist.banner} alt="" fetchPriority="high" className="h-40 w-full object-cover sm:h-56" />

      <div className="flex flex-col gap-5 px-5 pb-6 sm:px-8 md:flex-row md:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artist.avatar}
          alt={`${artist.name} profile photo`}
          className="-mt-14 size-28 shrink-0 rounded-full border-4 border-card object-cover shadow-sm sm:-mt-16 sm:size-32"
        />

        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-4xl">
            {artist.name}
            {artist.verified && <BadgeCheck className="size-6 shrink-0 text-primary" aria-label="Verified artist" />}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{artist.realName}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {artist.city}, {artist.country}
            </span>
            <span aria-hidden>·</span>
            <span>Radio host &amp; curator</span>
          </p>

          <dl className="mt-4 flex gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-lg font-semibold tabular-nums">{formatCompact(s.value)}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => (playingArtist ? toggle() : playQueue(queue, 0))}>
            {paused ? <Play className="fill-current" /> : <Pause className="fill-current" />}
            {paused ? "Play all" : "Pause"}
          </Button>
          <Button variant="outline" onClick={() => setFollowing((f) => !f)} aria-pressed={following}>
            {following ? <Check /> : <UserPlus />}
            {following ? "Following" : "Follow"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share profile">
            <Share2 />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Send message">
            <Mail />
          </Button>
        </div>
      </div>
    </header>
  );
}
