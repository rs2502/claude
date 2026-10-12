"use client";

import { animate } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { consumePendingNavigation } from "./TransitionLink";
import { experience, useExperience } from "@/lib/store";
import { ScrollTrigger } from "@/lib/gsap";

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Editorial page turn: a paper sheet rises over the page, the route changes
 * underneath it, and the sheet lifts away — top edge first — onto the new page.
 */
export function PageCurtain() {
  const ref = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const transitioning = useExperience((s) => s.transitioning);
  const pathname = usePathname();
  const covered = useRef(false);

  useEffect(() => {
    if (!transitioning || !ref.current) return;
    ref.current.style.visibility = "visible";
    animate(ref.current, { clipPath: ["inset(100% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] }, { duration: 0.85, ease: EASE }).then(() => {
      covered.current = true;
      consumePendingNavigation();
    });
    if (mark.current) animate(mark.current, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] });
  }, [transitioning]);

  useEffect(() => {
    if (!covered.current || !ref.current) return;
    covered.current = false;
    window.scrollTo(0, 0);
    const el = ref.current;
    const run = async () => {
      await new Promise((r) => setTimeout(r, 180));
      ScrollTrigger.refresh();
      if (mark.current) animate(mark.current, { opacity: 0, y: -16 }, { duration: 0.4 });
      await animate(el, { clipPath: ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"] }, { duration: 0.95, ease: EASE });
      el.style.visibility = "hidden";
      experience.set({ transitioning: false });
    };
    run();
  }, [pathname]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="paper-fibre pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-paper"
      style={{ visibility: "hidden", clipPath: "inset(100% 0% 0% 0%)" }}
    >
      <span ref={mark} className="display text-[clamp(3rem,9vw,8rem)] opacity-0">
        Italia
      </span>
    </div>
  );
}
