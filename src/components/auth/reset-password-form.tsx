"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { passwordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [expired, setExpired] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  if (!token || expired) {
    return (
      <AuthCard>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Link expired</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {token ? "This reset link has expired or was already used." : "This reset link is missing or incomplete."}{" "}
            Request a fresh one and use it within an hour.
          </p>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <div className="text-center" role="status">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-emerald-300" aria-hidden />
          <h2 className="text-2xl font-semibold">Password updated</h2>
          <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
          <Button size="lg" className="mt-6 w-full" onClick={() => router.push("/login")}>
            Sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) next.password = parsed.error.issues[0]?.message;
    if (!confirm) next.confirm = "Confirm your new password";
    else if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (res.ok) setDone(true);
      else if (body.code === "TOKEN_EXPIRED") setExpired(true);
      else setFormError(body.message ?? "Couldn't update your password. Please try again.");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold">Choose a new password</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Make it strong. You won&apos;t need the old one again.</p>
      </div>
      <form noValidate onSubmit={onSubmit} className="space-y-4" aria-label="Set a new password">
        <div>
          <FloatingInput
            id="reset-password"
            label="New password"
            autoComplete="new-password"
            revealable
            icon={<Lock />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: undefined }));
            }}
            error={errors.password}
            aria-describedby="reset-strength"
            required
          />
          <PasswordStrength password={password} id="reset-strength" />
        </div>
        <FloatingInput
          id="reset-confirm"
          label="Confirm new password"
          autoComplete="new-password"
          revealable
          icon={<Lock />}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((x) => ({ ...x, confirm: undefined }));
          }}
          error={errors.confirm}
          required
        />
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
