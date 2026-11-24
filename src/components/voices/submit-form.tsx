"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mic, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/components/voices/audio-recorder";
import { Field, FormError, inputClass, textareaClass } from "@/components/admin/kit";
import { LANGUAGES } from "@/config/taxonomy";
import {
  MAX_SUBMISSION_SECONDS,
  SUBMISSION_TYPES,
  VOICE_CATEGORIES,
  voiceCategoryById,
  type SubmissionTypeId,
  type VoiceCategoryId,
} from "@/config/voices";
import { cn, formatDuration } from "@/lib/utils";

export interface SubmissionInitial {
  id: string;
  type: SubmissionTypeId;
  title: string;
  description: string;
  category: VoiceCategoryId;
  topic: string;
  language: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  displayName: string;
  anonymous: boolean;
  duration: number;
  reviewNote: string | null;
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      resolve(Number.isFinite(a.duration) ? Math.round(a.duration) : 0);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-4 rounded-2xl p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-sans text-base font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubmitVoiceForm({ defaultName, initial }: { defaultName: string; initial?: SubmissionInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [type, setType] = React.useState<SubmissionTypeId>(initial?.type ?? "PERSONAL_STORY");
  const [category, setCategory] = React.useState<VoiceCategoryId>(initial?.category ?? "UNKNOWN_TALKS");
  const cat = voiceCategoryById(category)!;
  const [topic, setTopic] = React.useState(initial?.topic ?? cat.topics[0]);
  const [anonymous, setAnonymous] = React.useState(initial?.anonymous ?? false);
  const [source, setSource] = React.useState<"record" | "upload">("record");
  const [audio, setAudio] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(initial?.duration ?? 0);
  const [recorded, setRecorded] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const chooseCategory = (id: VoiceCategoryId) => {
    setCategory(id);
    const next = voiceCategoryById(id)!;
    if (!next.topics.includes(topic)) setTopic(next.topics[0]);
    if (next.sensitive) setAnonymous(true);
  };
  const chooseType = (id: SubmissionTypeId) => {
    setType(id);
    if (!editing) chooseCategory(SUBMISSION_TYPES.find((t) => t.id === id)!.suggests);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!editing && !audio) return setError(source === "record" ? "Record your audio first." : "Choose an audio file.");
    if (duration > MAX_SUBMISSION_SECONDS) return setError(`Keep it under ${MAX_SUBMISSION_SECONDS / 60} minutes.`);
    const fd = new FormData(e.currentTarget);
    if (audio) fd.set("audio", audio);
    fd.set("duration", String(duration));
    fd.set("type", type);
    fd.set("category", category);
    fd.set("topic", topic);
    fd.set("anonymous", anonymous ? "true" : "false");
    fd.set("recorded", recorded ? "true" : "false");
    fd.set("acceptTerms", (e.currentTarget.elements.namedItem("acceptTerms") as HTMLInputElement).checked ? "true" : "false");
    fd.set("confirmOwnership", (e.currentTarget.elements.namedItem("confirmOwnership") as HTMLInputElement).checked ? "true" : "false");

    const xhr = new XMLHttpRequest();
    xhr.open(editing ? "PATCH" : "POST", editing ? `/api/voices/submissions/${initial!.id}` : "/api/voices/submissions");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let body: { ok?: boolean; message?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        router.push(editing ? "/submissions?resubmitted=1" : "/submissions?sent=1");
        router.refresh();
      } else setError(body.message ?? `Something went wrong (${xhr.status}).`);
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Network error. Please try again.");
    };
    setProgress(0);
    xhr.send(fd);
  };

  const uploading = progress !== null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {initial?.reviewNote && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Reviewer&apos;s note:</span> {initial.reviewNote}
        </p>
      )}

      <Step n={1} title="What are you sharing?">
        <div role="radiogroup" aria-label="Submission type" className="flex flex-wrap gap-2">
          {SUBMISSION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={type === t.id}
              onClick={() => chooseType(t.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                type === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/30",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} title={editing ? "Your audio (optional: replace it)" : "Your audio"}>
        <div role="tablist" aria-label="Audio source" className="inline-flex rounded-full bg-muted p-1">
          {(["record", "upload"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={source === s}
              onClick={() => {
                setSource(s);
                setAudio(null);
                setRecorded(false);
              }}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium", source === s ? "bg-card shadow-sm" : "text-muted-foreground")}
            >
              {s === "record" ? <Mic className="size-4" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              {s === "record" ? "Record now" : "Upload a file"}
            </button>
          ))}
        </div>
        {source === "record" ? (
          <AudioRecorder
            onChange={(file, secs) => {
              setAudio(file);
              setDuration(secs);
              setRecorded(Boolean(file));
            }}
          />
        ) : (
          <label className={cn(inputClass, "flex h-auto cursor-pointer items-center gap-2 py-3 text-muted-foreground")}>
            <Upload className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{audio ? `${audio.name}${duration ? ` · ${formatDuration(duration)}` : ""}` : "MP3, M4A, WAV, OGG or WEBM, up to 50 MB"}</span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0] ?? null;
                setAudio(f);
                setRecorded(false);
                if (f) setDuration(await readDuration(f));
              }}
            />
          </label>
        )}
        {editing && !audio && <p className="text-xs text-muted-foreground">Keeping your current audio ({formatDuration(initial!.duration)}).</p>}
      </Step>

      <Step n={3} title="Tell us about it">
        <Field label="Title *">
          <input name="title" required minLength={3} maxLength={160} defaultValue={initial?.title} className={inputClass} placeholder="Give your story a title" />
        </Field>
        <Field label="Description">
          <textarea name="description" maxLength={2000} defaultValue={initial?.description} className={textareaClass} placeholder="What's it about? Anything the listener should know?" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category *">
            <select value={category} onChange={(e) => chooseCategory(e.target.value as VoiceCategoryId)} className={inputClass}>
              {VOICE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Topic *">
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
              {cat.topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select name="language" defaultValue={initial?.language ?? ""} className={inputClass}>
              <option value="">Choose…</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Step>

      <Step n={4} title="How should we credit you?">
        <Field label="Display name" hint="Shown with your story. It doesn't have to be your real name.">
          <input name="displayName" maxLength={80} defaultValue={initial?.displayName ?? defaultName} disabled={anonymous} className={inputClass} />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 size-4 accent-[hsl(var(--primary))]" />
          <span>
            <span className="font-medium">Share anonymously</span>
            <span className="block text-xs text-muted-foreground">Listeners see &ldquo;Anonymous&rdquo;; your name and location are never shown.</span>
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="State (optional)">
            <input name="state" maxLength={80} defaultValue={initial?.state ?? ""} className={inputClass} />
          </Field>
          <Field label="District (optional)">
            <input name="district" maxLength={80} defaultValue={initial?.district ?? ""} className={inputClass} />
          </Field>
          <Field label="Village / town (optional)">
            <input name="village" maxLength={80} defaultValue={initial?.village ?? ""} className={inputClass} />
          </Field>
        </div>
      </Step>

      <Step n={5} title="Consent">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 size-4 accent-[hsl(var(--primary))]" />
          <span>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
              content terms
            </Link>{" "}
            and agree that Lumen FM may review, edit for length, and publish this recording.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirmOwnership" required className="mt-0.5 size-4 accent-[hsl(var(--primary))]" />
          <span>This is my own content, or I have permission from everyone whose voice or work is in it.</span>
        </label>
      </Step>

      {uploading && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}
      <FormError error={error} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> Every submission is reviewed before it&apos;s published.
        </p>
        <Button type="submit" size="lg" loading={uploading}>
          {editing ? "Resubmit for review" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
