"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BadgeCheck, CalendarClock, Crown, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipPicker } from "@/components/account/chip-picker";
import { Field, FormError, inputClass } from "@/components/admin/kit";
import { PasswordStrength } from "@/components/auth/password-strength";
import { AUDIO_QUALITIES, GENRES, LANGUAGES } from "@/config/taxonomy";
import { cn } from "@/lib/utils";

export interface SettingsData {
  name: string;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  signInMethods: string[];
  favoriteGenres: string[];
  preferredLanguages: string[];
  audioQuality: "LOW" | "NORMAL" | "HIGH";
  plan: { name: string; state: "none" | "active" | "expired"; periodEnd: string | null; daysLeft: number | null; canPlayPremium: boolean };
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-5 rounded-2xl p-5 sm:p-6">
      <div>
        <h2 className="font-sans text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState<string | null>(null);
  const save = async (url: string, method: string, body: unknown, okText = "Saved.") => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || data.ok === false) {
        setError(data.message ?? "Couldn't save. Please try again.");
        return false;
      }
      setSaved(okText);
      router.refresh();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, saved, save };
}

const Saved = ({ text }: { text: string | null }) => (text ? <span className="text-sm text-emerald-700">{text}</span> : null);

function ProfilePanel({ data }: { data: SettingsData }) {
  const { update } = useSession();
  const [name, setName] = React.useState(data.name);
  const { busy, error, saved, save } = useSave();
  const [resend, setResend] = React.useState<"idle" | "sending" | "sent" | string>("idle");

  const resendLink = async () => {
    setResend("sending");
    const res = await fetch("/api/account/verify/resend", { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    setResend(res.ok && body.ok ? "sent" : body.message ?? "Couldn't send the email.");
  };

  return (
    <Panel title="Profile">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Email">
          <input value={data.email} readOnly className={cn(inputClass, "bg-muted/50 text-muted-foreground")} />
        </Field>
      </div>
      {data.emailVerified ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700">
          <BadgeCheck className="size-4" aria-hidden /> Email verified
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <MailWarning className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Your email isn&apos;t verified yet. Check your inbox for the link.</span>
          {resend === "sent" ? (
            <span className="font-medium">Sent! Check your inbox.</span>
          ) : (
            <Button size="sm" variant="outline" loading={resend === "sending"} onClick={resendLink}>
              Resend link
            </Button>
          )}
          {resend !== "idle" && resend !== "sending" && resend !== "sent" && <span className="w-full text-red-700">{resend}</span>}
        </div>
      )}
      <FormError error={error} />
      <div className="flex items-center justify-end gap-3">
        <Saved text={saved} />
        <Button
          loading={busy}
          disabled={name.trim() === data.name}
          onClick={async () => (await save("/api/me/profile", "PATCH", { name: name.trim() })) && update()}
        >
          Save profile
        </Button>
      </div>
    </Panel>
  );
}

function PreferencesPanel({ data }: { data: SettingsData }) {
  const [genres, setGenres] = React.useState(data.favoriteGenres);
  const [languages, setLanguages] = React.useState(data.preferredLanguages);
  const [quality, setQuality] = React.useState(data.audioQuality);
  const { busy, error, saved, save } = useSave();

  return (
    <Panel title="Listening preferences" description="Used to tailor recommendations.">
      <div className="space-y-2">
        <p className="text-sm font-medium">Favourite genres</p>
        <ChipPicker label="Favourite genres" options={GENRES} value={genres} onChange={setGenres} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Preferred languages</p>
        <ChipPicker label="Preferred languages" options={LANGUAGES} value={languages} onChange={setLanguages} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Audio quality</p>
        <div role="radiogroup" aria-label="Audio quality" className="grid gap-2 sm:grid-cols-3">
          {AUDIO_QUALITIES.map((q) => {
            const locked = q.id === "HIGH" && !data.plan.canPlayPremium;
            return (
              <button
                key={q.id}
                type="button"
                role="radio"
                aria-checked={quality === q.id}
                disabled={locked}
                onClick={() => setQuality(q.id)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  quality === q.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                )}
              >
                <span className="flex items-center gap-1 font-medium">
                  {q.label} {q.id === "HIGH" && <Crown className="size-3.5 text-amber-600" aria-hidden />}
                </span>
                <span className="text-xs text-muted-foreground">{q.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
      <FormError error={error} />
      <div className="flex items-center justify-end gap-3">
        <Saved text={saved} />
        <Button loading={busy} onClick={() => save("/api/me/profile", "PATCH", { favoriteGenres: genres, preferredLanguages: languages, audioQuality: quality })}>
          Save preferences
        </Button>
      </div>
    </Panel>
  );
}

function SubscriptionPanel({ data }: { data: SettingsData }) {
  const p = data.plan;
  return (
    <Panel title="Subscription">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          {p.state === "active" ? <Crown className="size-6" aria-hidden /> : <CalendarClock className="size-6" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{p.state === "none" ? "Free plan" : `${p.name} plan`}</p>
          <p className="text-sm text-muted-foreground">
            {p.state === "active" && (p.periodEnd ? `Active until ${fmt(p.periodEnd)} (${p.daysLeft} days left)` : "Active")}
            {p.state === "expired" && `Ended on ${fmt(p.periodEnd)}. Premium content plays as previews.`}
            {p.state === "none" && "Free songs, albums and podcasts in full; Premium items as previews."}
          </p>
        </div>
        <Button asChild variant={p.state === "active" ? "outline" : "gradient"}>
          <Link href="/#pricing">{p.state === "active" ? "View plans" : p.state === "expired" ? "Renew" : "Upgrade"}</Link>
        </Button>
      </div>
    </Panel>
  );
}

function SecurityPanel({ data }: { data: SettingsData }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const { busy, error, saved, save } = useSave();
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    const ok = await save("/api/me/password", "POST", { currentPassword: current || undefined, newPassword: next }, "Password updated.");
    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <Panel title="Security" description={`Signed in with: ${data.signInMethods.join(", ") || "email"}. One device can use your account at a time.`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {data.hasPassword && (
            <Field label="Current password">
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={inputClass} />
            </Field>
          )}
          <Field label={data.hasPassword ? "New password" : "Set a password"}>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required className={inputClass} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className={inputClass} />
          </Field>
        </div>
        {next && <PasswordStrength password={next} />}
        {mismatch && <p className="text-sm text-red-600">Passwords don&apos;t match.</p>}
        <FormError error={error} />
        <div className="flex items-center justify-end gap-3">
          <Saved text={saved} />
          <Button type="submit" loading={busy} disabled={!next || mismatch}>
            {data.hasPassword ? "Change password" : "Set password"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function SettingsPanels({ data }: { data: SettingsData }) {
  return (
    <div className="space-y-6">
      <ProfilePanel data={data} />
      <SubscriptionPanel data={data} />
      <PreferencesPanel data={data} />
      <SecurityPanel data={data} />
    </div>
  );
}
