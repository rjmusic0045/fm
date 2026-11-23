"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipPicker } from "@/components/account/chip-picker";
import { FormError } from "@/components/admin/kit";
import { GENRES, LANGUAGES } from "@/config/taxonomy";
import { cn } from "@/lib/utils";

export function OnboardingFlow({ name, initialGenres, initialLanguages }: { name: string | null; initialGenres: string[]; initialLanguages: string[] }) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = React.useState<0 | 1>(0);
  const [genres, setGenres] = React.useState(initialGenres);
  const [languages, setLanguages] = React.useState(initialLanguages);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favoriteGenres: genres, preferredLanguages: languages, completeOnboarding: true }),
      });
      if (!res.ok) throw new Error();
      await update(); // refreshes `onboarded` in the session so middleware stops redirecting here
      router.replace("/music");
      router.refresh();
    } catch {
      setError("Couldn't save your choices. Please try again.");
      setSaving(false);
    }
  };

  const steps = [
    { title: "What do you like to listen to?", hint: "Pick a few genres. You can change these later in Settings." },
    { title: "Which languages?", hint: "We'll favour music and podcasts in these languages." },
  ];

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8 flex gap-2" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of 2{name ? ` · Welcome, ${name.split(" ")[0]}!` : ""}
      </p>
      <h1 className="mt-1 text-3xl font-semibold">{steps[step].title}</h1>
      <p className="mt-2 text-muted-foreground">{steps[step].hint}</p>

      <div className="mt-8">
        {step === 0 ? (
          <ChipPicker label="Favourite genres" options={GENRES} value={genres} onChange={setGenres} />
        ) : (
          <ChipPicker label="Preferred languages" options={LANGUAGES} value={languages} onChange={setLanguages} />
        )}
      </div>

      <div className="mt-6">
        <FormError error={error} />
      </div>
      <div className="mt-8 flex items-center justify-between gap-3">
        {step === 1 ? (
          <Button variant="ghost" onClick={() => setStep(0)} disabled={saving}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={finish} disabled={saving}>
            Skip for now
          </Button>
        )}
        {step === 0 ? (
          <Button onClick={() => setStep(1)}>
            Next <ArrowRight />
          </Button>
        ) : (
          <Button onClick={finish} loading={saving}>
            Finish and start listening
          </Button>
        )}
      </div>
    </div>
  );
}
