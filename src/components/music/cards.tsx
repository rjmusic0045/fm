import Link from "next/link";
import { BadgeCheck, Crown, UserRound } from "lucide-react";
import { CoverArt } from "@/components/player/cover-art";
import type { AlbumCard, ArtistCard, PodcastCard } from "@/lib/catalog-db";
import { cn } from "@/lib/utils";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200",
        className,
      )}
    >
      <Crown className="size-3" aria-hidden /> Premium
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">{children}</p>;
}

export function AlbumGrid({ albums }: { albums: AlbumCard[] }) {
  if (!albums.length) return <Empty>No albums yet.</Empty>;
  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((a) => (
        <li key={a.id}>
          <Link href={`/music/albums/${a.slug}`} className="group block">
            <div className="relative">
              <CoverArt title={a.title} palette={a.palette} image={a.coverUrl ?? undefined} className="rounded-xl transition-transform group-hover:-translate-y-1" />
              {a.access === "PREMIUM" && <PremiumBadge className="absolute left-2 top-2" />}
            </div>
            <p className="mt-2 truncate font-medium group-hover:text-primary">{a.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {a.artistName ?? "Various artists"}
              {a.releaseYear ? ` · ${a.releaseYear}` : ""} · {a.trackCount} tracks
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PodcastGrid({ podcasts }: { podcasts: PodcastCard[] }) {
  if (!podcasts.length) return <Empty>No podcasts yet.</Empty>;
  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {podcasts.map((p) => (
        <li key={p.id}>
          <Link href={`/podcasts/${p.slug}`} className="group block">
            <div className="relative">
              <CoverArt title={p.title} palette={p.palette} image={p.coverUrl ?? undefined} className="rounded-xl transition-transform group-hover:-translate-y-1" />
              {p.access === "PREMIUM" && <PremiumBadge className="absolute left-2 top-2" />}
            </div>
            <p className="mt-2 truncate font-medium group-hover:text-primary">{p.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {p.host || p.category} · {p.episodeCount} episodes
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ArtistGrid({ artists }: { artists: ArtistCard[] }) {
  if (!artists.length) return <Empty>No artists yet.</Empty>;
  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
      {artists.map((a) => (
        <li key={a.id}>
          <Link href={`/artists/${a.slug}`} className="group block text-center">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" loading="lazy" className="mx-auto aspect-square w-full rounded-full object-cover transition-transform group-hover:-translate-y-1" />
            ) : (
              <span className="mx-auto grid aspect-square w-full place-items-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-1/3" aria-hidden />
              </span>
            )}
            <p className="mt-2 flex items-center justify-center gap-1 truncate font-medium group-hover:text-primary">
              {a.name}
              {a.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
            </p>
            <p className="text-sm text-muted-foreground">{a.songCount} songs</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
