import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isObjectId } from "@/lib/admin";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { SubmitVoiceForm, type SubmissionInitial } from "@/components/voices/submit-form";
import { VOICE_SECTION } from "@/config/voices";

export const metadata: Metadata = { title: `Submit your voice · ${VOICE_SECTION.name}` };
export const dynamic = "force-dynamic";

export default async function SubmitVoicePage({ searchParams }: { searchParams: { edit?: string } }) {
  const session = await getSession();

  let initial: SubmissionInitial | undefined;
  if (session && searchParams.edit) {
    if (!isObjectId(searchParams.edit)) notFound();
    const s = await prisma.voiceSubmission.findUnique({ where: { id: searchParams.edit } });
    if (!s || s.userId !== session.user.id || (s.status !== "PENDING" && s.status !== "CHANGES_REQUESTED")) notFound();
    initial = {
      id: s.id,
      type: s.type,
      title: s.title,
      description: s.description,
      category: s.category,
      topic: s.topic,
      language: s.language,
      state: s.state,
      district: s.district,
      village: s.village,
      displayName: s.displayName,
      anonymous: s.anonymous,
      duration: s.duration,
      reviewNote: s.status === "CHANGES_REQUESTED" ? s.reviewNote : null,
    };
  }

  return (
    <div className="container max-w-3xl space-y-6 pb-16">
      <PageHero
        eyebrow={VOICE_SECTION.name}
        title={initial ? "Edit your submission" : "Submit your voice"}
        description="Share a story, an opinion, a song or an idea. Our team listens to every submission before it goes live."
      />
      {session ? (
        <SubmitVoiceForm defaultName={session.user.name ?? ""} initial={initial} />
      ) : (
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <ShieldCheck className="size-10 text-primary" aria-hidden />
          <div>
            <p className="text-lg font-semibold">Sign in to submit your voice</p>
            <p className="mt-1 text-sm text-muted-foreground">A free account lets you submit recordings and follow their review.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/login?callbackUrl=/voices/submit">
                <LogIn /> Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
