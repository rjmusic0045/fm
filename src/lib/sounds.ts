"use client";

/**
 * Tiny synthesized UI sounds via the Web Audio API.
 * No audio files to download, works offline, zero layout cost.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBurst(ac: AudioContext, at: number, duration: number, gain: number, freq: number) {
  const length = Math.ceil(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // exponentially decaying white noise
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);
}

function thump(ac: AudioContext, at: number, from: number, to: number, gain: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + 0.05);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + 0.08);
}

/** Mechanical pull-switch "click-clack". Slightly brighter when turning on. */
export function playSwitchClick(on: boolean) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.005;
  noiseBurst(ac, t, 0.02, 0.9, on ? 3800 : 3000);
  thump(ac, t, on ? 900 : 700, 120, 0.25);
  noiseBurst(ac, t + 0.045, 0.015, 0.35, on ? 5200 : 4200);
}

/** Soft electrical hum swell as the bulb warms up. */
export function playBulbHum() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "triangle";
  osc.frequency.value = 100;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.03, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.65);
}
