import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        glass: "glass text-foreground",
        gradient: "bg-neon-gradient text-white",
        live: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
        amber: "bg-neon-amber/15 text-amber-700 ring-1 ring-inset ring-neon-amber/40",
        violet: "bg-neon-violet/20 text-primary ring-1 ring-inset ring-neon-violet/40",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "glass" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Pulsing "LIVE" pill used on stations.
export function LiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="live" className={cn("uppercase", className)}>
      <span className="size-1.5 animate-live-pulse rounded-full bg-red-500" aria-hidden />
      Live
    </Badge>
  );
}

export { badgeVariants };
