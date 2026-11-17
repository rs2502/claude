import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, Cutout, FxProps, Tile } from "../lib/layers";
import { DEFAULT_FACE, backOut, envelope, p, useTime } from "../lib/util";

/** 03 Halo: ein Ring aus Karten dreht sich auf Kopfhöhe hinter der Person. Braucht den Freisteller. */
export const Halo: React.FC<FxProps & { count?: number }> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  tiles,
  face = DEFAULT_FACE,
  count = 10,
}) => {
  const t = useTime();
  const e = envelope(t, dur, 0.35, 0.3);
  const grow = p(t, 0, 0.5, backOut);
  const spin = -t * 38;
  const R = 520;
  const cy = face.y - 20;
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <div
        style={{
          position: "absolute",
          left: face.x,
          top: cy,
          width: 0,
          height: 0,
          perspective: 2000,
          perspectiveOrigin: "0 -500px",
          opacity: e,
        }}
      >
        <div style={{ transformStyle: "preserve-3d", transform: `scale(${0.4 + 0.6 * grow}) rotateX(-8deg)` }}>
          {Array.from({ length: count }).map((_, k) => {
            const a = (360 / count) * k + spin;
            const front = Math.cos((a * Math.PI) / 180); // 1 = vorne (wird vom Freisteller verdeckt)
            return (
              <Tile
                key={k}
                i={k + 2}
                tiles={tiles}
                titleSize={22}
                style={{
                  left: -100,
                  top: -140,
                  width: 200,
                  height: 280,
                  transform: `rotateY(${a}deg) translateZ(${R}px)`,
                  filter: `brightness(${0.55 + 0.45 * (1 - front) / 2 + 0.45 * Math.max(0, front)})`,
                  border: "2px solid rgba(120,190,255,0.7)",
                  boxShadow: "0 0 30px rgba(60,140,255,0.5)",
                }}
              />
            );
          })}
        </div>
      </div>
      <Cutout src={cutout} trimBefore={trimBefore} />
    </AbsoluteFill>
  );
};
