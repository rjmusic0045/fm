"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { AudioEngine } from "@/components/player/audio-engine";
import { PreviewGate } from "@/components/player/preview-gate";

/** True only for a live session that still carries a user id (expired remember-me sessions don't). */
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
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
      <PlayerBridge />
      <PreviewGate />
    </SessionProvider>
  );
}
