"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MySubmission {
  id: string;
  title: string;
  typeLabel: string;
  categoryName: string;
  topic: string;
  status: "PENDING" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  audioUrl: string | null;
  storySlug: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const STATUS = {
  PENDING: { label: "In review", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  CHANGES_REQUESTED: { label: "Changes requested", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  APPROVED: { label: "Published", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "Not accepted", cls: "bg-red-50 text-red-700 ring-red-200" },
} as const;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Item({ s }: { s: MySubmission }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const st = STATUS[s.status];
  const withdraw = async () => {
    if (!confirm(`Withdraw “${s.title}”? The recording will be deleted.`)) return;
    setBusy(true);
    const res = await fetch(`/api/voices/submissions/${s.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(((await res.json().catch(() => ({}))) as { message?: string }).message ?? "Couldn't withdraw.");
  };

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{s.title}</p>
          <p className="text-sm text-muted-foreground">
            {s.typeLabel} · {s.categoryName} · {s.topic} · sent {fmt(s.createdAt)}
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", st.cls)}>{st.label}</span>
      </div>
      {s.reviewNote && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            s.status === "REJECTED" ? "bg-red-50 text-red-800" : s.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
          )}
        >
          <span className="font-semibold">Reviewer: </span>
          {s.reviewNote}
        </p>
      )}
      {s.audioUrl && s.status !== "APPROVED" && <audio controls preload="none" src={s.audioUrl} className="h-10 w-full" aria-label={`Your recording: ${s.title}`} />}
      <div className="flex flex-wrap gap-2">
        {s.status === "APPROVED" && s.storySlug && (
          <Button asChild size="sm">
            <Link href={`/voices/story/${s.storySlug}`}>
              <ExternalLink /> View story
            </Link>
          </Button>
        )}
        {(s.status === "PENDING" || s.status === "CHANGES_REQUESTED") && (
          <Button asChild size="sm" variant={s.status === "CHANGES_REQUESTED" ? "gradient" : "outline"}>
            <Link href={`/voices/submit?edit=${s.id}`}>
              <Pencil /> {s.status === "CHANGES_REQUESTED" ? "Make changes" : "Edit"}
            </Link>
          </Button>
        )}
        {s.status !== "APPROVED" && (
          <Button size="sm" variant="ghost" onClick={withdraw} loading={busy}>
            {!busy && <Trash2 />} {s.status === "REJECTED" ? "Remove" : "Withdraw"}
          </Button>
        )}
      </div>
    </li>
  );
}

export function MySubmissions({ items }: { items: MySubmission[] }) {
  if (!items.length) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="font-semibold">You haven&apos;t submitted anything yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Your story could be the one someone needs to hear.</p>
        <Button asChild className="mt-4">
          <Link href="/voices/submit">Submit your voice</Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
      {items.map((s) => (
        <Item key={s.id} s={s} />
      ))}
    </ul>
  );
}
