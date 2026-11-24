import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { CoverHero } from "@/components/layout/page-hero";
import { CategoryIcon, TopicChips, VoiceFilterBar } from "@/components/voices/voice-ui";
import { StoryList } from "@/components/voices/story-list";
import { listVoices } from "@/lib/voices";
import { VOICE_SECTION, voiceCategoryBySlug } from "@/config/voices";

export const dynamic = "force-dynamic";

type Search = { topic?: string; q?: string; language?: string; state?: string; district?: string; village?: string };

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const c = voiceCategoryBySlug(params.category);
  return c ? { title: `${c.name} · ${VOICE_SECTION.name}`, description: c.description } : { title: "Not found" };
}

export default async function VoiceCategoryPage({ params, searchParams }: { params: { category: string }; searchParams: Search }) {
  const category = voiceCategoryBySlug(params.category);
  if (!category) notFound();
  const topic = category.topics.includes(searchParams.topic ?? "") ? searchParams.topic : undefined;
  const filters = {
    q: searchParams.q?.slice(0, 100),
    language: searchParams.language?.slice(0, 40),
    state: searchParams.state?.slice(0, 80),
    district: searchParams.district?.slice(0, 80),
    village: searchParams.village?.slice(0, 80),
  };
  const stories = await listVoices({ category: category.id, topic, ...filters }, 100);
  const base = `/voices/${category.slug}`;

  return (
    <div className="container max-w-6xl space-y-8 pb-16">
      <Link href="/voices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> {VOICE_SECTION.name}
      </Link>

      <CoverHero palette={category.palette}>
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <CategoryIcon category={category} className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{VOICE_SECTION.name}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
            <p className="mt-2 max-w-2xl text-white/80">{category.description}</p>
          </div>
        </div>
        <div className="mt-6">
          <TopicChips category={category} active={topic} baseHref={base} />
        </div>
      </CoverHero>

      {category.sensitive && (
        <p className="flex items-start gap-2 rounded-xl border border-pink-200 bg-pink-50/70 px-4 py-3 text-sm text-pink-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          These are personal stories shared in trust. Many storytellers stay anonymous, and we never show their location.
        </p>
      )}

      <VoiceFilterBar action={base} values={filters} topic={topic} emphasiseLocation={category.locationFirst} />

      <section aria-label="Stories" className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {stories.length} {stories.length === 1 ? "story" : "stories"}
          {topic ? ` in “${topic}”` : ""}
        </p>
        <StoryList stories={stories} empty="No stories match yet. Check back soon." />
      </section>
    </div>
  );
}
