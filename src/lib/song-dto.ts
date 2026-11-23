import type { Palette } from "@/data/catalog";
import type { PlayableItem } from "@/stores/player-store";

/** Song as sent to the browser (serialisable, with stats). */
export interface SongDTO {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  audioUrl: string;
  coverUrl: string | null;
  palette: Palette;
  plays: number;
  likes: number;
  /** Unique signed-in users who listened. */
  listeners: number;
  /** Whether the current user liked it. */
  liked: boolean;
  isActive: boolean;
  /** Uploaded by an admin (vs. seeded demo catalog). */
  uploaded: boolean;
  createdAt: string;
  /** Effective access: PREMIUM if the song or its album is Premium. */
  access: "FREE" | "PREMIUM";
  /** The song's own setting (what admins edit). */
  ownAccess: "FREE" | "PREMIUM";
  artistId: string | null;
  albumId: string | null;
  trackNumber: number | null;
}

export const dtoToItem = (s: SongDTO): PlayableItem => ({
  id: `db-${s.id}`,
  kind: "song",
  title: s.title,
  subtitle: s.artist,
  src: s.audioUrl,
  palette: s.palette,
  duration: s.duration || undefined,
  image: s.coverUrl ?? undefined,
  trackId: s.id,
  premium: s.access === "PREMIUM",
});
