"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { nav } from "@/lib/content";
import { useExperience } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TransitionLink } from "./TransitionLink";
import { useLenis } from "@/components/motion/SmoothScroll";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const progress = useRef<HTMLSpanElement>(null);
  const loaded = useExperience((s) => s.loaded);
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`;
        setHidden(self.direction === 1 && self.scroll() > 240);
      },
    });
    return () => st.kill();
  }, [pathname]);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, lenis]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-canvas">
        Skip to content
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-[var(--ease-editorial)]",
          (hidden && !open) || !loaded ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left bg-ink/70" ref={progress} style={{ transform: "scaleX(0)" }} />
        <div className="container-editorial flex h-[var(--header-h)] items-center justify-between">
          <TransitionLink href="/" className="group flex items-baseline gap-3 rounded-full bg-canvas/95 px-5 py-2.5 shadow-soft" aria-label="Zafraan — home">
            <span className="display text-[1.35rem] leading-none tracking-[-0.02em]">
              <span className="display-italic">Z</span>afraan
            </span>
            <span className="eyebrow hidden text-[0.6rem] text-ink-mute lg:inline">Est. Lucknow 1924</span>
          </TransitionLink>

          <nav aria-label="Primary" className="hidden rounded-full bg-canvas/95 px-3 py-2 shadow-soft md:block">
            <ul className="flex items-center">
              {nav.map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} className="block px-4 py-1.5 text-[0.8125rem] text-ink-soft transition-colors hover:text-ink">
                    <span className="link-grow">{item.label}</span>
                  </TransitionLink>
                </li>
              ))}
              <li>
                <TransitionLink href="/#reserve" className="ml-2 block rounded-full bg-ink px-5 py-2 text-[0.8125rem] text-canvas transition-colors duration-500 hover:bg-saffron">
                  Reserve
                </TransitionLink>
              </li>
            </ul>
          </nav>

          <button
            type="button"
            className="rounded-full bg-canvas/95 px-5 py-3 text-[0.8125rem] shadow-soft md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="paper-fibre fixed inset-0 z-40 flex flex-col justify-end bg-paper px-[var(--gutter)] pb-10 pt-28 md:hidden"
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {[...nav, { label: "Reserve", href: "/#reserve" }].map((item, i) => (
                <li key={item.href} className="overflow-clip">
                  <motion.div initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: EASE }}>
                    <TransitionLink href={item.href} onClick={() => setOpen(false)} className="display flex items-baseline justify-between border-b border-line py-3 text-[2.75rem]">
                      {item.label}
                      <span className="folio text-ink-mute">0{i + 1}</span>
                    </TransitionLink>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
