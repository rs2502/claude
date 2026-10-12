"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Visible description for assistive tech lives in the section copy. */
  label?: string;
  /** Marks the film the loader waits for. */
  hero?: boolean;
  /** Only for the hero: render src server-side so it downloads immediately. */
  src?: string;
  /** Standbild, bis der Film läuft (und falls das Handy Autoplay blockiert). */
  poster?: string;
};

/**
 * Presentation-only <video>. It never autoplays and has no controls; its
 * playhead is owned by useScrubVideo. Without JS it simply stays blank on
 * the paper colour, which keeps layout stable (no CLS — it always fills an
 * absolutely-sized parent).
 */
export const ScrubVideo = forwardRef<HTMLVideoElement, Props>(function ScrubVideo({ className, label, hero, src, poster }, ref) {
  return (
    <video
      ref={ref}
      data-hero={hero ? "" : undefined}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      src={src}
      poster={poster}
      preload={src ? "auto" : "none"}
      tabIndex={-1}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      style={{ transform: "translateZ(0)" }}
    />
  );
});
