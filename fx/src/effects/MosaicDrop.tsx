import React from "react";
import { AbsoluteFill } from "remotion";
import { Base, FxProps, GridBg, Tile } from "../lib/layers";
import { backOut, easeInOut, p, useTime } from "../lib/util";

const COLS = 4;
const ROWS = 7;
const GAP = 14;
const TW = (1080 - GAP * (COLS + 1)) / COLS;
const TH = (1920 - GAP * (ROWS + 1)) / ROWS;

/** 02 Mosaic Drop: Raster-Hintergrund, dann fallen Kacheln von oben und füllen das Bild (Übergang). */
export const MosaicDrop: React.FC<FxProps> = ({ video, trimBefore = 0, dur, tiles }) => {
  const t = useTime();
  const top = 700 * p(t, 0, 0.3, easeInOut); // Video rutscht nach unten, oben erscheint das Raster
  const zoom = 1 + 0.05 * p(t, 0.9, dur, easeInOut);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <GridBg />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top,
          height: 1920,
          WebkitMaskImage: "linear-gradient(180deg, transparent 0, black 160px)",
          maskImage: "linear-gradient(180deg, transparent 0, black 160px)",
        }}
      >
        <Base src={video} trimBefore={trimBefore} style={{ objectPosition: "50% 20%" }} />
      </div>
      <AbsoluteFill style={{ perspective: 1600, transform: `scale(${zoom})` }}>
        {Array.from({ length: COLS * ROWS }).map((_, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          const delay = 0.3 + row * 0.06 + Math.abs(col - 1.5) * 0.04;
          const d = p(t, delay, delay + 0.45, backOut);
          if (t < delay) return null;
          return (
            <Tile
              key={k}
              i={k * 5 + 3}
              tiles={tiles}
              titleSize={28}
              style={{
                left: GAP + col * (TW + GAP),
                top: GAP + row * (TH + GAP),
                width: TW,
                height: TH,
                opacity: p(t, delay, delay + 0.12),
                transform: `translateY(${(1 - d) * -900}px) rotateX(${(1 - d) * 55}deg)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
