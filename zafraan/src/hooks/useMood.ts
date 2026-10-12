"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { experience, type Mood } from "@/lib/store";

/** While this section owns the centre of the viewport, it sets the scene mood. */
export function useMood(ref: RefObject<HTMLElement | null>, mood: Mood) {
  useEffect(() => {
    if (!ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: (self) => self.isActive && experience.set({ mood }),
    });
    return () => st.kill();
  }, [ref, mood]);
}
