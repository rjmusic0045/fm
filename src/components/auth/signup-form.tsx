"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingInput } from "@/components/ui/floating-input";
import { AuthCard, FormAlert } from "@/components/auth/auth-card";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signInWithCredentials } from "@/lib/auth-client";
import { fieldErrors, signupSchema } from "@/lib/validations/auth";

type Field = "name" | "email" | "password" | "confirmPassword" | "acceptTerms";

export function SignupForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [values, setValues] = React.useState({ name: "", email: initialEmail, password: "", confirmPassword: "", acceptTerms: false });
  const [touched, setTouched] = React.useState<Partial<Record<Field, boolean>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [emailTaken, setEmailTaken] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const validate = React.useCallback((v: typeof values) => {
    const parsed = signupSchema.safeParse(v);
    return parsed.success ? {} : fieldErrors<Field>(parsed.error);
  }, []);

  const set = <K extends keyof typeof values>(field: K, value: (typeof values)[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError(null);
    setEmailTaken(false);
    if (Object.keys(touched).length) setErrors(validate(next));
  };
  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true, acceptTerms: true });
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`signup-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const email = values.email.trim().toLowerCase();
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; message?: string; errors?: Partial<Record<Field, string>> };
      if (!res.ok || !data.ok) {
        if (data.code === "EMAIL_TAKEN") setEmailTaken(true);
        else if (data.errors) setErrors(data.errors);
        setFormError(data.message ?? "Couldn't create your account. Please try again.");
        return;
      }
      // Account created: sign straight in, then onboarding picks up from there.
      const login = await signInWithCredentials({ email, password: values.password, remember: true, callbackUrl: "/onboarding" });
      if (!login.ok) {
        router.replace("/login");
        return;
      }
      await refreshSession();
      router.replace("/onboarding");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold">Create your account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Free forever. Upgrade to Premium any time.</p>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4" aria-label="Create an account">
        <FloatingInput
          id="signup-name"
          name="name"
          label="Full name"
          autoComplete="name"
          icon={<UserRound />}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={blur("name")}
          error={touched.name ? errors.name : undefined}
          required
        />
        <FloatingInput
          id="signup-email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          inputMode="email"
          icon={<Mail />}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={blur("email")}
          error={touched.email ? errors.email : undefined}
          required
        />
        <div>
          <FloatingInput
            id="signup-password"
            name="password"
            label="Password"
            autoComplete="new-password"
            revealable
            icon={<Lock />}
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            onBlur={blur("password")}
            error={touched.password ? errors.password : undefined}
            required
          />
          {values.password && <PasswordStrength password={values.password} id="signup-strength" />}
        </div>
        <FloatingInput
          id="signup-confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          revealable
          icon={<Lock />}
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          onBlur={blur("confirmPassword")}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          required
        />
        <div>
          <Checkbox
            id="signup-acceptTerms"
            name="acceptTerms"
            checked={values.acceptTerms}
            onChange={(e) => set("acceptTerms", e.target.checked)}
            error={touched.acceptTerms ? errors.acceptTerms : undefined}
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </>
            }
          />
        </div>

        <AnimatePresence mode="popLayout">
          {formError && (
            <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <FormAlert tone={emailTaken ? "info" : "error"}>
                <p>{formError}</p>
                {emailTaken && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="glass">
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/forgot-password">Reset password</Link>
                    </Button>
                  </div>
                )}
              </FormAlert>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" size="lg" className="w-full text-[15px]" loading={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
