import React from "react";
import { AbsoluteFill } from "remotion";
import { mono, sans } from "../fonts";
import { Base, FxProps, Spark } from "../lib/layers";
import { p, useTime } from "../lib/util";

export type PromptDropProps = FxProps & {
  user?: string;
  prompt?: string;
  file?: string;
  steps?: string[];
};

const DEFAULT_STEPS = [
  "Kamera + Mikro synchron (Versatz 0,93 s)",
  "Rohmaterial 2:08 → 0:41, beste Takes",
  "186 Wörter transkribiert",
  "16 Effekte auf ihre Wörter gelegt",
];

/** 10 Prompt Drop: Vollbild-Terminal von Claude Code – Befehl wird getippt, das Video läuft, Schritte haken sich ab. */
export const PromptDrop: React.FC<PromptDropProps> = ({
  video,
  trimBefore = 0,
  dur,
  user = "reinhard",
  prompt = "edit mein-reel",
  file = "mein-reel.mov",
  steps = DEFAULT_STEPS,
}) => {
  const t = useTime();
  const typed = prompt.slice(0, Math.floor(p(t, 0.15, 0.75, (x) => x) * prompt.length));
  const cursorOn = Math.floor(t * 3) % 2 === 0;
  const stepStart = 0.85;
  const stepGap = Math.max(0.2, (dur - stepStart - 0.35) / steps.length);
  const done = t > stepStart + steps.length * stepGap;
  return (
    <AbsoluteFill style={{ background: "#141414", fontFamily: mono, color: "#e8e8e8", opacity: p(t, 0, 0.12) }}>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontSize: 24, color: "#777" }}>
        {user} — claude
      </div>
      <div style={{ position: "absolute", top: 350, left: 0, right: 0, height: 2, background: "#262626" }} />
      <div style={{ position: "absolute", left: 70, top: 400, display: "flex", alignItems: "center", gap: 16, fontFamily: sans, fontWeight: 700, fontSize: 44, color: "#d97757" }}>
        <Spark size={44} color="#d97757" /> Claude Code
      </div>
      <div style={{ position: "absolute", left: 70, top: 485, fontSize: 40 }}>
        <span style={{ color: "#d97757" }}>&gt; </span>
        {typed}
        <span style={{ display: "inline-block", width: 22, height: 44, marginLeft: 4, verticalAlign: "-8px", background: cursorOn ? "#e8e8e8" : "transparent" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 580,
          width: 440,
          height: 782,
          borderRadius: 20,
          overflow: "hidden",
          border: "2px solid #2e2e2e",
          opacity: p(t, 0.25, 0.45),
          transform: `translateY(${(1 - p(t, 0.25, 0.5)) * 40}px)`,
        }}
      >
        <Base src={video} trimBefore={trimBefore} />
      </div>
      <div style={{ position: "absolute", left: 550, top: 590, opacity: p(t, 0.35, 0.55) }}>
        <div style={{ fontSize: 30 }}>{file}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "6px 14px",
            borderRadius: 8,
            background: "#262626",
            fontSize: 22,
            color: done ? "#4ade80" : "#9a9a9a",
          }}
        >
          {done ? "fertig" : "Rohmaterial"}
        </div>
      </div>
      <div style={{ position: "absolute", left: 70, top: 1420, right: 50 }}>
        {steps.map((s, i) => {
          const a = stepStart + i * stepGap;
          if (t < a) return null;
          const ok = t > a + stepGap * 0.8;
          return (
            <div key={i} style={{ display: "flex", gap: 18, fontSize: 30, lineHeight: "54px", opacity: p(t, a, a + 0.1) }}>
              <span style={{ color: ok ? "#4ade80" : "#d97757", width: 30, display: "inline-block", transform: ok ? "none" : `rotate(${t * 720}deg)` }}>
                {ok ? "✓" : "◌"}
              </span>
              <span>{s}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
