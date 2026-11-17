import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, Cutout, FxProps, Tile } from "../lib/layers";
import { DEFAULT_FACE, backOut, easeIn, p, useTime } from "../lib/util";

const COLS = 5;
const ROWS = 8;
const TW = 236;
const TH = 300;
const GAP = 14;

/** 06 Hall of Fame: hinter der Person erscheint eine Wand aus Thumbnails. Braucht den Freisteller. */
export const HallOfFame: React.FC<FxProps> = ({ video, cutout, trimBefore = 0, dur, tiles, face = DEFAULT_FACE }) => {
  const t = useTime();
  const out = p(t, dur - 0.3, dur, easeIn);
  const drift = -t * 30;
  const gridW = COLS * TW + (COLS - 1) * GAP;
  const gridH = ROWS * TH + (ROWS - 1) * GAP;
  const ox = 540 - gridW / 2;
  const oy = 960 - gridH / 2 + drift;
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill
        style={{
          // Ohne Freisteller bleibt die Mitte frei, damit die Person sichtbar bleibt.
          WebkitMaskImage: cutout ? undefined : "radial-gradient(ellipse 34% 40% at 50% 45%, transparent 60%, black 100%)",
          maskImage: cutout ? undefined : "radial-gradient(ellipse 34% 40% at 50% 45%, transparent 60%, black 100%)",
        }}
      >
        {Array.from({ length: COLS * ROWS }).map((_, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          const x = ox + col * (TW + GAP);
          const y = oy + row * (TH + GAP);
          const dist = Math.hypot(x + TW / 2 - face.x, y + TH / 2 - face.y) / 1100;
          const d = p(t, dist * 0.5, dist * 0.5 + 0.35, backOut);
          const vis = Math.min(d, 1 - out);
          return (
            <Tile
              key={k}
              i={k * 3 + 1}
              tiles={tiles}
              titleSize={26}
              style={{ left: x, top: y, width: TW, height: TH, opacity: vis, transform: `scale(${0.6 + 0.4 * d})` }}
            />
          );
        })}
      </AbsoluteFill>
      <Cutout src={cutout} trimBefore={trimBefore} />
    </AbsoluteFill>
  );
};
