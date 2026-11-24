"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  // Lift + glow on hover.
  interactive?: boolean;
  // Gradient hairline border.
  gradientBorder?: boolean;
  strong?: boolean;
}

// Frosted glass surface. Tracks the pointer to paint a soft spotlight
// (CSS vars --mx/--my) for a premium hover feel.
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = false, gradientBorder = false, strong = false, children, onPointerMove, ...props }, ref) => {
    const reduce = useReducedMotion();

    const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(e);
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    return (
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        whileHover={interactive && !reduce ? { y: -4 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={cn(
          strong ? "glass-strong" : "glass",
          "group/card isolate overflow-hidden rounded-2xl",
          gradientBorder && "gradient-border",
          interactive &&
            "transition-[box-shadow,border-color] duration-300 hover:border-foreground/15 hover:shadow-glow",
          className,
        )}
        {...props}
      >
        {interactive && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(124,58,237,0.16), transparent 45%)",
            }}
          />
        )}
        <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-glass-sheen" />
        {children as React.ReactNode}
      </motion.div>
    );
  },
);
GlassCard.displayName = "GlassCard";
