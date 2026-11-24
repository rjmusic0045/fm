import type { Metadata } from "next";
import Link from "next/link";
import { Mic } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { CategoryGrid, VoiceFilterBar } from "@/components/voices/voice-ui";
import { StoryList } from "@/components/voices/story-list";
import { listVoices, voiceCounts } from "@/lib/voices";
import { VOICE_SECTION } from "@/config/voices";

export const metadata: Metadata = {
  title: `${VOICE_SECTION.name}: ${VOICE_SECTION.tagline}`,
  description: VOICE_SECTION.description,
};
export const dynamic = "force-dynamic";

type Search = { q?: string; language?: string; state?: string; district?: string; village?: string };

export default async function VoicesPage({ searchParams }: { searchParams: Search }) {
  const filters = {
    q: searchParams.q?.slice(0, 100),
    language: searchParams.language?.slice(0, 40),
    state: searchParams.state?.slice(0, 80),
    district: searchParams.district?.slice(0, 80),
    village: searchParams.village?.slice(0, 80),
  };
  const filtering = Object.values(filters).some(Boolean);
  const [counts, featured, latest] = await Promise.all([
    voiceCounts(),
    filtering ? Promise.resolve([]) : listVoices({ featured: true }, 6),
    listVoices(filters, filtering ? 100 : 20),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="container max-w-6xl space-y-10 pb-16">
      <PageHero
        eyebrow={VOICE_SECTION.name}
        title={VOICE_SECTION.tagline}
        description={VOICE_SECTION.description}
        actions={
          <Button asChild size="lg" className="bg-white text-indigo-950 shadow-none hover:bg-white/90">
            <Link href="/voices/submit">
              <Mic /> Submit your voice
            </Link>
          </Button>
        }
      >
        <p className="text-sm text-indigo-200/90">{total} stories across eight categories</p>
      </PageHero>

      {!filtering && (
        <section aria-labelledby="cats" className="space-y-4">
          <h2 id="cats" className="font-sans text-lg font-semibold">
            Explore categories
          </h2>
          <CategoryGrid counts={counts} />
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="space-y-4">
          <h2 id="featured" className="font-sans text-lg font-semibold">
            Featured stories
          </h2>
          <StoryList stories={featured} showCategory />
        </section>
      )}

      <section aria-labelledby="latest" className="space-y-4">
        <h2 id="latest" className="font-sans text-lg font-semibold">
          {filtering ? `${latest.length} matching ${latest.length === 1 ? "story" : "stories"}` : "Latest stories"}
        </h2>
        <VoiceFilterBar action="/voices" values={filters} />
        <StoryList stories={latest} showCategory empty={filtering ? "No stories match these filters." : "Stories are on their way."} />
      </section>
    </div>
  );
}
