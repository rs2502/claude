"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Mode = "default" | "link" | "image" | "text";

/**
 * A point and a ring. The point is exact; the ring follows with weight.
 * Over links the ring opens; over food photography it becomes a lens with a
 * word in it. Only mounted for fine pointers — touch keeps native behaviour.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("has-cursor");

    const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power2.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power2.out" });
    const rx = gsap.quickTo(r, "x", { duration: reduce ? 0.01 : 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: reduce ? 0.01 : 0.5, ease: "power3.out" });

    let mode: Mode = "default";
    let visible = false;

    const setMode = (next: Mode, text = "") => {
      if (next === mode && l.textContent === text) return;
      mode = next;
      l.textContent = text;
      const size = next === "image" ? 96 : next === "link" ? 56 : next === "text" ? 4 : 32;
      gsap.to(r, {
        width: size,
        height: size,
        backgroundColor: next === "image" ? "rgba(250,250,248,0.92)" : "rgba(250,250,248,0)",
        borderColor: next === "image" ? "rgba(43,35,32,0)" : "rgba(43,35,32,0.45)",
        duration: 0.6,
        ease: "expo.out",
      });
      gsap.to(d, { scale: next === "default" ? 1 : 0, duration: 0.35, ease: "power3.out" });
      gsap.to(l, { opacity: next === "image" ? 1 : 0, scale: next === "image" ? 1 : 0.6, duration: 0.5, ease: "expo.out" });
    };

    const move = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.4 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);

      const t = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button, input, select, textarea, label");
      if (!t) return setMode("default");
      const kind = t.dataset.cursor as Mode | undefined;
      if (kind === "image") return setMode("image", t.dataset.cursorLabel ?? "View");
      if (t.matches("input, textarea")) return setMode("text");
      setMode("link");
    };
    const leave = () => {
      visible = false;
      gsap.to([d, r], { opacity: 0, duration: 0.3 });
    };
    const down = () => gsap.to(r, { scale: 0.86, duration: 0.25, ease: "power3.out" });
    const up = () => gsap.to(r, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div
        ref={ring}
        className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-ink/45 opacity-0 will-change-transform"
        style={{ translate: "-50% -50%" }}
      >
        <span ref={label} className="display-italic text-[0.95rem] text-ink opacity-0">
          View
        </span>
      </div>
      <div ref={dot} className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full bg-ink opacity-0 will-change-transform" style={{ translate: "-50% -50%" }} />
    </div>
  );
}
