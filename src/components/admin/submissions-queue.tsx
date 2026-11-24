"use client";

import * as React from "react";
import Link from "next/link";
import { Check, EyeOff, MapPin, Mic, PencilLine, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessSelect, EditorDialog, Field, FormError, PublishControl, inputClass, textareaClass, useAdminAction } from "@/components/admin/kit";
import { VOICE_CATEGORIES, voiceCategoryById, type VoiceCategoryId } from "@/config/voices";
import { cn, formatDuration } from "@/lib/utils";

export interface QueueItem {
  id: string;
  title: string;
  description: string;
  typeLabel: string;
  category: VoiceCategoryId;
  topic: string;
  language: string | null;
  place: string;
  displayName: string;
  anonymous: boolean;
  audioUrl: string | null;
  duration: number;
  recorded: boolean;
  consentAt: string;
  status: "PENDING" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  submitter: { name: string | null; email: string };
  storySlug: string | null;
  createdAt: string;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function ApproveForm({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const [category, setCategory] = React.useState<VoiceCategoryId>(item.category);
  const cat = voiceCategoryById(category)!;
  const [topic, setTopic] = React.useState(cat.topics.includes(item.topic) ? item.topic : cat.topics[0]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mode = fd.get("publishMode");
    if (mode === "schedule" && !fd.get("publishAt")) return;
    void run(
      () =>
        fetch(`/api/admin/submissions/${item.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            title: String(fd.get("title") ?? "").trim() || undefined,
            category,
            topic,
            featured: (e.currentTarget.elements.namedItem("featured") as HTMLInputElement).checked,
            access: fd.get("access"),
            publishAt: mode === "schedule" ? String(fd.get("publishAt")) : null,
            note: String(fd.get("note") ?? "").trim() || undefined,
          }),
        }),
      onClose,
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title">
        <input name="title" defaultValue={item.title} maxLength={160} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => {
              const id = e.target.value as VoiceCategoryId;
              setCategory(id);
              const next = voiceCategoryById(id)!;
              if (!next.topics.includes(topic)) setTopic(next.topics[0]);
            }}
            className={inputClass}
          >
            {VOICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Topic">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
            {cat.topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AccessSelect />
        <PublishControl />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" className="size-4 accent-[hsl(var(--primary))]" /> Feature on People &amp; Voices
      </label>
      <Field label="Note to the listener (optional)">
        <textarea name="note" maxLength={1000} className={textareaClass} placeholder="Thank you for sharing!" />
      </Field>
      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          <Check /> Approve &amp; publish
        </Button>
      </div>
    </form>
  );
}

function NoteForm({ item, action, onClose }: { item: QueueItem; action: "reject" | "request_changes"; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const note = String(new FormData(e.currentTarget).get("note") ?? "").trim();
    void run(
      () => fetch(`/api/admin/submissions/${item.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) }),
      onClose,
    );
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {action === "reject"
          ? "The listener will see this note. Rejected recordings are deleted for privacy."
          : "Tell the listener what to change. They can edit and resubmit."}
      </p>
      <Field label="Note to the listener *">
        <textarea name="note" required minLength={3} maxLength={1000} className={textareaClass} autoFocus />
      </Field>
      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant={action === "reject" ? "destructive" : "primary"} loading={busy}>
          {action === "reject" ? "Reject submission" : "Request changes"}
        </Button>
      </div>
    </form>
  );
}

function Card({ item, onAct }: { item: QueueItem; onAct: (a: "approve" | "reject" | "request_changes") => void }) {
  const cat = voiceCategoryById(item.category);
  const open = item.status === "PENDING" || item.status === "CHANGES_REQUESTED";
  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-muted-foreground">
            {item.typeLabel} · {cat?.name} · {item.topic}
            {item.language ? ` · ${item.language}` : ""} · {item.duration ? formatDuration(item.duration) : "–"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              by {item.submitter.name ?? "—"} &lt;{item.submitter.email}&gt;
            </span>
            <span>
              credit:{" "}
              {item.anonymous ? (
                <span className="inline-flex items-center gap-0.5 text-amber-700">
                  <EyeOff className="size-3" aria-hidden /> Anonymous
                </span>
              ) : (
                item.displayName || "—"
              )}
            </span>
            {item.place && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" aria-hidden /> {item.place}
                {item.anonymous && " (hidden)"}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              {item.recorded ? <Mic className="size-3" aria-hidden /> : <Upload className="size-3" aria-hidden />} {item.recorded ? "recorded" : "uploaded"}
            </span>
            <span className="inline-flex items-center gap-0.5 text-emerald-700">
              <ShieldCheck className="size-3" aria-hidden /> consent {when(item.consentAt)}
            </span>
            <span>sent {when(item.createdAt)}</span>
          </p>
        </div>
        {item.status === "APPROVED" && item.storySlug && (
          <Link href={`/voices/story/${item.storySlug}`} className="text-sm font-medium text-primary hover:underline">
            View story →
          </Link>
        )}
      </div>
      {item.description && <p className="whitespace-pre-line rounded-lg bg-muted/50 px-3 py-2 text-sm">{item.description}</p>}
      {item.audioUrl ? (
        <audio controls preload="none" src={item.audioUrl} className="h-10 w-full" aria-label={`Listen: ${item.title}`} />
      ) : (
        <p className="text-xs text-muted-foreground">Recording deleted.</p>
      )}
      {item.reviewNote && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Last note:</span> {item.reviewNote}
        </p>
      )}
      {open && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onAct("approve")}>
            <Check /> Approve &amp; publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAct("request_changes")}>
            <PencilLine /> Request changes
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onAct("reject")}>
            <X /> Reject
          </Button>
        </div>
      )}
    </li>
  );
}

const TABS = [
  { id: "PENDING", label: "Pending" },
  { id: "CHANGES_REQUESTED", label: "Changes requested" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
] as const;

export function SubmissionsQueue({ items }: { items: QueueItem[] }) {
  const [tab, setTab] = React.useState<QueueItem["status"]>("PENDING");
  const [acting, setActing] = React.useState<{ item: QueueItem; action: "approve" | "reject" | "request_changes" } | null>(null);
  const shown = items.filter((i) => i.status === tab);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Review status" className="inline-flex flex-wrap gap-1 rounded-full bg-muted p-1">
        {TABS.map((t) => {
          const n = items.filter((i) => i.status === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium", tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
              <span className={cn("ml-1.5 rounded-full px-1.5 text-xs", t.id === "PENDING" && n ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{n}</span>
            </button>
          );
        })}
      </div>

      {shown.length ? (
        <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
          {shown.map((i) => (
            <Card key={i.id} item={i} onAct={(action) => setActing({ item: i, action })} />
          ))}
        </ul>
      ) : (
        <p className="glass rounded-2xl p-10 text-center text-muted-foreground">{tab === "PENDING" ? "All caught up: nothing waiting for review." : "Nothing here."}</p>
      )}

      <EditorDialog
        open={acting !== null}
        onOpenChange={(o) => !o && setActing(null)}
        title={acting ? (acting.action === "approve" ? `Approve “${acting.item.title}”` : acting.action === "reject" ? "Reject submission" : "Request changes") : ""}
      >
        {acting &&
          (acting.action === "approve" ? (
            <ApproveForm item={acting.item} onClose={() => setActing(null)} />
          ) : (
            <NoteForm item={acting.item} action={acting.action} onClose={() => setActing(null)} />
          ))}
      </EditorDialog>
    </div>
  );
}
