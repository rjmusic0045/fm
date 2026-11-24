import Link from "next/link";
import { cn } from "@/lib/utils";

/** Gradient header band used at the top of app pages (Music, Settings, Dashboard…). */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Rendered under the text (e.g. HeroTabs). */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("page-hero px-6 py-8 sm:px-10 sm:py-10", className)}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">{eyebrow}</p>}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-base text-indigo-100/85">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </header>
  );
}

/** Segmented pill tabs for use inside a PageHero (links, server-rendered). */
export function HeroTabs({ tabs, active }: { tabs: { id: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <nav aria-label="Sections" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/10 p-1 ring-1 ring-inset ring-white/15 backdrop-blur [scrollbar-width:none]">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === t.id ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-100 hover:bg-white/10 hover:text-white",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className={cn("ml-1.5 text-xs", active === t.id ? "text-indigo-500" : "text-indigo-200/70")}>{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Header for album / podcast / artist pages: the artwork, blurred, becomes the
 * backdrop (falls back to the item's palette), with a dark scrim for legible text.
 */
export function CoverHero({
  image,
  palette,
  children,
}: {
  image?: string | null;
  palette: readonly [string, string];
  children: React.ReactNode;
}) {
  return (
    <header
      className="relative isolate overflow-hidden rounded-3xl text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.6)]"
      style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-70 blur-2xl" />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
      <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
    </header>
  );
}
