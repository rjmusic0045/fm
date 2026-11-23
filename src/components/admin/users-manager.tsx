"use client";

import * as React from "react";
import { Crown, LogOut, MoreHorizontal, ShieldCheck } from "lucide-react";
import { FormError, inputClass, useAdminAction } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLoginAt: string | null;
  /** Signed in on a device seen in the last few minutes. */
  online: boolean;
  plan: "FREE" | "PREMIUM" | "FAMILY";
  planState: "none" | "active" | "expired";
  periodEnd: string | null;
  manual: boolean;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "–";

function PlanCell({ u }: { u: UserRow }) {
  if (u.planState === "none") return <span className="text-muted-foreground">Free</span>;
  const name = u.plan.charAt(0) + u.plan.slice(1).toLowerCase();
  return u.planState === "active" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      <Crown className="size-3" aria-hidden /> {name} · until {fmt(u.periodEnd)}
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
      {name} ended {fmt(u.periodEnd)}
    </span>
  );
}

function Actions({ u, onError }: { u: UserRow; onError: (e: string | null) => void }) {
  const { run, busy, error } = useAdminAction();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => onError(error), [error, onError]);

  const act = (body: Record<string, unknown>, confirmText?: string) => {
    setOpen(false);
    if (confirmText && !confirm(confirmText)) return;
    void run(() => fetch(`/api/admin/users/${u.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  };
  const item = "block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted";

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${u.email}`}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-border bg-background p-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">Grant / renew plan</p>
          <button role="menuitem" className={item} onClick={() => act({ action: "grant", plan: "PREMIUM", days: 30 })}>Premium · 30 days</button>
          <button role="menuitem" className={item} onClick={() => act({ action: "grant", plan: "PREMIUM", days: 365 })}>Premium · 1 year</button>
          <button role="menuitem" className={item} onClick={() => act({ action: "grant", plan: "FAMILY", days: 30 })}>Family · 30 days</button>
          {u.planState === "active" && (
            <button role="menuitem" className={cn(item, "text-red-600")} onClick={() => act({ action: "expire" }, `End ${u.email}'s plan now? They'll see a "plan ended" notice.`)}>
              End plan now
            </button>
          )}
          {u.planState !== "none" && (
            <button role="menuitem" className={item} onClick={() => act({ action: "remove" }, `Remove ${u.email}'s plan record (back to Free)?`)}>
              Remove plan
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button role="menuitem" className={item} onClick={() => act({ action: "signout" }, `Sign ${u.email} out of every device?`)}>
            <LogOut className="mr-1.5 inline size-3.5" aria-hidden /> Sign out all devices
          </button>
          <button
            role="menuitem"
            className={item}
            onClick={() => act({ action: "role", role: u.role === "ADMIN" ? "USER" : "ADMIN" }, `${u.role === "ADMIN" ? "Remove admin from" : "Make admin:"} ${u.email}?`)}
          >
            <ShieldCheck className="mr-1.5 inline size-3.5" aria-hidden /> {u.role === "ADMIN" ? "Remove admin role" : "Make admin"}
          </button>
        </div>
      )}
    </div>
  );
}

export function UsersManager({ users }: { users: UserRow[] }) {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "active" | "expired" | "free" | "online">("all");
  const [error, setError] = React.useState<string | null>(null);

  const shown = users.filter((u) => {
    if (q && !`${u.name ?? ""} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "active") return u.planState === "active";
    if (filter === "expired") return u.planState === "expired";
    if (filter === "free") return u.planState === "none";
    if (filter === "online") return u.online;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search users" className={cn(inputClass, "max-w-xs")} />
        {(["all", "active", "expired", "free", "online"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn("rounded-full px-3 py-1 text-sm", filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
          >
            {{ all: "All", active: "Paid", expired: "Expired", free: "Free", online: "Online now" }[f]}
          </button>
        ))}
      </div>
      <FormError error={error} />
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-2 pl-4 pr-2 font-medium">User</th>
              <th className="px-2 py-2 font-medium">Role</th>
              <th className="px-2 py-2 font-medium">Plan</th>
              <th className="px-2 py-2 font-medium">Device</th>
              <th className="px-2 py-2 font-medium">Last login</th>
              <th className="py-2 pl-2 pr-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-2 pl-4 pr-2">
                  <p className="font-medium">{u.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-2">
                  {u.role === "ADMIN" ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span> : "User"}
                </td>
                <td className="px-2">
                  <PlanCell u={u} />
                  {u.manual && u.planState !== "none" && <span className="ml-1 text-[10px] text-muted-foreground">(granted)</span>}
                </td>
                <td className="px-2">
                  {u.online ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                      <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Online
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Offline</span>
                  )}
                </td>
                <td className="px-2 text-xs text-muted-foreground">{fmt(u.lastLoginAt)}</td>
                <td className="py-2 pl-2 pr-4">
                  <div className="flex justify-end">
                    <Actions u={u} onError={setError} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="p-8 text-center text-muted-foreground">No users match.</p>}
      </div>
    </div>
  );
}
