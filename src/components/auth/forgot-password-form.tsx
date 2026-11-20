"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { emailSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState<string | undefined>();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      document.getElementById("forgot-email")?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setFormError(body.message ?? "Couldn't send the reset email. Please try again.");
        return;
      }
      setSentTo(parsed.data);
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30">
            <MailCheck className="size-7 text-emerald-300" aria-hidden />
          </div>
          <h2 className="text-2xl font-semibold">Check your inbox</h2>
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            If an account exists for <span className="break-all text-foreground">{sentTo}</span>, you&apos;ll get a link
            to reset your password. It expires in 1 hour.
          </p>
          <div className="mt-6 grid gap-2">
            <Button asChild size="lg">
              <Link href="/login">Back to sign in</Link>
            </Button>
            <Button variant="ghost" onClick={() => setSentTo(null)}>
              Use a different email
            </Button>
          </div>
        </motion.div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold">Forgot password?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>
      <form noValidate onSubmit={onSubmit} className="space-y-4" aria-label="Request a password reset">
        <FloatingInput
          id="forgot-email"
          type="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          icon={<Mail />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(undefined);
          }}
          error={error}
          required
        />
        {formError && <FormAlert>{formError}</FormAlert>}
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
