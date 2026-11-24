"use client";

import * as React from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SUBMISSION_SECONDS } from "@/config/voices";
import { formatDuration } from "@/lib/utils";

/** First container the browser can record (Chrome/Edge: WebM/Opus, Safari: MP4). */
function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
}

type State = "idle" | "asking" | "recording" | "done" | "error";

/**
 * In-browser voice recorder. Calls onChange(file, seconds) when a take is ready,
 * onChange(null, 0) when it is discarded.
 */
export function AudioRecorder({ onChange }: { onChange: (file: File | null, seconds: number) => void }) {
  const [state, setState] = React.useState<State>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunks = React.useRef<Blob[]>([]);
  const startedAt = React.useRef(0);
  const timer = React.useRef<number | null>(null);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };
  React.useEffect(() => () => {
    stopTracks();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const start = async () => {
    setError(null);
    const mime = pickMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("Recording isn't supported in this browser. Upload a file instead.");
      return;
    }
    setState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 96_000 });
      recRef.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        const type = mime.split(";")[0]; // the server accepts the plain container type
        const blob = new Blob(chunks.current, { type });
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`, { type });
        setPreviewUrl(URL.createObjectURL(blob));
        setState("done");
        onChange(file, seconds);
        stopTracks();
      };
      rec.start(1000);
      startedAt.current = Date.now();
      setElapsed(0);
      setState("recording");
      timer.current = window.setInterval(() => {
        const s = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(s);
        if (s >= MAX_SUBMISSION_SECONDS) rec.state === "recording" && rec.stop();
      }, 250);
    } catch (err) {
      stopTracks();
      setState("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser's site settings, or upload a file instead."
          : "Couldn't start the microphone. Check that one is connected, or upload a file instead.",
      );
    }
  };

  const stop = () => recRef.current?.state === "recording" && recRef.current.stop();
  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setState("idle");
    onChange(null, 0);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      {state === "recording" ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-lg tabular-nums" aria-live="polite">
            {formatDuration(elapsed)}
          </span>
          <span className="text-xs text-muted-foreground">max {MAX_SUBMISSION_SECONDS / 60} min</span>
          <Button type="button" variant="destructive" size="sm" onClick={stop} className="ml-auto">
            <Square className="fill-current" /> Stop
          </Button>
        </div>
      ) : state === "done" && previewUrl ? (
        <div className="space-y-3">
          <audio controls src={previewUrl} className="w-full" aria-label="Preview your recording" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recorded {formatDuration(elapsed)}</span>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> Record again
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={start} loading={state === "asking"}>
            {state !== "asking" && <Mic />} {state === "asking" ? "Allow microphone…" : "Start recording"}
          </Button>
          <span className="text-sm text-muted-foreground">Find a quiet place and speak naturally.</span>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
