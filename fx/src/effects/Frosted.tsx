import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { sans } from "../fonts";
import { Base, FxProps } from "../lib/layers";
import { DEFAULT_FACE, backOut, easeIn, easeOut, p, useTime } from "../lib/util";

export type FrostedProps = FxProps & {
  name?: string;
  /** Profilbild in public/ (Standard: Gesichtsausschnitt aus dem Video). */
  avatar?: string;
  stats?: { value: number; unit: string; color: "blue" | "purple" | "orange" | "green" }[];
  /** Oberkante der ersten Karte. */
  y?: number;
};

const GRADS: Record<string, string> = {
  blue: "linear-gradient(135deg, rgba(56,132,255,0.82), rgba(24,78,214,0.82))",
  purple: "linear-gradient(135deg, rgba(168,85,247,0.82), rgba(109,40,217,0.82))",
  orange: "linear-gradient(135deg, rgba(251,146,60,0.85), rgba(217,85,30,0.85))",
  green: "linear-gradient(135deg, rgba(52,211,153,0.82), rgba(5,150,105,0.82))",
};

/** 14 Frosted: Milchglas-Profilkarten ploppen auf, die Zahlen zählen hoch. */
export const Frosted: React.FC<FrostedProps> = ({
  video,
  trimBefore = 0,
  dur,
  face = DEFAULT_FACE,
  name = "reinartsworld",
  avatar,
  stats = [
    { value: 17, unit: "Effekte", color: "blue" },
    { value: 10, unit: "Jahre", color: "purple" },
  ],
  y = 900,
}) => {
  const t = useTime();
  const out = p(t, dur - 0.3, dur, easeIn);
  return (
    <AbsoluteFill>
      <Base src={video} trimBefore={trimBefore} />
      {stats.map((s, i) => {
        const a = 0.05 + i * 0.18;
        const pop = p(t, a, a + 0.45, backOut);
        const count = Math.round(s.value * p(t, a + 0.2, a + 1.0, easeOut));
        const top = y + i * 290;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 150,
              top,
              width: 780,
              height: 240,
              borderRadius: 40,
              background: GRADS[s.color] ?? GRADS.blue,
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "3px solid rgba(255,255,255,0.45)",
              boxShadow: "inset 0 2px 2px rgba(255,255,255,0.5), 0 0 40px rgba(120,160,255,0.35), 0 24px 60px rgba(0,0,0,0.35)",
              overflow: "hidden",
              opacity: Math.min(p(t, a, a + 0.12), 1 - out),
              transform: `scale(${pop * (1 - 0.15 * out)})`,
              transformOrigin: `${face.x - 150}px ${face.y - top}px`,
              display: "flex",
              alignItems: "center",
              gap: 34,
              padding: "0 40px",
              boxSizing: "border-box",
              fontFamily: sans,
              color: "white",
            }}
          >
            {[0, 1, 2].map((b) => (
              <div key={b} style={{ position: "absolute", right: 30 + b * 90, top: 30 + (b % 2) * 90, width: 130, height: 130, borderRadius: 65, background: "rgba(255,255,255,0.10)" }} />
            ))}
            <div style={{ position: "relative", width: 150, height: 150, borderRadius: 75, overflow: "hidden", border: "4px solid rgba(255,255,255,0.7)", flex: "0 0 auto" }}>
              {avatar ? (
                <Img src={staticFile(avatar)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                // Gesicht aus dem Video: 3-fach vergrößert um die Gesichtsmitte.
                <div style={{ position: "absolute", left: 75 - face.x * 0.33, top: 75 - face.y * 0.33, width: 1080, height: 1920, transform: "scale(0.33)", transformOrigin: "0 0" }}>
                  <Base src={video} trimBefore={trimBefore} />
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 40, fontWeight: 500, opacity: 0.95 }}>{name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 4 }}>
                <span style={{ fontSize: 84, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                <span style={{ fontSize: 40, fontWeight: 500, opacity: 0.9 }}>{s.unit}</span>
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
