"use client";

import { useEffect } from "react";
import { GUEST_PREVIEW_SECONDS, PLAY_COUNT_SECONDS, previewReason, registerAudio, usePlayer, type PlayableItem } from "@/stores/player-store";

const itemKey = (i?: PlayableItem) => (i ? `${i.kind}:${i.id}` : "");

/** Fire-and-forget play report; keepalive lets it survive page navigation. */
function reportPlay(item: PlayableItem, seconds: number) {
  const url = item.episodeId ? `/api/episodes/${item.episodeId}/play` : `/api/songs/${item.trackId}/play`;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seconds: Math.round(seconds) }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Headless audio driver. Owns the single HTMLAudioElement and keeps it in sync
 * with the zustand store via imperative subscriptions (no React re-renders).
 */
export function AudioEngine({ isGuest = true }: { isGuest?: boolean }) {
  useEffect(() => {
    usePlayer.getState().setGuest(isGuest);
  }, [isGuest]);

  useEffect(() => {
    const el = new Audio();
    el.preload = "metadata";
    registerAudio(el);

    const { _sync } = usePlayer.getState();
    let lastTime = 0;
    let liveOffsetPending = false;
    // Play counting for database songs: seconds actually heard for the current load.
    let listened = 0;
    let counted = false;
    const maybeCount = (force = false) => {
      const cur = usePlayer.getState().queue[usePlayer.getState().index];
      if (counted || !(cur?.trackId || cur?.episodeId)) return;
      if (listened >= PLAY_COUNT_SECONDS || (force && listened >= 5)) {
        counted = true;
        reportPlay(cur, listened);
      }
    };

    const tryPlay = () => {
      el.play().catch((err: unknown) => {
        // AbortError fires when src changes mid-load; it's harmless.
        if (err instanceof DOMException && err.name === "AbortError") return;
        _sync({ isPlaying: false, isBuffering: false, error: "Playback failed. Check your connection and try again." });
      });
    };

    const load = (item: PlayableItem | undefined, autoplay: boolean) => {
      if (!item) {
        el.removeAttribute("src");
        el.load();
        return;
      }
      el.src = item.src;
      el.loop = item.kind === "station";
      liveOffsetPending = item.kind === "station";
      lastTime = 0;
      listened = 0;
      counted = false;
      if (autoplay) {
        _sync({ isBuffering: true });
        tryPlay();
      }
    };

    // --- store -> element -------------------------------------------------
    const unsub = usePlayer.subscribe((s, prev) => {
      const cur = s.queue[s.index];
      const before = prev.queue[prev.index];
      if (itemKey(cur) !== itemKey(before)) {
        load(cur, s.isPlaying);
      } else if (s.isPlaying !== prev.isPlaying) {
        if (s.isPlaying) tryPlay();
        else el.pause();
      }
      if (s.volume !== prev.volume || s.muted !== prev.muted) {
        el.volume = s.volume;
        el.muted = s.muted;
      }
      if (itemKey(cur) !== itemKey(before) && cur && "mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: cur.title,
          artist: cur.subtitle,
          album: cur.kind === "station" ? "Live Radio · Lumen FM" : "Lumen FM",
        });
      }
    });
    el.volume = usePlayer.getState().volume;

    // --- element -> store -------------------------------------------------
    const onLoadedMetadata = () => {
      if (liveOffsetPending && Number.isFinite(el.duration) && el.duration > 60) {
        // Simulate tuning into a broadcast already in progress.
        el.currentTime = Math.random() * (el.duration - 60);
        lastTime = el.currentTime;
      }
      liveOffsetPending = false;
      _sync({ duration: Number.isFinite(el.duration) ? el.duration : 0 });
    };

    const onTimeUpdate = () => {
      const t = el.currentTime;
      const delta = t - lastTime;
      lastTime = t;
      const state = usePlayer.getState();
      const patch: Parameters<typeof _sync>[0] = { currentTime: t };
      if (delta > 0 && delta < 1.5 && !el.paused) {
        listened += delta;
        maybeCount();
        patch.previewElapsed = state.previewElapsed + delta;
        const reason = previewReason(state);
        if (reason && patch.previewElapsed >= GUEST_PREVIEW_SECONDS) {
          el.pause();
          patch.isPlaying = false;
          patch.gateOpen = true;
          patch.gateReason = reason;
        }
      }
      _sync(patch);
    };

    const onSeeked = () => {
      lastTime = el.currentTime;
    };
    const onWaiting = () => _sync({ isBuffering: true });
    const onPlaying = () => _sync({ isBuffering: false, isPlaying: true, error: null });
    const onPause = () => {
      if (usePlayer.getState().isPlaying && !el.ended) _sync({ isPlaying: false });
    };
    const onEnded = () => {
      maybeCount(true); // short tracks count once finished
      listened = 0; // a replay of the same track counts again
      counted = false;
      const s = usePlayer.getState();
      if (s.queue.length > 1) s.next();
      else _sync({ isPlaying: false, currentTime: 0 });
    };
    const onError = () => {
      if (!el.getAttribute("src")) return;
      _sync({ isPlaying: false, isBuffering: false, error: "This stream is unavailable right now." });
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    // --- OS media keys / lock screen ---------------------------------------
    if ("mediaSession" in navigator) {
      const s = () => usePlayer.getState();
      navigator.mediaSession.setActionHandler("play", () => s().play());
      navigator.mediaSession.setActionHandler("pause", () => s().pause());
      navigator.mediaSession.setActionHandler("nexttrack", () => s().next());
      navigator.mediaSession.setActionHandler("previoustrack", () => s().prev());
    }

    // --- Space bar toggles playback (outside form controls) -----------------
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, button, a, [role='slider'], [contenteditable='true']")) return;
      const s = usePlayer.getState();
      if (!s.queue.length) return;
      e.preventDefault();
      s.toggle();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      unsub();
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
      el.pause();
      registerAudio(null);
    };
  }, []);

  return null;
}
