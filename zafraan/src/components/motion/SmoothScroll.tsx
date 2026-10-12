"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { experience } from "@/lib/store";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis drives the scroll position; GSAP's ticker drives Lenis. One rAF for
 * the whole page, so ScrollTrigger, video scrubbing and Lenis never drift.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      // Native momentum on touch feels right; Lenis only syncs it.
      syncTouch: false,
      touchMultiplier: 1.4,
      autoRaf: false,
      anchors: { offset: 0 },
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Hold the page while the loader plays.
    if (!experience.get().loaded) instance.stop();
    const unsub = experience.subscribe(() => {
      const { loaded, transitioning } = experience.get();
      if (loaded && !transitioning) instance.start();
      else instance.stop();
    });

    setLenis(instance);
    return () => {
      unsub();
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
