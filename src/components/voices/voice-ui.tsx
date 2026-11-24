import Link from "next/link";
import { GraduationCap, Heart, Lightbulb, Mic, Mountain, Music, Sparkles, Trees } from "lucide-react";
import { VOICE_CATEGORIES, type VoiceCategory } from "@/config/voices";
import { LANGUAGES } from "@/config/taxonomy";
import { cn } from "@/lib/utils";

const ICONS = { Mic, Sparkles, Heart, GraduationCap, Lightbulb, Trees, Music, Mountain } as const;

export function CategoryIcon({ category, className }: { category: VoiceCategory; className?: string }) {
  const Icon = ICONS[category.icon];
  return <Icon className={className} aria-hidden />;
}

/** The eight People & Voices categories as cards with live story counts. */
export function CategoryGrid({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {VOICE_CATEGORIES.map((c) => (
        <li key={c.id}>
          <Link href={`/voices/${c.slug}`} className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
            <span
              className="mb-4 grid size-12 place-items-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${c.palette[0]}, ${c.palette[1]})` }}
            >
              <CategoryIcon category={c} className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">{c.name}</span>
            <span className="mt-1 text-sm text-muted-foreground">{c.tagline}</span>
            <span className="mt-4 text-xs font-medium text-primary">
              {counts[c.id] ?? 0} {counts[c.id] === 1 ? "story" : "stories"} →
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-[0.08] transition-opacity group-hover:opacity-[0.14]"
              style={{ background: c.palette[0] }}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Filter bar (plain GET form: works without JavaScript, URLs are shareable).
 * Location fields match partially and case-insensitively.
 */
export function VoiceFilterBar({
  action,
  values,
  topic,
  emphasiseLocation,
}: {
  action: string;
  values: { q?: string; language?: string; state?: string; district?: string; village?: string };
  topic?: string;
  emphasiseLocation?: boolean;
}) {
  const input = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
  const active = Boolean(values.q || values.language || values.state || values.district || values.village);
  return (
    <form method="get" action={action} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filter stories">
      {topic && <input type="hidden" name="topic" value={topic} />}
      <input name="q" defaultValue={values.q} placeholder="Search stories…" aria-label="Search" className={cn(input, "lg:col-span-2")} />
      <select name="language" defaultValue={values.language ?? ""} aria-label="Language" className={input}>
        <option value="">All languages</option>
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <input name="state" defaultValue={values.state} placeholder="State" aria-label="State" className={input} />
      <input name="district" defaultValue={values.district} placeholder="District" aria-label="District" className={input} />
      <input name="village" defaultValue={values.village} placeholder={emphasiseLocation ? "Village / town" : "Village"} aria-label="Village" className={input} />
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-6">
        <button type="submit" className="h-9 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110">
          Apply filters
        </button>
        {active && (
          <Link href={topic ? `${action}?topic=${encodeURIComponent(topic)}` : action} className="text-sm text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}

/** Topic chips for a category page. */
export function TopicChips({ category, active, baseHref }: { category: VoiceCategory; active?: string; baseHref: string }) {
  const chip = (on: boolean) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-sm transition-colors",
      on ? "bg-white text-indigo-950 shadow-sm" : "bg-white/10 text-indigo-50 ring-1 ring-inset ring-white/15 hover:bg-white/20",
    );
  return (
    <nav aria-label="Topics" className="flex flex-wrap gap-2">
      <Link href={baseHref} className={chip(!active)} aria-current={!active ? "page" : undefined}>
        All topics
      </Link>
      {category.topics.map((t) => (
        <Link key={t} href={`${baseHref}?topic=${encodeURIComponent(t)}`} className={chip(active === t)} aria-current={active === t ? "page" : undefined}>
          {t}
        </Link>
      ))}
    </nav>
  );
}
