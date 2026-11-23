"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarClock, Crown, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePlayer } from "@/stores/player-store";

interface EntitlementResponse {
  ok: boolean;
  signedIn: boolean;
  entitlement: { plan: string; state: "none" | "active" | "expired"; periodEnd: string | null; daysLeft: number | null; canPlayPremium: boolean };
}

type Notice =
  | { kind: "expired"; plan: string; periodEnd: string | null }
  | { kind: "expiring"; plan: string; daysLeft: number; periodEnd: string | null }
  | { kind: "revoked" };

/** Warn this many days before a paid plan ends. */
const EXPIRY_WARNING_DAYS = 3;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
const planName = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

/**
 * Session-level notices:
 *  - keeps the player's "can play premium" flag in sync with the user's plan
 *  - once per login: popup if the plan has ended or ends within a few days
 *  - popup when this device was signed out because the account signed in elsewhere
 */
export function AccountNotices() {
  const { data: session, status } = useSession();
  const setCanPlayPremium = usePlayer((s) => s.setCanPlayPremium);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const userId = session?.user?.id;
  const loginAt = session?.loginAt;

  // Signed out because the account was used on another device.
  React.useEffect(() => {
    if (session?.revoked) setNotice({ kind: "revoked" });
  }, [session?.revoked]);

  React.useEffect(() => {
    if (status === "loading") return;
    if (!userId) {
      setCanPlayPremium(false);
      return;
    }
    let cancelled = false;
    void fetch("/api/me/entitlement", { cache: "no-store" })
      .then((r) => r.json() as Promise<EntitlementResponse>)
      .then(({ entitlement: e }) => {
        if (cancelled) return;
        setCanPlayPremium(e.canPlayPremium);

        const key = `lumen:plan-notice:${userId}:${loginAt ?? "session"}`;
        if (window.localStorage.getItem(key)) return; // already shown for this login
        if (e.state === "expired") setNotice({ kind: "expired", plan: e.plan, periodEnd: e.periodEnd });
        else if (e.state === "active" && e.daysLeft !== null && e.daysLeft <= EXPIRY_WARNING_DAYS)
          setNotice({ kind: "expiring", plan: e.plan, daysLeft: e.daysLeft, periodEnd: e.periodEnd });
        else return;
        window.localStorage.setItem(key, "1");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status, userId, loginAt, setCanPlayPremium]);

  const close = () => setNotice(null);
  if (!notice) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-neon-gradient shadow-glow-pink">
          {notice.kind === "revoked" ? (
            <MonitorSmartphone className="size-7 text-white" aria-hidden />
          ) : notice.kind === "expired" ? (
            <Crown className="size-7 text-white" aria-hidden />
          ) : (
            <CalendarClock className="size-7 text-white" aria-hidden />
          )}
        </div>

        {notice.kind === "revoked" && (
          <>
            <DialogTitle>You were signed out</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              Your account was signed in on another device. Only one device can use an account at a time.
            </DialogDescription>
          </>
        )}
        {notice.kind === "expired" && (
          <>
            <DialogTitle>Your {planName(notice.plan)} plan has ended</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {notice.periodEnd ? `It ended on ${fmtDate(notice.periodEnd)}. ` : ""}
              Premium songs, albums and podcasts now play as short previews. Renew to listen in full again.
            </DialogDescription>
          </>
        )}
        {notice.kind === "expiring" && (
          <>
            <DialogTitle>
              Your {planName(notice.plan)} plan ends {notice.daysLeft === 0 ? "today" : `in ${notice.daysLeft} day${notice.daysLeft === 1 ? "" : "s"}`}
            </DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {notice.periodEnd ? `Access lasts until ${fmtDate(notice.periodEnd)}. ` : ""}
              Renew now to keep Premium content without interruption.
            </DialogDescription>
          </>
        )}

        <div className="mt-6 grid gap-3">
          {notice.kind === "revoked" ? (
            <Button asChild size="lg" onClick={close}>
              <Link href="/login">Sign in again</Link>
            </Button>
          ) : (
            <Button asChild size="lg" onClick={close}>
              <Link href="/#pricing">{notice.kind === "expired" ? "Renew plan" : "View plans"}</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            {notice.kind === "revoked" ? "Continue as guest" : "Not now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
