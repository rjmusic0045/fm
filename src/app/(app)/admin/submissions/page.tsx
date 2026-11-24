import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/kit";
import { SubmissionsQueue } from "@/components/admin/submissions-queue";
import { submissionTypeLabel } from "@/config/voices";

export const metadata: Metadata = { title: "Admin · Review queue" };
export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const subs = await prisma.voiceSubmission.findMany({ orderBy: { createdAt: "asc" }, take: 500 });
  const userIds = [...new Set(subs.map((s) => s.userId))];
  const storyIds = subs.map((s) => s.storyId).filter((x): x is string => Boolean(x));
  const [users, stories] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
    storyIds.length ? prisma.voiceStory.findMany({ where: { id: { in: storyIds } }, select: { id: true, slug: true } }) : [],
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const slugById = new Map(stories.map((s) => [s.id, s.slug]));

  return (
    <>
      <PageHeader title="Review queue" description="Listener submissions to Submit Your Voice. Approve to publish into People & Voices, request changes, or reject." />
      <SubmissionsQueue
        items={subs.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          typeLabel: submissionTypeLabel(s.type),
          category: s.category,
          topic: s.topic,
          language: s.language,
          place: [s.village, s.district, s.state].filter(Boolean).join(", "),
          displayName: s.displayName,
          anonymous: s.anonymous,
          audioUrl: s.audioUrl,
          duration: s.duration,
          recorded: s.recorded,
          consentAt: s.consentAt.toISOString(),
          status: s.status,
          reviewNote: s.reviewNote,
          submitter: userById.get(s.userId) ?? { name: null, email: "(deleted user)" },
          storySlug: s.storyId ? slugById.get(s.storyId) ?? null : null,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
