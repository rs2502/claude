import React from "react";
import { AbsoluteFill } from "remotion";
import { sans } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { easeIn, easeOut, p, useTime } from "../lib/util";

export type BackdropWordProps = FxProps & {
  word?: string;
  /** Hintergrundfarbe hinter der Person. */
  bg?: string;
  color?: string;
  rows?: number;
};

/** Backdrop Word: der Hintergrund wird zu einer Wand aus einem riesigen Wort, Zeilen laufen gegeneinander. Braucht den Freisteller. */
export const BackdropWord: React.FC<BackdropWordProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  word = "CIAO",
  bg = "#c8102e",
  color = "#fbf3e4",
  rows = 7,
}) => {
  const t = useTime();
  const k = Math.min(p(t, 0, 0.3, easeOut), 1 - p(t, dur - 0.25, dur, easeIn));
  const rowH = 1920 / rows;
  const fontSize = rowH * 1.02;
  const line = Array.from({ length: 8 }, () => word.toUpperCase()).join(" ");
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <AbsoluteFill style={{ background: bg, opacity: k, overflow: "hidden" }}>
        {Array.from({ length: rows }).map((_, r) => {
          const dir = r % 2 ? 1 : -1;
          const filled = r % 2 === 0;
          const shift = dir * (t * 260 + r * 170) - 1200;
          return (
            <div
              key={r}
              style={{
                position: "absolute",
                top: r * rowH - fontSize * 0.1,
                left: shift,
                whiteSpace: "nowrap",
                fontFamily: sans,
                fontWeight: 900,
                fontSize,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: filled ? color : "transparent",
                WebkitTextStroke: filled ? undefined : `4px ${color}`,
                opacity: p(t, r * 0.03, r * 0.03 + 0.25),
                transform: `translateY(${(1 - p(t, r * 0.03, r * 0.03 + 0.35, easeOut)) * 60}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </AbsoluteFill>
      <Cutout src={cutout} trimBefore={trimBefore} />
    </AbsoluteFill>
  );
};
