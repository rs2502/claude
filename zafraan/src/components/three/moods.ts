import type { Mood } from "@/lib/store";

/** How the atmosphere breathes in each chapter. All values 0–1. */
export type MoodSettings = { dust: number; spice: number; herbs: number; steam: number; focus: number };

export const MOODS: Record<Mood, MoodSettings> = {
  hero: { dust: 0.9, spice: 0.75, herbs: 0.9, steam: 0.85, focus: 0.5 },
  story: { dust: 0.45, spice: 0.15, herbs: 0.0, steam: 0.0, focus: 0.35 },
  samosa: { dust: 0.6, spice: 0.35, herbs: 0.25, steam: 1.0, focus: 0.55 },
  ingredients: { dust: 1.0, spice: 1.0, herbs: 1.0, steam: 0.1, focus: 0.65 },
  craft: { dust: 0.55, spice: 0.3, herbs: 0.0, steam: 0.4, focus: 0.4 },
  sauces: { dust: 0.7, spice: 0.5, herbs: 0.35, steam: 0.55, focus: 0.5 },
  dining: { dust: 0.8, spice: 0.35, herbs: 0.4, steam: 0.15, focus: 0.45 },
  reserve: { dust: 0.35, spice: 0.12, herbs: 0.0, steam: 0.0, focus: 0.35 },
};
