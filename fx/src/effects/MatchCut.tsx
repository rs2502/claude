import React from "react";
import { AbsoluteFill, random } from "remotion";
import { bodySerif, sans } from "../fonts";
import { useTime } from "../lib/util";

export type MatchCutProps = {
  dur: number;
  /** Das Wort, das auf jeder Seite in der Mitte steht. */
  word?: string;
  /** Sätze, in denen das Wort vorkommt; je Seite einer. */
  contexts?: string[];
  /** Fülltext für die unscharfen Zeilen darüber und darunter. */
  filler?: string;
  /** Sekunden pro Seite. */
  pageDur?: number;
};

const LOOKS = [
  { bg: "#f1efea", fg: "#1b1b1b", font: bodySerif },
  { bg: "#e8e8e8", fg: "#202020", font: sans },
  { bg: "#151515", fg: "#ececec", font: bodySerif },
  { bg: "#f6f1e6", fg: "#151515", font: bodySerif },
  { bg: "#dcdcdc", fg: "#1a1a1a", font: sans },
];

const DEFAULT_CONTEXTS = [
  "dann kommt der Schnitt. Und",
  "jeder Schnitt sitzt genau",
  "ohne Schnitt kein Reel, das",
  "der harte Schnitt auf das Wort",
  "ein Schnitt pro Satz, mehr",
  "so wird der Schnitt unsichtbar",
  "beim letzten Schnitt bleibt",
];

const DEFAULT_FILLER =
  "Zehn Jahre Videos, Reels, Werbung, Kurse. Rohmaterial rein, tote Stellen raus, fertig in zwei Minuten. Jeder Effekt sitzt auf seinem Wort, jede Pause ist weg, der Ton ist sauber und laut genug.";

/** 04 Match Cut: schnelle Folge von Textseiten, immer dasselbe Wort exakt in der Mitte, rot markiert. */
export const MatchCut: React.FC<MatchCutProps> = ({
  word = "Schnitt",
  contexts = DEFAULT_CONTEXTS,
  filler = DEFAULT_FILLER,
  pageDur = 0.16,
}) => {
  const t = useTime();
  const page = Math.floor(t / pageDur);
  const local = (t % pageDur) / pageDur;
  const look = LOOKS[page % LOOKS.length];
  const ctx = contexts[page % contexts.length];
  const idx = ctx.indexOf(word);
  const left = idx >= 0 ? ctx.slice(0, idx) : ctx + " ";
  const right = idx >= 0 ? ctx.slice(idx + word.length) : "";
  const words = filler.split(" ");
  const rot = (random(`r${page}`) - 0.5) * 3;
  const fs = 118;
  const line = (d: number) => {
    const start = Math.floor(random(`l${page}-${d}`) * words.length);
    return Array.from({ length: 9 }, (_, k) => words[(start + k) % words.length]).join(" ");
  };
  return (
    <AbsoluteFill style={{ background: look.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 - 0.06 * local}) rotate(${rot}deg)` }}>
        {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((d) => (
          <div
            key={d}
            style={{
              position: "absolute",
              left: -300 + (random(`x${page}-${d}`) - 0.5) * 300,
              top: 960 + d * 150 - 60,
              whiteSpace: "nowrap",
              fontFamily: look.font,
              fontSize: 84,
              color: look.fg,
              opacity: 0.85,
              filter: `blur(${Math.abs(d) * 2.2}px)`,
            }}
          >
            {line(d)}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 960 - fs * 0.7,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            fontFamily: look.font,
            fontWeight: 700,
            fontSize: fs,
            color: look.fg,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ overflow: "hidden", textAlign: "right", filter: "blur(0.6px)" }}>{left}</div>
          <div
            style={{
              background: "#b3321f",
              color: "white",
              padding: "0 22px 6px",
              borderRadius: 6,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            {word}
          </div>
          <div style={{ overflow: "hidden", textAlign: "left", filter: "blur(0.6px)" }}>{right}</div>
        </div>
      </AbsoluteFill>
      {/* Randunschärfe wie bei offener Blende */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 45%, ${look.bg}aa 100%)` }} />
    </AbsoluteFill>
  );
};
