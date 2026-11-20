import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listSongs } from "@/lib/songs";
import { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS } from "@/lib/player-constants";
import { SongList } from "@/components/music/song-list";

export const metadata: Metadata = {
  title: "Music",
  description: "Listen to the latest uploads on Lumen FM.",
};

// Stats change on every play/like: always render fresh.
export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const session = await getSession();
  const songs = await listSongs({ userId: session?.user.id });

  return (
    <div className="container max-w-4xl pb-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Music</h1>
          <p className="mt-2 text-muted-foreground">
            {songs.length} songs. A play counts after {PLAY_COUNT_SECONDS} seconds of listening.
          </p>
        </div>
        {!session && (
          <p className="text-sm text-muted-foreground">
            Guests hear {GUEST_PREVIEW_SECONDS}s previews.{" "}
            <Link href="/login?callbackUrl=/music" className="font-medium text-primary hover:underline">
              Sign in
            </Link>{" "}
            to listen fully and like songs.
          </p>
        )}
      </header>
      <SongList songs={songs} signedIn={Boolean(session)} />
    </div>
  );
}
