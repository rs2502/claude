"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Pulls its child toward the pointer — a quarter of the distance, never
 * more — and lets go on a soft spring. The inner label travels further than
 * the shell, which reads as depth rather than wobble.
 */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const shell = el.firstElementChild as HTMLElement | null;
    const label = el.querySelector<HTMLElement>("[data-magnetic-label]");
    if (!shell) return;

    const xs = gsap.quickTo(shell, "x", { duration: 0.6, ease: "power3.out" });
    const ys = gsap.quickTo(shell, "y", { duration: 0.6, ease: "power3.out" });
    const xl = label && gsap.quickTo(label, "x", { duration: 0.6, ease: "power3.out" });
    const yl = label && gsap.quickTo(label, "y", { duration: 0.6, ease: "power3.out" });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xs(dx * strength);
      ys(dy * strength);
      xl?.(dx * strength * 0.5);
      yl?.(dy * strength * 0.5);
    };
    const leave = () => {
      gsap.to([shell, label].filter(Boolean), { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.55)", overwrite: true });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={className ?? "inline-block p-3 -m-3"}>
      {children}
    </span>
  );
}
