"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Visualizer } from "@/components/audio/visualizer";
import { GUEST_PREVIEW_SECONDS, useCurrentItem, usePlayer } from "@/stores/player-store";

/** Soft paywall shown when a guest's preview runs out. */
export function PreviewGate() {
  const open = usePlayer((s) => s.gateOpen);
  const closeGate = usePlayer((s) => s.closeGate);
  const item = useCurrentItem();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeGate()}>
      <DialogContent className="text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-neon-gradient shadow-glow-pink">
          <Lock className="size-7 text-white" aria-hidden />
        </div>
        <DialogTitle>Sign in to keep listening</DialogTitle>
        <DialogDescription className="mt-2 text-base">
          {item ? (
            <>
              You&apos;ve heard {GUEST_PREVIEW_SECONDS} seconds of <span className="text-foreground">{item.title}</span>.
            </>
          ) : (
            <>Your {GUEST_PREVIEW_SECONDS}-second preview has ended.</>
          )}{" "}
          Create a free account to listen without limits.
        </DialogDescription>
        <div className="my-6 flex justify-center">
          <Visualizer playing={false} bars={9} className="h-8" barClassName="w-1.5" />
        </div>
        <div className="grid gap-3">
          <Button asChild size="lg" onClick={closeGate}>
            <Link href="/signup">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="glass" onClick={closeGate}>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button variant="ghost" onClick={closeGate}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
