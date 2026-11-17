import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, p, useTime } from "../lib/util";

export type MagnifierProps = FxProps & {
  /** Was vergrößert wird (Pixel im Video) und wo die Lupe sitzt (Standard: genau darüber). */
  target?: { x: number; y: number };
  at?: { x: number; y: number };
  radius?: number;
  zoom?: number;
};

/** Lupe: eine runde Glaslinse ploppt auf und vergrößert die Stelle, auf die gezeigt wird. Nie aufs Gesicht legen. */
export const Magnifier: React.FC<MagnifierProps> = ({
  video,
  trimBefore = 0,
  dur,
  target = { x: 860, y: 400 },
  at,
  radius = 170,
  zoom = 2.1,
}) => {
  const t = useTime();
  const pos = at ?? target;
  const k = p(t, 0, 0.3, backOut);
  const out = p(t, dur - 0.22, dur, easeIn);
  const r = radius * (0.2 + 0.8 * k) * (1 - 0.6 * out);
  // Leichtes Atmen der Vergrößerung, damit die Lupe lebendig wirkt.
  const z = zoom * (1 + 0.03 * Math.sin(t * 6));
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ background: `radial-gradient(circle ${radius * 2.2}px at ${pos.x}px ${pos.y}px, transparent 40%, rgba(0,0,0,${0.35 * k * (1 - out)}) 100%)` }} />
      <div
        style={{
          position: "absolute",
          left: pos.x - r,
          top: pos.y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          overflow: "hidden",
          opacity: 1 - out,
          border: "10px solid rgba(255,255,255,0.92)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: r - target.x * z,
            top: r - target.y * z,
            width: 1080,
            height: 1920,
            transform: `scale(${z})`,
            transformOrigin: "0 0",
          }}
        >
          <Base src={video} trimBefore={trimBefore} />
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 35%)" }} />
      </div>
    </AbsoluteFill>
  );
};
