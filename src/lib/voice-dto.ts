import type { Palette } from "@/data/catalog";
import type { PlayableItem } from "@/stores/player-store";
import type { VoiceCategoryId } from "@/config/voices";

/** A published People & Voices story as sent to the browser. */
export interface VoiceDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: VoiceCategoryId;
  topic: string;
  language: string | null;
  /** "Village, District, State" (null when anonymous or not set). */
  place: string | null;
  /** Display name ("Anonymous" when the storyteller chose privacy). */
  speaker: string;
  anonymous: boolean;
  audioUrl: string;
  duration: number;
  coverUrl: string | null;
  palette: Palette;
  premium: boolean;
  featured: boolean;
  plays: number;
  publishedAt: string;
}

export const voiceToItem = (v: VoiceDTO): PlayableItem => ({
  id: `voice-${v.id}`,
  kind: "song",
  title: v.title,
  subtitle: v.speaker,
  src: v.audioUrl,
  palette: v.palette,
  duration: v.duration || undefined,
  image: v.coverUrl ?? undefined,
  voiceId: v.id,
  premium: v.premium,
});
