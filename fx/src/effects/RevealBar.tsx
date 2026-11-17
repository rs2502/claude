import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, FxProps } from "../lib/layers";
import { easeInOut, p, useTime } from "../lib/util";

/** 16 Reveal Bar: das Bild wird schwarz-weiß, ein Lichtbalken fährt durch und bringt die Farbe zurück. */
export const RevealBar: React.FC<FxProps> = ({ video, trimBefore = 0, dur }) => {
  const t = useTime();
  const gray = p(t, 0, 0.15);
  const x = p(t, 0.25, dur - 0.1, easeInOut) * 1180 - 50; // Balkenmitte in px
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} style={{ filter: `grayscale(${gray}) contrast(1.05)` }} />
      <AbsoluteFill style={{ clipPath: `inset(0 ${Math.max(0, 1080 - x)}px 0 0)` }}>
        <Base src={video} trimBefore={trimBefore} style={{ filter: "saturate(1.15)" }} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: -100,
          bottom: -100,
          left: x - 60,
          width: 120,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85) 45%, white 50%, rgba(255,255,255,0.85) 55%, transparent)",
          filter: "blur(10px)",
          mixBlendMode: "screen",
          opacity: t > 0.25 && t < dur - 0.1 ? 1 : 0,
        }}
      />
    </AbsoluteFill>
  );
};
