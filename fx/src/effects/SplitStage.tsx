import React from "react";
import { AbsoluteFill } from "remotion";
import { displaySerif } from "../fonts";
import { Base, Cutout, FxProps } from "../lib/layers";
import { DEFAULT_FACE, backOut, easeIn, easeInOut, mix, p, useTime } from "../lib/util";

export type SplitStageProps = FxProps & { text?: string };

/** 13 Split Stage: oben eine Textkarte, unten das Video; der Kopf ragt aus dem Video in die Karte. */
export const SplitStage: React.FC<SplitStageProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  face = DEFAULT_FACE,
  text = "Hier sind 16 Video-Effekte auf Steroiden.",
}) => {
  const t = useTime();
  const k = p(t, 0, 0.45, easeInOut);
  const out = p(t, dur - 0.3, dur, easeIn);
  // Video-Panel unten
  const panel = { x: 40, y: 960, w: 1000, h: 860 };
  // Skalierung so, dass der Kopf (ca. 300 px über der Gesichtsmitte) knapp über dem Panel steht.
  const s = 0.82;
  const headTop = face.y - 300;
  const oy = panel.y - 150 - headTop * s;
  const ox = panel.x + panel.w / 2 - 540 * s;
  const vx = mix(0, ox, k);
  const vy = mix(0, oy, k);
  const vs = mix(1, s, k);
  const clip = {
    l: mix(0, panel.x, k),
    tp: mix(0, panel.y, k),
    r: mix(1080, panel.x + panel.w, k),
    b: mix(1920, panel.y + panel.h, k),
  };
  const radius = 40 * k;
  const card = p(t, 0.25, 0.65, backOut);
  const words = text.split(" ");
  const videoTransform = `translate(${vx}px, ${vy}px) scale(${vs})`;
  return (
    <AbsoluteFill style={{ background: "#0e0e0e", opacity: 1 - out }}>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 260,
          width: 1000,
          height: 640,
          borderRadius: 40,
          background: "#efe9dc",
          padding: "60px 64px",
          boxSizing: "border-box",
          fontFamily: displaySerif,
          fontSize: 100,
          lineHeight: 1.02,
          color: "#1b1b1b",
          opacity: p(t, 0.25, 0.4),
          transform: `translateY(${(1 - card) * -120}px)`,
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ opacity: p(t, 0.45 + i * 0.05, 0.6 + i * 0.05) }}>
            {w}{" "}
          </span>
        ))}
      </div>
      <div style={{ ...abs, clipPath: `inset(${clip.tp}px ${1080 - clip.r}px ${1920 - clip.b}px ${clip.l}px round ${radius}px)` }}>
        <div style={{ ...abs, transformOrigin: "0 0", transform: videoTransform }}>
          <Base src={video} trimBefore={trimBefore} />
        </div>
      </div>
      {cutout ? (
        // Freisteller ohne obere Begrenzung: der Kopf ragt über das Panel hinaus.
        <div style={{ ...abs, clipPath: `inset(0 ${1080 - clip.r}px ${1920 - clip.b}px ${clip.l}px)`, opacity: p(t, 0.3, 0.5) }}>
          <div style={{ ...abs, transformOrigin: "0 0", transform: videoTransform }}>
            <Cutout src={cutout} trimBefore={trimBefore} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const abs: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1080, height: 1920 };
