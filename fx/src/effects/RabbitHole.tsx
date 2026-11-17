import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, Cutout, FxProps } from "../lib/layers";
import { backOut, easeIn, easeOut, p, useTime } from "../lib/util";

export type RabbitHoleProps = FxProps & {
  /** Nächste Szene, in die die Kamera fliegt (Standard: dasselbe Video). */
  next?: string;
  nextTrimBefore?: number;
  /** CSS-Filter für die nächste Szene, z. B. für einen anderen Look. */
  nextFilter?: string;
  /** Bildschirm hinter der Person: Mitte und Größe in Pixeln. */
  screen?: { x: number; y: number; w: number; h: number };
};

/** 07 Rabbit Hole: ein Monitor hinter der Person zeigt die nächste Szene, die Kamera fliegt hinein (Übergang). */
export const RabbitHole: React.FC<RabbitHoleProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  next,
  nextTrimBefore,
  nextFilter = "",
  screen = { x: 330, y: 420, w: 520, h: 320 },
}) => {
  const t = useTime();
  const appear = p(t, 0, 0.35, backOut);
  const zoomStart = dur * 0.4;
  const zoomEnd = dur * 0.85;
  const z = p(t, zoomStart, zoomEnd, easeIn);
  const maxScale = 1920 / screen.h;
  const s = 1 + (maxScale - 1) * z;
  // Bildschirmmitte wandert in die Bildmitte.
  const tx = (540 - screen.x) * z;
  const ty = (960 - screen.y) * z;
  const velocity = p(t, zoomStart, zoomEnd, (x) => Math.sin(x * Math.PI));
  const handoff = p(t, zoomEnd - 0.1, zoomEnd + 0.05);
  const nextSrc = next ?? video;
  const nextTrim = nextTrimBefore ?? trimBefore;
  return (
    <AbsoluteFill style={{ background: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${screen.x}px ${screen.y}px`,
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          filter: `blur(${velocity * 10}px)`,
        }}
      >
        <Base src={video} trimBefore={trimBefore} />
        <div
          style={{
            position: "absolute",
            left: screen.x - screen.w / 2,
            top: screen.y - screen.h / 2,
            width: screen.w,
            height: screen.h,
            borderRadius: 14,
            background: "#0a0a0a",
            border: "10px solid #0d0d0d",
            boxShadow: "0 0 50px rgba(70,150,255,0.55), 0 20px 50px rgba(0,0,0,0.6)",
            overflow: "hidden",
            opacity: appear,
            transform: `scale(${0.7 + 0.3 * appear})`,
          }}
        >
          <Base src={nextSrc} trimBefore={nextTrim} style={{ filter: nextFilter, objectPosition: "50% 30%" }} />
        </div>
        <Cutout src={cutout} trimBefore={trimBefore} style={{ opacity: 1 - p(t, zoomStart, zoomStart + 0.2, easeOut) }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: handoff, transform: `scale(${1.15 - 0.15 * p(t, zoomEnd, dur)})` }}>
        <Base src={nextSrc} trimBefore={nextTrim} style={{ filter: nextFilter }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
