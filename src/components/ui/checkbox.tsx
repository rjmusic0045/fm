"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  error?: string;
}

/** Native checkbox (keyboard + form friendly) with a custom animated box. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <div className={className}>
        <label htmlFor={inputId} className="group inline-flex cursor-pointer select-none items-start gap-2.5 text-sm">
          <span className="relative mt-0.5 grid size-[18px] shrink-0 place-items-center">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              aria-invalid={error ? true : undefined}
              className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-md border border-foreground/20 bg-foreground/[0.04] transition-all checked:border-transparent checked:bg-neon-gradient group-hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[invalid]:border-destructive"
              {...props}
            />
            <Check
              className="pointer-events-none relative size-3 scale-50 text-white opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
              strokeWidth={3.5}
              aria-hidden
            />
          </span>
          <span className="text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
        </label>
        {error && (
          <p role="alert" className="mt-1 pl-7 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
