"use client";

import { create } from "zustand";
import type { Palette, Song, Station } from "@/data/catalog";

import { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS } from "@/lib/player-constants";

export { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS };

export interface PlayableItem {
  id: string;
  kind: "song" | "station";
  title: string;
  subtitle: string;
  src: string;
  palette: Palette;
  // Known duration in seconds (songs only).
  duration?: number;
  // Optional cover image URL; falls back to generative art.
  image?: string;
  // Database song id: when set, plays are reported to /api/songs/:id/play.
  trackId?: string;
  // Database podcast episode id: plays are reported to /api/episodes/:id/play.
  episodeId?: string;
  // PREMIUM item: listeners without an active plan only get a preview.
  premium?: boolean;
}

export const songToItem = (s: Song): PlayableItem => ({
  id: s.id,
  kind: "song",
  title: s.title,
  subtitle: s.artist,
  src: s.src,
  palette: s.palette,
  duration: s.duration,
});

export const stationToItem = (s: Station): PlayableItem => ({
  id: s.id,
  kind: "station",
  title: s.name,
  subtitle: `${s.frequency} · ${s.genre}`,
  src: s.streamUrl,
  palette: s.palette,
});

interface PlayerState {
  queue: PlayableItem[];
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  // Seconds heard of the current item (used for the guest preview limit).
  previewElapsed: number;
  isGuest: boolean;
  // Active subscription (or admin): PREMIUM items play in full.
  canPlayPremium: boolean;
  gateOpen: boolean;
  // Why the preview gate opened.
  gateReason: "guest" | "premium";
  error: string | null;
}

interface PlayerActions {
  playQueue: (items: PlayableItem[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setGuest: (guest: boolean) => void;
  setCanPlayPremium: (v: boolean) => void;
  closeGate: () => void;
  // Internal: called by the audio engine.
  _sync: (patch: Partial<PlayerState>) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

// One <audio> element for the whole app, owned by <AudioEngine/>.
let audioEl: HTMLAudioElement | null = null;
export const registerAudio = (el: HTMLAudioElement | null) => {
  audioEl = el;
};
export const getAudio = () => audioEl;

// Whether the current item is preview-only for this listener, and why.
export function previewReason(s: Pick<PlayerState, "isGuest" | "canPlayPremium" | "queue" | "index">): "guest" | "premium" | null {
  if (s.isGuest) return "guest";
  if (s.queue[s.index]?.premium && !s.canPlayPremium) return "premium";
  return null;
}

export const usePlayer = create<PlayerStore>((set, get) => {
  const blockedByGate = () => {
    const s = get();
    const reason = previewReason(s);
    if (reason && s.previewElapsed >= GUEST_PREVIEW_SECONDS) {
      set({ gateOpen: true, gateReason: reason });
      return true;
    }
    return false;
  };

  return {
    queue: [],
    index: 0,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
    previewElapsed: 0,
    isGuest: true,
    canPlayPremium: false,
    gateOpen: false,
    gateReason: "guest",
    error: null,

    playQueue: (items, startIndex = 0) => {
      if (!items.length) return;
      const { queue, index } = get();
      const target = items[startIndex];
      const same = queue[index]?.id === target.id && queue[index]?.kind === target.kind;
      if (same) {
        set({ queue: items, index: startIndex });
        get().play();
        return;
      }
      set({
        queue: items,
        index: startIndex,
        currentTime: 0,
        duration: target.duration ?? 0,
        previewElapsed: 0,
        error: null,
        isPlaying: true,
      });
    },

    play: () => {
      if (!get().queue.length || blockedByGate()) return;
      set({ isPlaying: true });
    },
    pause: () => set({ isPlaying: false }),
    toggle: () => (get().isPlaying ? get().pause() : get().play()),

    next: () => {
      const { queue, index } = get();
      if (!queue.length) return;
      const nextIndex = (index + 1) % queue.length;
      const item = queue[nextIndex];
      set({ index: nextIndex, currentTime: 0, duration: item.duration ?? 0, previewElapsed: 0, error: null, isPlaying: true });
    },

    prev: () => {
      const { queue, index, currentTime } = get();
      if (!queue.length) return;
      if (currentTime > 3 && queue[index].kind === "song") {
        get().seek(0);
        return;
      }
      const prevIndex = (index - 1 + queue.length) % queue.length;
      const item = queue[prevIndex];
      set({ index: prevIndex, currentTime: 0, duration: item.duration ?? 0, previewElapsed: 0, error: null, isPlaying: true });
    },

    seek: (seconds) => {
      const el = getAudio();
      if (!el || !Number.isFinite(seconds)) return;
      el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds));
      set({ currentTime: el.currentTime });
    },

    setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
    toggleMute: () => set((s) => ({ muted: !s.muted })),
    setGuest: (guest) => set({ isGuest: guest, gateOpen: guest ? get().gateOpen : false }),
    setCanPlayPremium: (v) => set({ canPlayPremium: v, gateOpen: v && get().gateReason === "premium" ? false : get().gateOpen }),
    closeGate: () => set({ gateOpen: false }),
    _sync: (patch) => set(patch),
  };
});

// Convenience selectors
export const useCurrentItem = () => usePlayer((s) => s.queue[s.index] as PlayableItem | undefined);
export const useIsActive = (kind: PlayableItem["kind"], id: string) =>
  usePlayer((s) => {
    const cur = s.queue[s.index];
    return cur?.kind === kind && cur.id === id;
  });
