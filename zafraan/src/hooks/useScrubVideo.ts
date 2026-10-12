"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export type ScrubOptions = {
  video: RefObject<HTMLVideoElement | null>;
  trigger: RefObject<HTMLElement | null>;
  src: string;
  /** ScrollTrigger start/end for the scrub window (desktop). */
  start?: string;
  end?: string;
  /** Hero video: attach src immediately and fetch at full priority. */
  eager?: boolean;
  /** Frame shown when motion is reduced (0–1 of duration). */
  stillAt?: number;
  /** 0–1: scroll progress on desktop, playback position on phones. */
  onProgress?: (p: number) => void;
};

/** Touch devices and small screens play films instead of scrubbing them. */
export const PLAYBACK_QUERY = "(hover: none), (pointer: coarse), (max-width: 767px)";

/**
 * Desktop: scroll progress drives video.currentTime directly — the film
 * never plays, one seek in flight at a time, eased inside GSAP's ticker.
 *
 * Phones/tablets: iOS only buffers a video once it plays, so seeking by
 * scroll leaves it black and stutters. There the film simply plays muted
 * and looped while it is on screen, and pauses when it leaves.
 *
 * Either way the source is attached only when the section is near.
 */
export function useScrubVideo({
  video,
  trigger,
  src,
  start = "top top",
  end = "bottom bottom",
  eager = false,
  stillAt = 0.5,
  onProgress,
}: ScrubOptions) {
  useEffect(() => {
    const v = video.current;
    const t = trigger.current;
    if (!v || !t) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playback = window.matchMedia(PLAYBACK_QUERY).matches;

    let attached = false;
    const onMeta = () => {
      if (reduce) v.currentTime = v.duration * stillAt;
    };
    const attach = () => {
      if (attached) return;
      attached = true;
      v.preload = "auto";
      // The hero ships its src in the server HTML so the fetch starts during parse.
      if (!v.getAttribute("src")) {
        v.src = src;
        v.load();
      } else if (v.readyState >= 1) onMeta();
    };
    v.addEventListener("loadedmetadata", onMeta);
    if (eager) attach();

    // ---------- Phones: plain muted playback while visible ----------
    if (playback && !reduce) {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            attach();
            v.play().catch(() => {});
          } else v.pause();
        },
        { threshold: 0.2 },
      );
      io.observe(t);
      const report = () => {
        if (v.duration) onProgress?.(v.currentTime / v.duration);
      };
      if (onProgress) gsap.ticker.add(report);
      return () => {
        io.disconnect();
        gsap.ticker.remove(report);
        v.removeEventListener("loadedmetadata", onMeta);
        v.pause();
      };
    }

    // ---------- Desktop: scroll owns the playhead ----------
    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && attach(), { rootMargin: "100% 0px 100% 0px" });
    near.observe(t);
    if (reduce) {
      return () => {
        near.disconnect();
        v.removeEventListener("loadedmetadata", onMeta);
      };
    }

    let target = 0;
    let current = 0;
    // Runs every frame but is nearly free when settled: it only seeks when the
    // eased playhead differs from the decoded frame, so the last frame always lands.
    const tick = () => {
      if (!v.duration || v.readyState < 1) return;
      current += (target * v.duration - current) * 0.16;
      const next = Math.min(v.duration - 0.04, Math.max(0, current));
      if (Math.abs(next - v.currentTime) < 1 / 90 || v.seeking) return;
      v.currentTime = next;
    };

    const st = ScrollTrigger.create({
      trigger: t,
      start,
      end,
      onUpdate: (self) => {
        target = self.progress;
        onProgress?.(self.progress);
      },
      onToggle: (self) => self.isActive && attach(),
    });
    target = st.progress;
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      near.disconnect();
      v.removeEventListener("loadedmetadata", onMeta);
      v.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, start, end, eager, stillAt]);
}
