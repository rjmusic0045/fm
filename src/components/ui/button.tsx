"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
    "rounded-full font-medium transition-all duration-200 ease-out will-change-transform",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        gradient:
          "bg-neon-gradient bg-[length:200%_200%] text-white shadow-glow hover:animate-gradient-pan hover:shadow-glow-pink",
        primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
        glass:
          "glass text-foreground hover:bg-foreground/[0.08] hover:border-foreground/20 hover:shadow-glow",
        outline:
          "border border-foreground/15 bg-transparent text-foreground hover:border-foreground/30 hover:bg-foreground/[0.04]",
        ghost: "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground hover:translate-y-0",
        facebook: "bg-facebook text-white hover:brightness-110 hover:shadow-[0_10px_30px_-10px_#1877F2]",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        link: "rounded-none px-0 text-foreground underline-offset-4 hover:translate-y-0 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "size-10 [&_svg]:size-5",
        "icon-sm": "size-8",
        "icon-lg": "size-14 [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "gradient", size: "md" },
  },
);

type Ripple = { id: number; x: number; y: number; size: number };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Disable the click ripple (e.g. for icon-only toolbars). */
  noRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, noRipple, disabled, onPointerDown, children, ...props },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([]);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);
      if (noRipple || variant === "link") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple: Ripple = {
        id: Date.now() + Math.random(),
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
      };
      setRipples((r) => [...r, ripple]);
    };

    const rippleLayer = ripples.map((r) => (
      <span
        key={r.id}
        aria-hidden
        className="pointer-events-none absolute -z-10 animate-ripple rounded-full bg-foreground/40"
        style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        onAnimationEnd={() => setRipples((all) => all.filter((x) => x.id !== r.id))}
      />
    ));

    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onPointerDown={handlePointerDown}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
        {rippleLayer}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
