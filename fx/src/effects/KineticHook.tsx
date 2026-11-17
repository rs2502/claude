import React from "react";
import { AbsoluteFill } from "remotion";
import { sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, p, useTime } from "../lib/util";

export type KineticHookProps = FxProps & {
  /** Wörter mit Zeitpunkt (Sekunden ab Effektstart); `hit` = Hauptwort mit Einschlag. */
  words?: { text: string; at: number; hit?: boolean }[];
  /** Oberkante des Textblocks. */
  y?: number;
  accent?: string;
};

/** Hook: Wörter kleben nacheinander als Papierstreifen ins Bild, das Hauptwort schlägt mit Wackler und Blitz ein. */
export const KineticHook: React.FC<KineticHookProps> = ({
  video,
  trimBefore = 0,
  dur,
  words = [
    { text: "WIEDER", at: 0 },
    { text: "RICHTIG", at: 0.4 },
    { text: "ZUGESCHLAGEN!", at: 0.9, hit: true },
  ],
  y = 330,
  accent = "#d7262e",
}) => {
  const t = useTime();
  const out = p(t, dur - 0.25, dur, easeIn);
  const hit = words.find((w) => w.hit);
  const since = hit ? t - hit.at : -1;
  const shake = since >= 0 && since < 0.35 ? (1 - since / 0.35) * 22 : 0;
  const flash = since >= 0 && since < 0.12 ? 0.55 * (1 - since / 0.12) : 0;
  const punch = since >= 0 ? 1 + 0.06 * Math.max(0, 1 - since / 0.4) : 1;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${Math.sin(t * 90) * shake}px, ${Math.cos(t * 77) * shake}px) scale(${punch})`,
        }}
      >
        <Base src={video} trimBefore={trimBefore} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: 1 - out,
          transform: `translate(${Math.sin(t * 90) * shake * 0.6}px, ${-out * 60}px)`,
        }}
      >
        {words.map((w, i) => {
          if (t < w.at) return <div key={i} style={{ height: w.hit ? 150 : 110 }} />;
          const k = p(t, w.at, w.at + (w.hit ? 0.22 : 0.3), backOut);
          const rot = w.hit ? -2 : i % 2 ? 3 : -3;
          return (
            <div
              key={i}
              style={{
                fontFamily: sans,
                fontWeight: 900,
                fontSize: w.hit ? 128 : 92,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                padding: w.hit ? "14px 30px 18px" : "10px 26px 14px",
                background: w.hit ? accent : "#fbf8f1",
                color: w.hit ? "white" : "#141414",
                boxShadow: "0 14px 0 rgba(0,0,0,0.18), 0 20px 50px rgba(0,0,0,0.35)",
                transform: `rotate(${rot}deg) scale(${w.hit ? 1.8 - 0.8 * k : 0.6 + 0.4 * k})`,
                opacity: p(t, w.at, w.at + 0.06),
              }}
            >
              {w.text}
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};
