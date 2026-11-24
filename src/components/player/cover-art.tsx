import { Radio } from "lucide-react";
import type { Palette } from "@/data/catalog";
import { cn } from "@/lib/utils";

interface CoverArtProps {
  title: string;
  palette: Palette;
  kind?: "song" | "station";
  className?: string;
  // Show the big monogram (hide for tiny thumbnails).
  showLabel?: boolean;
  // Optional photo; drawn over the generative art (which shows while it loads).
  image?: string;
}

// Generative cover art: zero network requests, crisp at any size.
// Two-colour mesh + concentric "sound wave" rings + monogram.
export function CoverArt({ title, palette, kind = "song", className, showLabel = true, image }: CoverArtProps) {
  const [from, to] = palette;
  const initials = title
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <div
      aria-hidden
      className={cn("relative isolate aspect-square overflow-hidden rounded-xl [container-type:inline-size]", className)}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full opacity-20">
        {[18, 30, 42, 54, 66].map((r) => (
          <circle key={r} cx="80" cy="85" r={r} fill="none" stroke="white" strokeWidth="0.6" />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      )}
      {showLabel && !image && (
        <div className="absolute inset-0 grid place-items-center">
          {kind === "station" ? (
            <Radio className="size-1/3 text-white/90 drop-shadow-lg" strokeWidth={1.5} />
          ) : (
            <span className="font-display text-[clamp(1rem,28cqw,3rem)] font-bold text-white/90 drop-shadow-lg">
              {initials}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
