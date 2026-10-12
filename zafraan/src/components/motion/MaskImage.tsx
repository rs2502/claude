"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Direction the mask opens from. */
  from?: "bottom" | "top" | "center" | "left";
  start?: string;
  end?: string;
  /** Extra parallax travel of the photograph inside its frame (yPercent). */
  drift?: number;
  cursorLabel?: string;
};

const CLIPS = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  center: "inset(50% 50% 50% 50%)",
  left: "inset(0% 100% 0% 0%)",
} as const;

/**
 * Photograph revealed through a clip-path aperture, scrubbed to scroll.
 * The image itself scales from 1.25 and drifts slower than the frame, which
 * is what gives the reveal its depth.
 */
export function MaskImage({
  src,
  alt,
  className,
  sizes,
  priority,
  from = "bottom",
  start = "top 92%",
  end = "top 30%",
  drift = 10,
  cursorLabel = "Probieren",
}: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!frame.current || !inner.current) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        frame.current,
        { clipPath: CLIPS[from] },
        { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: frame.current, start, end, scrub: 0.9 } },
      );
      gsap.fromTo(
        inner.current,
        { scale: 1.25, yPercent: -drift / 2 },
        {
          scale: 1.02,
          yPercent: drift / 2,
          ease: "none",
          scrollTrigger: { trigger: frame.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, [from, start, end, drift]);

  return (
    <div
      ref={frame}
      className={cn("relative overflow-hidden bg-paper [will-change:clip-path]", className)}
      data-cursor="image"
      data-cursor-label={cursorLabel}
    >
      <div ref={inner} className="absolute inset-0 will-change-transform">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    </div>
  );
}
