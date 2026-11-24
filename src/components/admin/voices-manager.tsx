"use client";

import * as React from "react";
import { EyeOff, Headphones, MapPin, Music2, Pencil, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/player/cover-art";
import {
  AccessBadge,
  AccessSelect,
  DeleteButton,
  EditorDialog,
  Field,
  FormError,
  ImagePicker,
  LanguageSelect,
  PublishControl,
  StatusBadge,
  initialPublishMode,
  inputClass,
  textareaClass,
  useAdminAction,
} from "@/components/admin/kit";
import { VOICE_CATEGORIES, voiceCategoryById, type VoiceCategoryId } from "@/config/voices";
import { cn, formatDuration } from "@/lib/utils";

export interface VoiceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: VoiceCategoryId;
  topic: string;
  language: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  speakerName: string;
  anonymous: boolean;
  duration: number;
  coverUrl: string | null;
  palette: [string, string];
  access: "FREE" | "PREMIUM";
  isActive: boolean;
  publishAt: string | null;
  featured: boolean;
  plays: number;
  fromSubmission: boolean;
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

function VoiceForm({ story, onClose }: { story?: VoiceRow; onClose: () => void }) {
  const { run, busy, error, setError } = useAdminAction();
  const [category, setCategory] = React.useState<VoiceCategoryId>(story?.category ?? "RANDOM_TALKS");
  const cat = voiceCategoryById(category)!;
  const [topic, setTopic] = React.useState(story?.topic ?? cat.topics[0]);
  const [anonymous, setAnonymous] = React.useState(story?.anonymous ?? false);
  const [audio, setAudio] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(story?.duration ?? 0);

  const changeCategory = (id: VoiceCategoryId) => {
    setCategory(id);
    const next = voiceCategoryById(id)!;
    if (!next.topics.includes(topic)) setTopic(next.topics[0]);
    // Sensitive categories suggest anonymous publishing (admin can still untick).
    if (!story && next.sensitive) setAnonymous(true);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!story && !audio) return setError("Choose an audio file.");
    const fd = new FormData(e.currentTarget);
    if (audio) fd.set("audio", audio);
    else fd.delete("audio");
    fd.set("duration", String(duration));
    fd.set("category", category);
    fd.set("topic", topic);
    fd.set("anonymous", anonymous ? "true" : "false");
    fd.set("featured", (e.currentTarget.elements.namedItem("featured") as HTMLInputElement).checked ? "true" : "false");
    void run(() => fetch(story ? `/api/admin/voices/${story.id}` : "/api/admin/voices", { method: story ? "PATCH" : "POST", body: fd }), onClose);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <ImagePicker name="cover" removeName="removeCover" currentUrl={story?.coverUrl} label="Cover (optional)" />
        <div className="space-y-4">
          <label className={cn(inputClass, "flex h-auto cursor-pointer items-center gap-2 py-2.5 text-muted-foreground")}>
            <Music2 className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {audio
                ? `${audio.name}${duration ? ` · ${formatDuration(duration)}` : ""}`
                : story
                  ? `Current audio${story.duration ? ` · ${formatDuration(story.duration)}` : ""} (choose a file to replace)`
                  : "Choose audio file *"}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0] ?? null;
                setAudio(f);
                if (f) setDuration(await readDuration(f));
              }}
            />
          </label>
          <Field label="Title *">
            <input name="title" required maxLength={160} defaultValue={story?.title} className={inputClass} placeholder="A story worth hearing" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category *">
              <select value={category} onChange={(e) => changeCategory(e.target.value as VoiceCategoryId)} className={inputClass}>
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
          </div>
        </div>
      </div>

      <Field label="Description">
        <textarea name="description" maxLength={4000} defaultValue={story?.description} className={textareaClass} placeholder="What is this story about?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Speaker / storyteller">
          <input name="speakerName" maxLength={120} defaultValue={story?.speakerName} className={inputClass} placeholder="Name shown to listeners" />
        </Field>
        <LanguageSelect defaultValue={story?.language} />
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 size-4 accent-[hsl(var(--primary))]" />
        <span>
          <span className="font-medium">Publish anonymously</span>
          <span className="block text-xs text-muted-foreground">
            Listeners see &ldquo;Anonymous&rdquo; and no location. {cat.sensitive ? "Recommended for personal stories in this category." : ""}
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="State">
          <input name="state" maxLength={80} defaultValue={story?.state ?? ""} className={inputClass} placeholder="Tamil Nadu" />
        </Field>
        <Field label="District">
          <input name="district" maxLength={80} defaultValue={story?.district ?? ""} className={inputClass} placeholder="Madurai" />
        </Field>
        <Field label="Village / town">
          <input name="village" maxLength={80} defaultValue={story?.village ?? ""} className={inputClass} placeholder="Melur" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AccessSelect defaultValue={story?.access} />
        <PublishControl defaultMode={story ? initialPublishMode(story.isActive, story.publishAt) : "now"} defaultAt={story?.publishAt} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={story?.featured} className="size-4 accent-[hsl(var(--primary))]" />
        <Star className="size-4 text-amber-500" aria-hidden /> Feature on the People &amp; Voices page
      </label>

      <FormError error={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {story ? "Save story" : "Publish story"}
        </Button>
      </div>
    </form>
  );
}

function StoryRow({ story, onEdit }: { story: VoiceRow; onEdit: () => void }) {
  const { run, busy } = useAdminAction();
  const cat = voiceCategoryById(story.category)!;
  const place = [story.village, story.district, story.state].filter(Boolean).join(", ");
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <CoverArt title={story.title} palette={story.palette} image={story.coverUrl ?? undefined} showLabel={false} className="size-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium">
          {story.featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
          <span className="truncate">{story.title}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {cat.name} · {story.topic} · {story.anonymous ? "Anonymous" : story.speakerName || "No speaker"}
          {story.language ? ` · ${story.language}` : ""}
        </p>
        {place && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden /> {place}
            {story.anonymous && <span className="inline-flex items-center gap-0.5 text-amber-600"><EyeOff className="size-3" aria-hidden /> hidden publicly</span>}
          </p>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <AccessBadge access={story.access} />
        <StatusBadge isActive={story.isActive} publishAt={story.publishAt} />
      </div>
      <span className="hidden w-14 shrink-0 items-center justify-end gap-1 text-xs tabular-nums text-muted-foreground md:inline-flex">
        <Headphones className="size-3.5" aria-hidden /> {story.plays}
      </span>
      <div className="flex shrink-0 gap-1">
        <button type="button" onClick={onEdit} aria-label={`Edit ${story.title}`} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Pencil className="size-4" />
        </button>
        <DeleteButton label={`“${story.title}”`} disabled={busy} onConfirm={() => void run(() => fetch(`/api/admin/voices/${story.id}`, { method: "DELETE" }))} />
      </div>
    </li>
  );
}

export function VoicesManager({ stories }: { stories: VoiceRow[] }) {
  const [editing, setEditing] = React.useState<VoiceRow | "new" | null>(null);
  const [filter, setFilter] = React.useState<VoiceCategoryId | "ALL">("ALL");
  const [q, setQ] = React.useState("");
  const shown = stories.filter(
    (s) =>
      (filter === "ALL" || s.category === filter) &&
      (!q || `${s.title} ${s.topic} ${s.speakerName} ${s.state ?? ""} ${s.district ?? ""} ${s.village ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setEditing("new")}>
          <Plus /> New story
        </Button>
        <select value={filter} onChange={(e) => setFilter(e.target.value as VoiceCategoryId | "ALL")} aria-label="Filter by category" className={cn(inputClass, "w-auto")}>
          <option value="ALL">All categories ({stories.length})</option>
          {VOICE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({stories.filter((s) => s.category === c.id).length})
            </option>
          ))}
        </select>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, topic, speaker, place…" aria-label="Search stories" className={cn(inputClass, "max-w-xs")} />
      </div>

      {shown.length ? (
        <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
          {shown.map((s) => (
            <StoryRow key={s.id} story={s} onEdit={() => setEditing(s)} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {stories.length ? "No stories match." : "No stories yet. Publish the first People & Voices story."}
        </p>
      )}

      <EditorDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "New story" : `Edit “${editing?.title ?? ""}”`}>
        {editing && <VoiceForm key={editing === "new" ? "new" : editing.id} story={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      </EditorDialog>
    </div>
  );
}
