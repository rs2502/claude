"use client";

import { useRef } from "react";
import { useMood } from "@/hooks/useMood";
import type { Mood } from "@/lib/store";

/** Drop inside any `relative` section (server or client) to claim its mood. */
export function MoodZone({ mood }: { mood: Mood }) {
  const ref = useRef<HTMLDivElement>(null);
  useMood(ref, mood);
  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0" />;
}
