import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { sans } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { backOut, p, useTime } from "../lib/util";

export type GiantCaptionsProps = FxProps & {
  /** Wörter mit Zeiten in Sekunden im ganzen Video (wie aus Whisper). */
  words?: { text: string; start: number; end: number }[];
  /** Mitte der Wörter (y). */
  y?: number;
  /** Wörter, die in der Akzentfarbe stehen (ohne Satzzeichen, Groß/klein egal). */
  highlight?: string[];
  accent?: string;
  /** Wörter hinter die Person legen (braucht Freisteller). */
  behind?: boolean;
};

const clean = (s: string) => s.replace(/[.,!?:;]/g, "").toLowerCase();

/** Giant Captions: jedes gesprochene Wort erscheint einzeln und bildfüllend groß. */
export const GiantCaptions: React.FC<GiantCaptionsProps> = ({
  video,
  cutout,
  trimBefore = 0,
  words = [],
  y = 1150,
  highlight = [],
  accent = "#ffd60a",
  behind = false,
}) => {
  const t = useTime();
  const { fps } = useVideoConfig();
  const now = t + trimBefore / fps;
  const idx = words.findIndex((w, i) => now >= w.start && now < (words[i + 1]?.start ?? w.end + 0.3));
  const w = idx >= 0 ? words[idx] : undefined;
  const text = w ? w.text.replace(/[,.]$/, "").toUpperCase() : "";
  const fontSize = Math.min(330, (1080 * 0.92) / Math.max(1, text.length * 0.66));
  const k = w ? p(now, w.start, w.start + 0.14, backOut) : 0;
  const hot = w ? highlight.map(clean).includes(clean(w.text)) : false;
  const label = (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y - fontSize / 2,
        textAlign: "center",
        fontFamily: sans,
        fontWeight: 900,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: hot ? accent : "white",
        WebkitTextStroke: behind ? undefined : "6px rgba(0,0,0,0.9)",
        paintOrder: "stroke fill",
        textShadow: "0 12px 40px rgba(0,0,0,0.45)",
        transform: `scale(${1.25 - 0.25 * k})`,
        opacity: k,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      {behind ? label : null}
      {behind ? <Cutout src={cutout} trimBefore={trimBefore} /> : label}
    </AbsoluteFill>
  );
};
