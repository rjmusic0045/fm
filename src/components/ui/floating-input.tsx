"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  /** Adds a show/hide toggle for password fields. */
  revealable?: boolean;
  hint?: React.ReactNode;
}

/**
 * Input with a floating label (pure CSS via :placeholder-shown), inline error
 * and optional password reveal toggle. Fully labelled for screen readers.
 */
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, icon, revealable, hint, className, id, type = "text", ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const [revealed, setRevealed] = React.useState(false);
    const effectiveType = revealable ? (revealed ? "text" : "password") : type;

    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="group relative">
          {icon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary [&_svg]:size-4">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={cn(error && errorId, hint && hintId) || undefined}
            className={cn(
              "peer h-14 w-full rounded-xl border bg-foreground/[0.04] px-4 pb-2 pt-6 text-[15px] text-foreground outline-none transition-all duration-200",
              "border-foreground/10 hover:border-foreground/20 focus:border-neon-pink/60 focus:bg-foreground/[0.06] focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]",
              "autofill:shadow-[inset_0_0_0_1000px_hsl(var(--background))] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]",
              icon && "pl-11",
              revealable && "pr-12",
              error && "border-destructive/70 focus:border-destructive focus:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]",
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute top-1/2 origin-left -translate-y-[130%] text-xs font-medium text-muted-foreground transition-all duration-200",
              "peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal",
              "peer-focus:-translate-y-[130%] peer-focus:text-xs peer-focus:font-medium peer-focus:text-primary",
              icon ? "left-11" : "left-4",
              error && "text-red-300 peer-focus:text-red-300",
            )}
          >
            {label}
          </label>
          {revealable && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              aria-controls={inputId}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              id={errorId}
              role="alert"
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 pl-1 text-xs text-red-300"
            >
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {hint && !error && (
          <div id={hintId} className="pl-1 text-xs text-muted-foreground">
            {hint}
          </div>
        )}
      </div>
    );
  },
);
FloatingInput.displayName = "FloatingInput";
