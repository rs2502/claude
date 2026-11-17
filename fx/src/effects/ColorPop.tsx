import React from "react";
import { AbsoluteFill } from "remotion";
import { sans } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { DEFAULT_FACE, easeIn, easeOut, p, useTime } from "../lib/util";

export type ColorPopProps = FxProps & { kicker?: string; word?: string };

/** 15 Color Pop: Hintergrund wird grau, die Person bleibt farbig, dahinter ein großes Wort mit Unterzeile. */
export const ColorPop: React.FC<ColorPopProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  face = DEFAULT_FACE,
  kicker = "ALS VIDEO-EDITOR",
  word = "10 JAHRE",
}) => {
  const t = useTime();
  const gray = Math.min(p(t, 0, 0.3), 1 - p(t, dur - 0.3, dur, easeIn));
  const inK = p(t, 0.1, 0.55, easeOut);
  const outK = p(t, dur - 0.4, dur, easeIn);
  const fontSize = Math.min(240, (1080 * 1.0) / (word.length * 0.6));
  const y = cutout ? face.y - 190 : face.y - 480;
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} style={{ filter: `grayscale(${gray}) brightness(${1 - 0.15 * gray})` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y - fontSize / 2 - 70,
          textAlign: "center",
          color: "white",
          fontFamily: sans,
          opacity: inK * (1 - outK),
          filter: `blur(${(1 - inK) * 24 + outK * 24}px)`,
          transform: `scale(${1.12 - 0.12 * inK})`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.35em", opacity: 0.8, marginBottom: 18 }}>{kicker}</div>
        <div style={{ fontSize, fontWeight: 900, lineHeight: 1, letterSpacing: `${-0.02 + (1 - inK) * 0.15}em`, whiteSpace: "nowrap", textShadow: "0 10px 40px rgba(0,0,0,0.35)" }}>
          {word}
        </div>
      </div>
      <Cutout src={cutout} trimBefore={trimBefore} />
    </AbsoluteFill>
  );
};
