import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { sans } from "./fonts";

export type Word = { text: string; start: number; end: number };

/** Wörter zu Zeilen bündeln: höchstens `max` Wörter, neue Zeile nach Satzzeichen oder Pause. */
const group = (words: Word[], max: number) => {
  const lines: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length >= max || /[.,!?]$/.test(w.text) || !next || next.start - w.end > 0.5) {
      lines.push(cur);
      cur = [];
    }
  });
  return lines;
};

/** Wortgenaue Untertitel im Karaoke-Stil: das gesprochene Wort leuchtet in der Akzentfarbe. */
export const Captions: React.FC<{
  words: Word[];
  y?: number;
  accent?: string;
  maxWords?: number;
  /** Zeitfenster (Sekunden), in denen keine Untertitel erscheinen, z. B. unter Hook oder Endcard. */
  hide?: [number, number][];
}> = ({ words, y = 1300, accent = "#ffd60a", maxWords = 3, hide = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (hide.some(([a, b]) => t >= a && t < b)) return null;
  const line = group(words, maxWords).find((l) => t >= l[0].start - 0.05 && t < l[l.length - 1].end + 0.25);
  if (!line) return null;
  const pop = Math.min(1, (t - line[0].start + 0.05) / 0.12);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: y,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.1,
          color: "white",
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 6px 18px rgba(0,0,0,0.55)",
          transform: `scale(${0.9 + 0.1 * pop})`,
        }}
      >
        {line.map((w, i) => (
          <span key={i} style={{ color: t >= w.start && t < w.end + 0.1 ? accent : "white" }}>
            {w.text}
            {i < line.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
