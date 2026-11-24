import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/kit";
import { VoicesManager } from "@/components/admin/voices-manager";
import { VOICE_SECTION } from "@/config/voices";

export const metadata: Metadata = { title: "Admin · People & Voices" };
export const dynamic = "force-dynamic";

export default async function AdminVoicesPage() {
  const stories = await prisma.voiceStory.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title={VOICE_SECTION.name} description={`${VOICE_SECTION.tagline}. Publish stories into the eight categories; personal stories can be anonymous.`} />
      <VoicesManager
        stories={stories.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          description: s.description,
          category: s.category,
          topic: s.topic,
          language: s.language,
          state: s.state,
          district: s.district,
          village: s.village,
          speakerName: s.speakerName,
          anonymous: s.anonymous,
          duration: s.duration,
          coverUrl: s.coverUrl,
          palette: [s.coverFrom, s.coverTo],
          access: s.access,
          isActive: s.isActive,
          publishAt: s.publishAt?.toISOString() ?? null,
          featured: s.featured,
          plays: s.plays,
          fromSubmission: Boolean(s.submittedById),
        }))}
      />
    </>
  );
}
