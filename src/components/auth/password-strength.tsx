"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Symbol (bonus)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

const levels = [
  { label: "Too weak", color: "bg-red-500", text: "text-red-300" },
  { label: "Weak", color: "bg-orange-500", text: "text-orange-300" },
  { label: "Fair", color: "bg-amber-400", text: "text-amber-700" },
  { label: "Good", color: "bg-lime-400", text: "text-lime-200" },
  { label: "Strong", color: "bg-emerald-400", text: "text-emerald-200" },
];

export function passwordScore(p: string): number {
  if (!p) return 0;
  let score = passwordRules.filter((r) => r.test(p)).length;
  if (p.length >= 12) score += 1;
  return Math.min(4, Math.max(0, score - 1));
}

/** Live strength meter with a rule checklist. */
export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  const score = passwordScore(password);
  const level = levels[score];
  return (
    <div id={id} className="space-y-2 pt-1" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-colors duration-300",
                password && i < Math.max(1, score) ? level.color : "bg-foreground/10",
              )}
            />
          ))}
        </div>
        <span className={cn("w-16 text-right text-xs font-medium", password ? level.text : "text-muted-foreground")}>
          {password ? level.label : "Strength"}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {passwordRules.map((r) => {
          const ok = r.test(password);
          return (
            <li key={r.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-emerald-300" : "text-muted-foreground")}>
              {ok ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
              <span>
                {r.label}
                <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
