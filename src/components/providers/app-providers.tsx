"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { AudioEngine } from "@/components/player/audio-engine";
import { PreviewGate } from "@/components/player/preview-gate";
import { AccountNotices } from "@/components/providers/account-notices";

// True only for a live session that still carries a user id (expired remember-me sessions don't).
export function useIsSignedIn() {
  const { data, status } = useSession();
  return status === "authenticated" && Boolean(data?.user?.id);
}

function PlayerBridge() {
  const { status } = useSession();
  const signedIn = useIsSignedIn();
  // While the session is loading, keep guest limits so a preview can't slip through.
  return <AudioEngine isGuest={status === "loading" || !signedIn} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    // Re-check the session every minute so a device signed out elsewhere finds out promptly.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={60}>
      {children}
      <PlayerBridge />
      <PreviewGate />
      <AccountNotices />
    </SessionProvider>
  );
}
