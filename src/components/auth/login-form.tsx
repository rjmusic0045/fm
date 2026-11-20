"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingInput } from "@/components/ui/floating-input";
import { AuthCard, FormAlert, OrDivider } from "@/components/auth/auth-card";
import { FacebookButton } from "@/components/auth/facebook-button";
import { signInWithCredentials, signInWithFacebook } from "@/lib/auth-client";
import { fieldErrors, loginSchema } from "@/lib/validations/auth";

type Field = "email" | "password";

interface LoginFormProps {
  callbackUrl?: string;
  initialError?: string;
  facebookEnabled: boolean;
}

export function LoginForm({ callbackUrl, initialError, facebookEnabled }: LoginFormProps) {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [values, setValues] = React.useState({ email: "", password: "", remember: true });
  const [touched, setTouched] = React.useState<Partial<Record<Field, boolean>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(initialError ?? null);
  const [noAccountEmail, setNoAccountEmail] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [fbLoading, setFbLoading] = React.useState(false);

  const validate = React.useCallback((v: typeof values) => {
    const parsed = loginSchema.safeParse(v);
    return parsed.success ? {} : fieldErrors<Field>(parsed.error);
  }, []);

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    setFormError(null);
    setNoAccountEmail(null);
    if (touched[field]) setErrors(validate(next));
  };

  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(`login-${first}`)?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setNoAccountEmail(null);
    try {
      const res = await signInWithCredentials({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        remember: values.remember,
        callbackUrl,
      });
      if (res.ok) {
        await refreshSession();
        // Middleware routes brand-new accounts to onboarding.
        router.replace(res.redirectTo);
        router.refresh();
        return;
      }
      if (res.code === "NO_ACCOUNT") setNoAccountEmail(values.email.trim().toLowerCase());
      else setFormError(res.message);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onFacebook = async () => {
    setFbLoading(true);
    setFormError(null);
    const res = await signInWithFacebook(facebookEnabled, callbackUrl);
    if (!res.ok) {
      setFormError(res.message);
      setFbLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold">Welcome back</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in to pick up right where the music left off.</p>
      </div>

      <FacebookButton onClick={onFacebook} loading={fbLoading} disabled={submitting} />

      <OrDivider />

      <form noValidate onSubmit={onSubmit} className="space-y-4" aria-label="Sign in with email">
        <FloatingInput
          id="login-email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          icon={<Mail />}
          value={values.email}
          onChange={update("email")}
          onBlur={blur("email")}
          error={touched.email ? errors.email : undefined}
          required
        />
        <FloatingInput
          id="login-password"
          name="password"
          label="Password"
          autoComplete="current-password"
          revealable
          icon={<Lock />}
          value={values.password}
          onChange={update("password")}
          onBlur={blur("password")}
          error={touched.password ? errors.password : undefined}
          required
        />

        <div className="flex items-center justify-between gap-4 pt-1">
          <Checkbox
            label="Remember me"
            name="remember"
            checked={values.remember}
            onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
          />
          <Link
            href="/forgot-password"
            className="rounded text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <AnimatePresence mode="popLayout">
          {noAccountEmail && (
            <motion.div
              key="no-account"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <FormAlert tone="info">
                <p className="font-medium">No account found for this email. Create one?</p>
                <p className="mt-0.5 break-all text-amber-100/80">{noAccountEmail}</p>
                <Button asChild variant="glass" size="sm" className="mt-3">
                  <Link href={`/signup?email=${encodeURIComponent(noAccountEmail)}`}>
                    <UserPlus />
                    Create account with this email
                  </Link>
                </Button>
              </FormAlert>
            </motion.div>
          )}
          {formError && (
            <motion.div key="form-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <FormAlert>{formError}</FormAlert>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" size="lg" className="w-full text-[15px]" loading={submitting} disabled={fbLoading}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
