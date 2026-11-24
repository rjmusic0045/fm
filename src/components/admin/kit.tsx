"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, ImagePlus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/config/taxonomy";

// Small shared building blocks for the admin screens.

export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15";
export const textareaClass = cn(inputClass, "h-auto min-h-[84px] py-2");

export function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export type AccessValue = "FREE" | "PREMIUM";

export function AccessBadge({ access }: { access: AccessValue }) {
  return access === "PREMIUM" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      <Crown className="size-3" aria-hidden /> Premium
    </span>
  ) : (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">Free</span>
  );
}

// Free / Premium segmented control backed by a hidden input named `access`.
export function AccessSelect({ defaultValue = "FREE", name = "access" }: { defaultValue?: AccessValue; name?: string }) {
  const [value, setValue] = React.useState<AccessValue>(defaultValue);
  return (
    <div className="space-y-1.5 text-sm">
      <span className="font-medium">Who can listen</span>
      <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
        {(["FREE", "PREMIUM"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => setValue(v)}
            className={cn(
              "flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition-colors",
              value === v ? (v === "PREMIUM" ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground") : "text-muted-foreground hover:bg-muted",
            )}
          >
            {v === "PREMIUM" && <Crown className="size-3.5" aria-hidden />}
            {v === "FREE" ? "Everyone (Free)" : "Premium only"}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
      <span className="block text-xs text-muted-foreground">
        {value === "PREMIUM" ? "Listeners without an active plan hear a 30-second preview." : "Anyone can play it in full."}
      </span>
    </div>
  );
}

// Square image picker with preview; posts as `name`. Sets `${removeName}=true` when cleared.
export function ImagePicker({
  name,
  removeName,
  currentUrl,
  label = "Image",
  round = false,
}: {
  name: string;
  removeName?: string;
  currentUrl?: string | null;
  label?: string;
  round?: boolean;
}) {
  const [preview, setPreview] = React.useState<string | null>(currentUrl ?? null);
  const [removed, setRemoved] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <label
        className={cn(
          "group relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
          round ? "rounded-full" : "rounded-xl",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs">
            <ImagePlus className="size-6" aria-hidden /> Choose image
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : currentUrl ?? null);
            setRemoved(false);
          }}
        />
        {preview && (
          <button
            type="button"
            aria-label="Remove image"
            onClick={(e) => {
              e.preventDefault();
              if (inputRef.current) inputRef.current.value = "";
              setPreview(null);
              setRemoved(true);
            }}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      {removeName && <input type="hidden" name={removeName} value={removed ? "true" : "false"} />}
    </div>
  );
}

// Sends a request, shows errors, refreshes server data on success.
// `send` returns the fetch promise; the hook handles JSON errors.
export function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (send: () => Promise<Response>, onDone?: () => void) => {
      setBusy(true);
      setError(null);
      try {
        const res = await send();
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        if (!res.ok || data.ok === false) {
          setError(data.message ?? `Request failed (${res.status}).`);
          return false;
        }
        onDone?.();
        router.refresh();
        return true;
      } catch {
        setError("Network error. Please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );
  return { run, busy, error, setError };
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error}
    </p>
  );
}

// Wide modal used for create/edit forms.
export function EditorDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto bg-background">
        <DialogTitle className="mb-4 text-xl">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteButton({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => confirm(`Delete ${label}? This can't be undone.`) && onConfirm()}
      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      aria-label={`Delete ${label}`}
      title="Delete"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ------------------------------------------------------------------
// Phase C: language, release scheduling
// ------------------------------------------------------------------

export function LanguageSelect({ defaultValue, name = "language" }: { defaultValue?: string | null; name?: string }) {
  return (
    <Field label="Language">
      <select name={name} defaultValue={defaultValue ?? ""} className={inputClass}>
        <option value="">Not set</option>
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

// "2026-11-23T10:00:00Z" -> "2026-11-23T15:30" in the admin's local time (datetime-local value).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export type PublishMode = "now" | "draft" | "schedule";

export function initialPublishMode(isActive: boolean, publishAt?: string | null): PublishMode {
  if (!isActive) return "draft";
  return publishAt && new Date(publishAt).getTime() > Date.now() ? "schedule" : "now";
}

// Publish now / Save as draft / Schedule. Posts hidden fields
// `publishMode` and `publishAt` (ISO, UTC) for the admin APIs.
export function PublishControl({ defaultMode = "now", defaultAt }: { defaultMode?: PublishMode; defaultAt?: string | null }) {
  const [mode, setMode] = React.useState<PublishMode>(defaultMode);
  const [local, setLocal] = React.useState(toLocalInput(defaultAt));
  const iso = local ? new Date(local).toISOString() : "";
  const options: { id: PublishMode; label: string }[] = [
    { id: "now", label: "Publish now" },
    { id: "draft", label: "Save as draft" },
    { id: "schedule", label: "Schedule" },
  ];
  return (
    <div className="space-y-1.5 text-sm">
      <span className="font-medium">Release</span>
      <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-lg border border-input p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={mode === o.id}
            onClick={() => setMode(o.id)}
            className={cn(
              "h-8 rounded-md text-sm transition-colors",
              mode === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {mode === "schedule" && (
        <input
          type="datetime-local"
          value={local}
          min={toLocalInput(new Date(Date.now() + 60_000).toISOString())}
          onChange={(e) => setLocal(e.target.value)}
          required
          aria-label="Release date and time"
          className={inputClass}
        />
      )}
      <span className="block text-xs text-muted-foreground">
        {mode === "now" && "Visible to listeners immediately."}
        {mode === "draft" && "Hidden from listeners until you publish it."}
        {mode === "schedule" && (local ? `Goes live automatically on ${new Date(local).toLocaleString("en-IN")}.` : "Pick when it goes live.")}
      </span>
      <input type="hidden" name="publishMode" value={mode} />
      <input type="hidden" name="publishAt" value={mode === "schedule" ? iso : ""} />
    </div>
  );
}

export function StatusBadge({ isActive, publishAt }: { isActive: boolean; publishAt?: string | null }) {
  const scheduled = isActive && publishAt && new Date(publishAt).getTime() > Date.now();
  if (!isActive) return <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Draft</span>;
  if (scheduled)
    return (
      <span className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200" title={new Date(publishAt!).toLocaleString("en-IN")}>
        Scheduled · {new Date(publishAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </span>
    );
  return <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>;
}
