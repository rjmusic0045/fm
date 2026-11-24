import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { MySubmissions } from "@/components/voices/my-submissions";
import { submissionTypeLabel, voiceCategoryById } from "@/config/voices";

export const metadata: Metadata = { title: "My submissions" };
export const dynamic = "force-dynamic";

export default async function MySubmissionsPage({ searchParams }: { searchParams: { sent?: string; resubmitted?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/submissions");

  const subs = await prisma.voiceSubmission.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
  const storyIds = subs.map((s) => s.storyId).filter((x): x is string => Boolean(x));
  const stories = storyIds.length ? await prisma.voiceStory.findMany({ where: { id: { in: storyIds } }, select: { id: true, slug: true } }) : [];
  const slugById = new Map(stories.map((s) => [s.id, s.slug]));

  return (
    <div className="container max-w-3xl space-y-6 pb-16">
      <PageHero
        eyebrow="People & Voices"
        title="My submissions"
        description="Follow the review of everything you've shared."
        actions={
          <Button asChild className="bg-white text-indigo-950 shadow-none hover:bg-white/90">
            <Link href="/voices/submit">
              <Plus /> New submission
            </Link>
          </Button>
        }
      />
      {(searchParams.sent || searchParams.resubmitted) && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden />
          {searchParams.sent ? "Thank you! Your submission is in the review queue." : "Resubmitted. It's back in the review queue."}
        </p>
      )}
      <MySubmissions
        items={subs.map((s) => ({
          id: s.id,
          title: s.title,
          typeLabel: submissionTypeLabel(s.type),
          categoryName: voiceCategoryById(s.category)?.name ?? s.category,
          topic: s.topic,
          status: s.status,
          reviewNote: s.reviewNote,
          audioUrl: s.audioUrl,
          storySlug: s.storyId ? slugById.get(s.storyId) ?? null : null,
          createdAt: s.createdAt.toISOString(),
          reviewedAt: s.reviewedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
