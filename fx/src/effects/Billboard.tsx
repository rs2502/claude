import React from "react";
import { AbsoluteFill } from "remotion";
import { sans } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { DEFAULT_FACE, backOut, easeIn, p, useTime } from "../lib/util";

/** 08 Billboard: ein riesiges Wort steht auf Kopfhöhe hinter der Person. Braucht den Freisteller. */
export const Billboard: React.FC<FxProps & { word?: string; /** Mitte des Worts (y). */ y?: number }> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  face = DEFAULT_FACE,
  word = "BILLBOARD",
  y: yProp,
}) => {
  const t = useTime();
  const out = p(t, dur - 0.3, dur, easeIn);
  const letters = word.toUpperCase().split("");
  const fontSize = Math.min(300, (1080 * 1.08) / (letters.length * 0.66));
  // Ohne Freisteller unter das Kinn, damit das Gesicht frei bleibt.
  const y = yProp ?? (cutout ? face.y - fontSize * 0.25 : face.y + 330);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      <div
        style={{
          position: "absolute",
          left: -40,
          right: -40,
          top: y - fontSize / 2,
          display: "flex",
          justifyContent: "center",
          fontFamily: sans,
          fontWeight: 900,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "white",
          textShadow: "0 0 40px rgba(255,255,255,0.35), 0 8px 30px rgba(0,0,0,0.35)",
          opacity: 1 - out,
          filter: `blur(${out * 12}px)`,
        }}
      >
        {letters.map((ch, i) => {
          const k = p(t, i * 0.035, i * 0.035 + 0.4, backOut);
          return (
            <span
              key={i}
              style={{ display: "inline-block", opacity: p(t, i * 0.035, i * 0.035 + 0.15), transform: `translateY(${(1 - k) * 80}px) scale(${1.2 - 0.2 * k})` }}
            >
              {ch === " " ? " " : ch}
            </span>
          );
        })}
      </div>
      <Cutout src={cutout} trimBefore={trimBefore} />
    </AbsoluteFill>
  );
};
