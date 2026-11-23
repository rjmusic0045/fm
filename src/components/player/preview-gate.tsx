"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Visualizer } from "@/components/audio/visualizer";
import { GUEST_PREVIEW_SECONDS, useCurrentItem, usePlayer } from "@/stores/player-store";

/**
 * Soft paywall shown when a preview runs out:
 *  - guests: sign in / create an account
 *  - signed-in listeners on a PREMIUM item without an active plan: upgrade
 */
export function PreviewGate() {
  const open = usePlayer((s) => s.gateOpen);
  const reason = usePlayer((s) => s.gateReason);
  const closeGate = usePlayer((s) => s.closeGate);
  const item = useCurrentItem();
  const premium = reason === "premium";

  const heard = item ? (
    <>
      You&apos;ve heard {GUEST_PREVIEW_SECONDS} seconds of <span className="font-medium text-foreground">{item.title}</span>.
    </>
  ) : (
    <>Your {GUEST_PREVIEW_SECONDS}-second preview has ended.</>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeGate()}>
      <DialogContent className="text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-neon-gradient shadow-glow-pink">
          {premium ? <Crown className="size-7 text-white" aria-hidden /> : <Lock className="size-7 text-white" aria-hidden />}
        </div>
        <DialogTitle>{premium ? "This is Premium content" : "Sign in to keep listening"}</DialogTitle>
        <DialogDescription className="mt-2 text-base">
          {heard}{" "}
          {premium
            ? "Upgrade to Premium to play every song, album and podcast in full."
            : "Create a free account to listen without limits."}
        </DialogDescription>
        <div className="my-6 flex justify-center">
          <Visualizer playing={false} bars={9} className="h-8" barClassName="w-1.5" />
        </div>
        <div className="grid gap-3">
          {premium ? (
            <Button asChild size="lg" onClick={closeGate}>
              <Link href="/#pricing">See Premium plans</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" onClick={closeGate}>
                <Link href="/signup">Create free account</Link>
              </Button>
              <Button asChild size="lg" variant="glass" onClick={closeGate}>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={closeGate}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
