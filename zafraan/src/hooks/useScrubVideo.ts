"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export type ScrubOptions = {
  video: RefObject<HTMLVideoElement | null>;
  trigger: RefObject<HTMLElement | null>;
  src: string;
  /** ScrollTrigger start/end for the scrub window. */
  start?: string;
  end?: string;
  /** Hero video: attach src immediately and fetch at full priority. */
  eager?: boolean;
  /** Portion of the clip mapped to the scroll window. */
  from?: number;
  to?: number;
  /** Frame shown when motion is reduced (0–1 of duration). */
  stillAt?: number;
  onProgress?: (p: number) => void;
  /** Lets layout variants (desktop/mobile) share a hook without double-loading. */
  enabled?: boolean;
};

/**
 * Maps scroll progress directly onto video.currentTime.
 *
 * - The video never plays; the playhead is a function of scroll only.
 * - Seeks are rate-limited to one in flight (`seeking`), which is what keeps
 *   decoders from queueing work and dropping frames.
 * - The playhead eases toward its target inside GSAP's ticker, so Lenis,
 *   ScrollTrigger and the video share a single rAF.
 * - Coarse pointers (phones) get a simplified, stepped scrub at ~12 fps of
 *   source time, which mobile decoders can sustain.
 * - Source is attached only when the section is within one viewport.
 */
export function useScrubVideo({
  video,
  trigger,
  src,
  start = "top top",
  end = "bottom bottom",
  eager = false,
  from = 0,
  to = 1,
  stillAt = 0.5,
  onProgress,
  enabled = true,
}: ScrubOptions) {
  useEffect(() => {
    const v = video.current;
    const t = trigger.current;
    if (!v || !t || !enabled) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let primed = false;
    const onMeta = () => {
      if (reduce) {
        v.currentTime = v.duration * stillAt;
        return;
      }
      // iOS only paints seeks after the element has been "activated".
      if (coarse && !primed) {
        primed = true;
        v.play().then(() => v.pause()).catch(() => {});
      }
    };
    let attached = false;
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
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) attach();
        else if (!v.paused) v.pause();
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    io.observe(t);

    if (reduce) {
      return () => {
        io.disconnect();
        v.removeEventListener("loadedmetadata", onMeta);
      };
    }

    let target = 0;
    let current = 0;
    const step = coarse ? 1 / 12 : 0;
    const ease = coarse ? 1 : 0.16;

    // Runs every frame but is nearly free when settled: it only seeks when the
    // eased playhead differs from the decoded frame, so the last frame always lands.
    const tick = () => {
      if (!v.duration || v.readyState < 1) return;
      const span = v.duration * (to - from);
      const goal = v.duration * from + target * span;
      current += (goal - current) * ease;
      let next = Math.min(v.duration - 0.04, Math.max(0, current));
      if (step) next = Math.round(next / step) * step;
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
    // Reloading mid-page: start from wherever the reader already is.
    target = st.progress;

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      io.disconnect();
      v.removeEventListener("loadedmetadata", onMeta);
      v.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, start, end, eager, from, to, stillAt, enabled]);
}
