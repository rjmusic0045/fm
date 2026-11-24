import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, Crown, Headphones, Languages, MapPin } from "lucide-react";
import { CoverHero } from "@/components/layout/page-hero";
import { CoverArt } from "@/components/player/cover-art";
import { PlayStoryButton, StoryList } from "@/components/voices/story-list";
import { getVoice, listVoices } from "@/lib/voices";
import { VOICE_SECTION, voiceCategoryById } from "@/config/voices";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getVoice(params.slug);
  return s ? { title: `${s.title} · ${VOICE_SECTION.name}`, description: s.description.slice(0, 160) } : { title: "Story not found" };
}

export default async function VoiceStoryPage({ params }: { params: { slug: string } }) {
  const story = await getVoice(params.slug);
  if (!story) notFound();
  const category = voiceCategoryById(story.category)!;
  const more = (await listVoices({ category: story.category, topic: story.topic }, 7)).filter((s) => s.id !== story.id).slice(0, 6);

  return (
    <div className="container max-w-5xl space-y-8 pb-16">
      <Link href={`/voices/${category.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> {category.name}
      </Link>

      <CoverHero image={story.coverUrl} palette={story.palette}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <CoverArt title={story.title} palette={story.palette} image={story.coverUrl ?? undefined} className="w-40 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/20 sm:w-48" />
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Link href={`/voices/${category.slug}`} className="hover:underline">
                {category.name}
              </Link>{" "}
              · {story.topic}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{story.title}</h1>
            <p className="text-lg text-white/85">{story.speaker}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
              {story.place && (
                <li className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden /> {story.place}
                </li>
              )}
              {story.language && (
                <li className="inline-flex items-center gap-1">
                  <Languages className="size-4" aria-hidden /> {story.language}
                </li>
              )}
              {story.duration > 0 && (
                <li className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden /> {formatDuration(story.duration)}
                </li>
              )}
              <li className="inline-flex items-center gap-1">
                <Headphones className="size-4" aria-hidden /> {story.plays} plays
              </li>
              {story.premium && (
                <li className="inline-flex items-center gap-1 text-amber-200">
                  <Crown className="size-4" aria-hidden /> Premium
                </li>
              )}
            </ul>
            <div className="pt-1">
              <PlayStoryButton story={story} />
            </div>
          </div>
        </div>
      </CoverHero>

      {story.description && (
        <section className="glass rounded-2xl p-6">
          <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">About this story</h2>
          <p className="whitespace-pre-line leading-relaxed">{story.description}</p>
        </section>
      )}

      {more.length > 0 && (
        <section aria-labelledby="more" className="space-y-3">
          <h2 id="more" className="font-sans text-lg font-semibold">
            More in {story.topic}
          </h2>
          <StoryList stories={more} />
        </section>
      )}
    </div>
  );
}
