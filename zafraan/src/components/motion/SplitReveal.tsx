"use client";

import SplitType from "split-type";
import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** words: rise from line masks · lines: whole lines · chars: letters, independently */
  by?: "words" | "lines" | "chars";
  /** Scroll window. Every reveal is scrubbed to scroll, never time-triggered. */
  start?: string;
  end?: string;
  /** Use an explicit trigger (e.g. a pinned stage) instead of the element. */
  trigger?: string;
  stagger?: number;
  /** Start animation when `play` flips true instead of on scroll (hero entrance). */
  play?: boolean;
  delay?: number;
  id?: string;
};

/**
 * SplitType + GSAP. Lines become overflow masks; words/letters rise into
 * them with a small rotation so the motion reads as set type, not a fade.
 * The element keeps its original text as an aria-label for screen readers.
 */
export function SplitReveal({
  as = "p",
  children,
  className,
  by = "words",
  start = "top 88%",
  end = "top 42%",
  trigger,
  stagger,
  play,
  delay = 0,
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (play === false) {
      gsap.set(el, { autoAlpha: 0 });
      return;
    }

    let split: SplitType | null = null;
    let tween: gsap.core.Tween | null = null;
    let width = el.offsetWidth;
    const text = el.textContent ?? "";

    const build = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
      split = new SplitType(el, {
        types: by === "chars" ? "lines,words,chars" : "lines,words",
        lineClass: "split-line",
        wordClass: "split-word",
        charClass: "split-char",
      });
      // Visual lines are hidden from AT; a single sr-only copy reads naturally.
      el.querySelectorAll(".split-line").forEach((l) => l.setAttribute("aria-hidden", "true"));
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = text;
      el.appendChild(sr);
      gsap.set(el, { autoAlpha: 1 });

      const targets = by === "chars" ? split.chars : by === "lines" ? split.lines : split.words;
      if (!targets?.length) return;

      const from = { yPercent: 115, rotate: by === "lines" ? 0 : 4, transformOrigin: "0% 100%" };
      const each = stagger ?? (by === "chars" ? 0.025 : by === "words" ? 0.04 : 0.12);

      if (play) {
        tween = gsap.fromTo(targets, from, {
          yPercent: 0,
          rotate: 0,
          duration: 1.4,
          ease: "expo.out",
          stagger: each,
          delay,
        });
      } else {
        tween = gsap.fromTo(targets, from, {
          yPercent: 0,
          rotate: 0,
          ease: "none",
          stagger: each,
          scrollTrigger: {
            trigger: trigger ?? el,
            start,
            end,
            scrub: 0.8,
          },
        });
      }
    };

    // Fonts change line breaks; split only after they are ready.
    let cancelled = false;
    document.fonts.ready.then(() => !cancelled && build());

    const ro = new ResizeObserver(() => {
      if (Math.abs(el.offsetWidth - width) < 2) return;
      width = el.offsetWidth;
      build();
      ScrollTrigger.refresh();
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      ro.disconnect();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [by, start, end, trigger, stagger, play, delay]);

  return createElement(as, { ref, className: cn(className), id }, children);
}
