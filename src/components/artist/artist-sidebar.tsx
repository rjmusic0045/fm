"use client";

import * as React from "react";
import { Heart, Play, UserPlus, Check, Users, ExternalLink } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import { trackToItem } from "@/components/artist/track-row";
import { artist, relatedArtists, repostedTracks, artistTracks } from "@/data/artist";
import { usePlayer } from "@/stores/player-store";
import { formatCompact } from "@/lib/utils";

const likes = [repostedTracks[0], artistTracks[2], repostedTracks[1], artistTracks[4]];

function SidebarSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <Icon className="size-4" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
}

function RelatedArtistRow({ a }: { a: (typeof relatedArtists)[number] }) {
  const [following, setFollowing] = React.useState(false);
  return (
    <li className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.image} alt="" loading="lazy" className="size-11 rounded-full object-cover ring-1 ring-foreground/10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{a.name}</p>
        <p className="flex gap-2 text-xs tabular-nums text-muted-foreground">
          <span>{formatCompact(a.followers)} followers</span>·<span>{a.tracks} tracks</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFollowing((f) => !f)}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${a.name}` : `Follow ${a.name}`}
        className="grid size-8 place-items-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground aria-pressed:border-neon-pink/50 aria-pressed:text-primary"
      >
        {following ? <Check className="size-4" /> : <UserPlus className="size-4" />}
      </button>
    </li>
  );
}

export function ArtistSidebar() {
  const playQueue = usePlayer((s) => s.playQueue);
  const queue = likes.map(trackToItem);

  return (
    <aside className="space-y-5">
      <SidebarSection title="About" icon={Users}>
        <p className="text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {artist.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
              >
                {l.label} <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title={`${likes.length} Likes`} icon={Heart}>
        <ul className="space-y-3">
          {likes.map((t, i) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => playQueue(queue, i)}
                className="group/like flex w-full items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-foreground/[0.05]"
              >
                <div className="relative shrink-0">
                  <CoverArt title={t.title} palette={t.palette} image={t.image} className="size-12 rounded-lg" />
                  <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/40 text-white opacity-0 transition-opacity group-hover/like:opacity-100">
                    <Play className="size-4 fill-current" aria-hidden />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="flex gap-3 text-[11px] tabular-nums text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Play className="size-3" aria-hidden />{formatCompact(t.plays)}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="size-3" aria-hidden />{formatCompact(t.likes)}</span>
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </SidebarSection>

      <SidebarSection title="Fans also like" icon={UserPlus}>
        <ul className="space-y-4">
          {relatedArtists.map((a) => (
            <RelatedArtistRow key={a.id} a={a} />
          ))}
        </ul>
      </SidebarSection>
    </aside>
  );
}
