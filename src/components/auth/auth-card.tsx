import { cn } from "@/lib/utils";

// Warm-lit glass card, lit from the floor lamp on its left.
export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-amber-200/15 bg-foreground/[0.045] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(255,190,110,0.35)] backdrop-blur-2xl sm:p-8",
        className,
      )}
    >
      {/* warm top highlight where the light hits the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2/3"
        style={{ background: "radial-gradient(100% 70% at 0% 45%, rgba(255,214,150,0.13), transparent 70%)" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-amber-200/50 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground/15" />
      {label}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-foreground/15" />
    </div>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "info" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "error" && "border-red-400/30 bg-red-500/10 text-red-200",
        tone === "info" && "border-amber-300/30 bg-amber-400/10 text-amber-100",
        tone === "success" && "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
      )}
    >
      {children}
    </div>
  );
}
