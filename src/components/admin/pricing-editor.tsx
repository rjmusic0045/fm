"use client";

import * as React from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass, useAdminAction } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

export interface PlanInput {
  plan: "FREE" | "PREMIUM" | "FAMILY";
  name: string;
  tagline: string;
  priceInr: number;
  priceUsd: number;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export function PricingEditor({ initial }: { initial: PlanInput[] }) {
  const [plans, setPlans] = React.useState(initial);
  const { run, busy, error } = useAdminAction();
  const [saved, setSaved] = React.useState(false);

  const update = (i: number, patch: Partial<PlanInput>) => {
    setSaved(false);
    setPlans((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : patch.highlighted ? { ...p, highlighted: false } : p)));
  };

  const save = () =>
    void run(
      () =>
        fetch("/api/admin/pricing", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plans: plans.map((p) => ({ ...p, features: p.features.map((f) => f.trim()).filter(Boolean) })) }),
        }),
      () => setSaved(true),
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p, i) => {
          const free = p.plan === "FREE";
          return (
            <div key={p.plan} className={cn("glass space-y-3 rounded-2xl p-5", p.highlighted && "border-primary/50 ring-1 ring-primary/30")}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.plan}</span>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="radio" name="highlighted" checked={p.highlighted} onChange={() => update(i, { highlighted: true })} className="accent-[hsl(var(--primary))]" />
                  Highlight
                </label>
              </div>
              <Field label="Name">
                <input value={p.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={40} className={inputClass} />
              </Field>
              <Field label="Tagline">
                <input value={p.tagline} onChange={(e) => update(i, { tagline: e.target.value })} maxLength={120} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="₹ / month">
                  <input type="number" min={0} step="1" disabled={free} value={p.priceInr} onChange={(e) => update(i, { priceInr: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="$ / month">
                  <input type="number" min={0} step="0.01" disabled={free} value={p.priceUsd} onChange={(e) => update(i, { priceUsd: Number(e.target.value) })} className={inputClass} />
                </Field>
              </div>
              <div className="space-y-1.5 text-sm">
                <span className="font-medium">Features</span>
                {p.features.map((f, k) => (
                  <div key={k} className="flex gap-1">
                    <input
                      value={f}
                      maxLength={120}
                      aria-label={`${p.name} feature ${k + 1}`}
                      onChange={(e) => update(i, { features: p.features.map((x, m) => (m === k ? e.target.value : x)) })}
                      className={inputClass}
                    />
                    <button type="button" onClick={() => update(i, { features: p.features.filter((_, m) => m !== k) })} aria-label="Remove feature" className="grid w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                {p.features.length < 12 && (
                  <button type="button" onClick={() => update(i, { features: [...p.features, ""] })} className="inline-flex items-center gap-1 text-sm text-primary">
                    <Plus className="size-3.5" /> Add feature
                  </button>
                )}
              </div>
              <Field label="Button text">
                <input value={p.cta} onChange={(e) => update(i, { cta: e.target.value })} maxLength={40} className={inputClass} />
              </Field>
            </div>
          );
        })}
      </div>
      <FormError error={error} />
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-700">Saved. The Pricing section updates within a minute.</span>}
        <Button onClick={save} loading={busy}>
          {!busy && <Save />} Save prices
        </Button>
      </div>
    </div>
  );
}
