import React from "react";
import { AbsoluteFill } from "remotion";
import { bodySerif, masthead, mono, sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { backOut, easeIn, easeInOut, p, useTime } from "../lib/util";

export type HeadlineProps = FxProps & {
  paper?: string;
  date?: string;
  kicker?: string;
  /** Überschrift; der Teil in [eckigen Klammern] wird rot eingekreist. */
  headline?: string;
  byline?: string;
  /**
   * Fließtext. Markierungen: [[g:Text]] gelb, [[b:Text]] blau, [[r:Text]] roter Rahmen.
   * Sie erscheinen in der Reihenfolge, in der sie im Text stehen.
   */
  body?: string;
};

const DEFAULT_BODY =
  "Hier sind [[g:16 Video-Effekte auf Steroiden]]. Teardown. Mosaic Drop. Halo. Match Cut. The Dealer. Hall of Fame. Rabbit Hole. Billboard. Liquid Glass. Prompt Drop. The Arena. [[g:Headline.]] Split Stage. Frosted. Color Pop. Reveal Bar. [[b:Schreib EDITOR in die Kommentare]] und ich zeige dir die ganze Maschine hinter [[r:meinen letzten 15 Videos]].";

type Part = { text: string; mark?: "g" | "b" | "r"; idx?: number };

const parse = (s: string): Part[] => {
  const parts: Part[] = [];
  const re = /\[\[(g|b|r):([^\]]+)\]\]/g;
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) });
    parts.push({ text: m[2], mark: m[1] as Part["mark"], idx: n++ });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: s.slice(last) });
  return parts;
};

/** 12 Headline: eine Zeitungsseite über dem unscharfen Video, Textstellen werden markiert und eingekreist. */
export const Headline: React.FC<HeadlineProps> = ({
  video,
  trimBefore = 0,
  dur,
  paper = "The Daily Cut",
  date = "DIENSTAG, 17. NOVEMBER 2026",
  kicker = "VIDEO / KI-EDITING",
  headline = "Zehn Jahre als [Video-Editor.]",
  byline = "Von Reinhard",
  body = DEFAULT_BODY,
}) => {
  const t = useTime();
  const enter = p(t, 0, 0.45, backOut);
  const out = p(t, dur - 0.3, dur, easeIn);
  const circle = p(t, 0.45, 0.85, easeInOut);
  const parts = parse(body);
  const marks = parts.filter((x) => x.mark).length;
  const markGap = Math.max(0.2, (dur - 1.0 - 0.4) / Math.max(1, marks));
  const hm = headline.match(/^(.*)\[(.+)\](.*)$/);
  const firstChar = body.replace(/\[\[[gbr]:/, "").charAt(0);
  // Initial: erstes Zeichen aus dem ersten Textteil entfernen.
  const shown = [...parts];
  if (shown.length) shown[0] = { ...shown[0], text: shown[0].text.slice(1) };
  return (
    <AbsoluteFill style={{ background: "#0d0d0d", overflow: "hidden" }}>
      <Base src={video} trimBefore={trimBefore} style={{ filter: "blur(28px) brightness(0.35)", transform: "scale(1.15)" }} />
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 360,
          width: 920,
          padding: "34px 52px 48px",
          background: "#f6f3ea",
          borderRadius: 6,
          boxShadow: "0 40px 90px rgba(0,0,0,0.6)",
          opacity: Math.min(p(t, 0, 0.2), 1 - out),
          transform: `translateY(${(1 - enter) * 160 - out * 200}px) scale(${0.88 + 0.12 * enter}) rotate(-3deg)`,
          color: "#141414",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 15, color: "#666" }}>
          <span>{date}</span>
          <span>KI-AUSGABE</span>
        </div>
        <div style={{ textAlign: "center", fontFamily: masthead, fontWeight: 900, fontSize: 82, margin: "8px 0 4px", letterSpacing: "-0.01em" }}>{paper}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 26,
            borderTop: "2px solid #141414",
            borderBottom: "1px solid #141414",
            padding: "8px 0",
            fontFamily: sans,
            fontSize: 18,
            color: "#333",
          }}
        >
          {["News", "Long Reads", "Reels", "Kurse", "Tools"].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 17, color: "#b3321f", marginTop: 22, letterSpacing: "0.08em" }}>{kicker}</div>
        <div style={{ fontFamily: masthead, fontWeight: 700, fontSize: 54, lineHeight: 1.1, marginTop: 8 }}>
          {hm ? (
            <>
              {hm[1]}
              <span style={{ position: "relative", display: "inline-block" }}>
                {hm[2]}
                <svg style={{ position: "absolute", left: -22, top: -14, width: "calc(100% + 44px)", height: "calc(100% + 28px)", overflow: "visible" }} viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path
                    d="M 14 5 C 45 -3, 97 1, 98 19 C 99 37, 35 43, 8 33 C -3 28, -1 9, 26 3"
                    fill="none"
                    stroke="#c0281b"
                    strokeWidth={1.3}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - circle}
                  />
                </svg>
              </span>
              {hm[3]}
            </>
          ) : (
            headline
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, fontFamily: sans, fontSize: 18, color: "#555" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: "#c9c2b2" }} />
          {byline}
        </div>
        <div style={{ fontFamily: bodySerif, fontSize: 33, lineHeight: 1.42, marginTop: 20 }}>
          <span style={{ float: "left", fontFamily: masthead, fontWeight: 900, fontSize: 132, lineHeight: 0.82, margin: "8px 12px 0 0" }}>{firstChar}</span>
          {shown.map((part, i) => {
            if (!part.mark) return <span key={i}>{part.text}</span>;
            const k = p(t, 0.95 + (part.idx ?? 0) * markGap, 0.95 + (part.idx ?? 0) * markGap + 0.3, easeInOut);
            if (part.mark === "r") {
              return (
                <span key={i} style={{ outline: `3px solid rgba(192,40,27,${k})`, outlineOffset: 3, borderRadius: 3 }}>
                  {part.text}
                </span>
              );
            }
            const color = part.mark === "g" ? "rgba(225,240,30,0.9)" : "rgba(80,170,255,0.65)";
            return (
              <span
                key={i}
                style={{
                  backgroundImage: `linear-gradient(${color}, ${color})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${k * 100}% 100%`,
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                }}
              >
                {part.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
