import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, FxProps, GridBg, Tile } from "../lib/layers";
import { easeIn, easeInOut, easeOut, p, useTime } from "../lib/util";

/** 11 The Arena: oben fliegt ein gebogener Rang aus Video-Karten heran, unten läuft das Video. */
export const Arena: React.FC<FxProps & { count?: number }> = ({ video, trimBefore = 0, dur, tiles, count = 11 }) => {
  const t = useTime();
  const split = p(t, 0, 0.3, easeInOut);
  const fly = p(t, 0.15, 0.85, easeOut);
  const out = p(t, dur - 0.3, dur, easeIn);
  const R = 700;
  const spin = -6 + t * 6;
  const top = 960 * split;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GridBg />
      <div
        style={{
          position: "absolute",
          left: 540,
          top: 470,
          width: 0,
          height: 0,
          perspective: 900,
          opacity: Math.min(p(t, 0.15, 0.35), 1 - out),
        }}
      >
        <div style={{ transformStyle: "preserve-3d", transform: `translateZ(${-2600 * (1 - fly)}px) rotateX(4deg)` }}>
          {Array.from({ length: count }).map((_, k) => {
            const a = (k - (count - 1) / 2) * 27 + spin;
            return (
              <Tile
                key={k}
                i={k * 2 + 5}
                tiles={tiles}
                titleSize={24}
                style={{
                  left: -190,
                  top: -330,
                  width: 380,
                  height: 660,
                  // Innenseite eines Zylinders: Karten schauen zur Kamera.
                  transform: `rotateY(${a}deg) translateZ(${-R}px)`,
                  backfaceVisibility: "hidden",
                  border: k % 4 === 1 ? "4px solid #ef4444" : "2px solid rgba(255,255,255,0.25)",
                }}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top,
          height: 1920,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0, black 90px)",
          maskImage: "linear-gradient(180deg, transparent 0, black 90px)",
        }}
      >
        <Base src={video} trimBefore={trimBefore} style={{ height: 1920, objectPosition: "50% 0%", transform: `translateY(${-260 * split}px)` }} />
      </div>
    </AbsoluteFill>
  );
};
