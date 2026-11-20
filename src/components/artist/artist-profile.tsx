"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileHeader } from "@/components/artist/profile-header";
import { TrackRow } from "@/components/artist/track-row";
import { ReleaseCard } from "@/components/artist/release-card";
import { ArtistSidebar } from "@/components/artist/artist-sidebar";
import { staggerContainer } from "@/components/motion/reveal";
import { artistTracks, playlists, releases, repostedTracks, type ArtistTrack, type Release } from "@/data/artist";
import { cn } from "@/lib/utils";

const byDate = (a: ArtistTrack, b: ArtistTrack) => b.postedAt.localeCompare(a.postedAt);

const tabs = [
  { id: "all", label: "All" },
  { id: "popular", label: "Popular tracks" },
  { id: "tracks", label: "Tracks" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
  { id: "reposts", label: "Reposts" },
] as const;
type TabId = (typeof tabs)[number]["id"];

const feeds: Record<"all" | "popular" | "tracks" | "reposts", ArtistTrack[]> = {
  all: [...artistTracks, ...repostedTracks].sort(byDate),
  popular: [...artistTracks].sort((a, b) => b.plays - a.plays).slice(0, 5),
  tracks: [...artistTracks].sort(byDate),
  reposts: [...repostedTracks].sort(byDate),
};

function TrackFeed({ tracks, ranked }: { tracks: ArtistTrack[]; ranked?: boolean }) {
  return (
    <motion.ul className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
      {tracks.map((t, i) => (
        <TrackRow key={t.id} track={t} queue={tracks} index={i} rank={ranked ? i + 1 : undefined} />
      ))}
    </motion.ul>
  );
}

function ReleaseGrid({ items }: { items: Release[] }) {
  return (
    <motion.ul
      className="grid grid-cols-2 gap-5 sm:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {items.map((r) => (
        <ReleaseCard key={r.id} release={r} />
      ))}
    </motion.ul>
  );
}

export function ArtistProfile() {
  const [tab, setTab] = React.useState<TabId>("all");
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab);
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="container max-w-6xl space-y-8 pb-16">
      <ProfileHeader />

      {/* Tabs */}
      <div className="glass-strong sticky top-[5.5rem] z-30 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none]">
        <div role="tablist" aria-label="Profile sections" className="flex min-w-max gap-1" onKeyDown={onTabKey}>
          {tabs.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="artist-tab"
                  className="absolute inset-0 -z-10 rounded-xl bg-neon-gradient-soft ring-1 ring-inset ring-foreground/10"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="min-w-0"
          >
            <h2 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {tab === "all" ? "Recent activity" : tabs.find((t) => t.id === tab)?.label}
            </h2>
            {tab === "albums" ? (
              <ReleaseGrid items={releases} />
            ) : tab === "playlists" ? (
              <ReleaseGrid items={playlists} />
            ) : (
              <TrackFeed tracks={feeds[tab]} ranked={tab === "popular"} />
            )}
          </motion.section>
        </AnimatePresence>

        <ArtistSidebar />
      </div>
    </div>
  );
}
