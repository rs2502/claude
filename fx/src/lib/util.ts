import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export const W = 1080;
export const H = 1920;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.7));

/** Fortschritt 0..1 zwischen den Sekunden a und b. */
export const p = (t: number, a: number, b: number, ease: (x: number) => number = easeOut) =>
  ease(clamp01((t - a) / (b - a)));

/** Sekunden seit Beginn der Sequenz. */
export const useTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Ein- und Ausblenden: 0 → 1 → 0 über die Dauer des Effekts. */
export const envelope = (t: number, dur: number, fadeIn = 0.25, fadeOut = 0.25) =>
  Math.min(p(t, 0, fadeIn), 1 - p(t, dur - fadeOut, dur, easeIn));

export type Face = { x: number; y: number };
export const DEFAULT_FACE: Face = { x: 540, y: 560 };
