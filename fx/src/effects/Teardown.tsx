import React from "react";
import { AbsoluteFill } from "remotion";
import { mono, sans } from "../fonts";
import { Base, Cutout, FxProps, Tile, fill } from "../lib/layers";
import { easeInOut, mix, p, useTime } from "../lib/util";

export type TeardownProps = FxProps & {
  hookTitle?: string;
  hookSub?: string;
  layers?: { title: string; sub: string }[];
};

const DEFAULT_LAYERS = [
  { title: "Hook-Karte", sub: "Titel, 17 Video-Effekte" },
  { title: "Freisteller", sub: "Person ohne Hintergrund" },
  { title: "Effekt-Wand", sub: "Kacheln hinter dir" },
  { title: "A-Roll", sub: "der beste Take" },
  { title: "Ton", sub: "Mikro, synchron" },
];

const PW = 1080 * 0.5;
const PH = 1920 * 0.5;

/** 01 Teardown: das Bild kippt in 3D und zerfällt in seine Ebenen, jede beschriftet. */
export const Teardown: React.FC<TeardownProps> = ({
  video,
  cutout,
  trimBefore = 0,
  dur,
  tiles,
  hookTitle = "17 Video-Effekte",
  hookSub = "gebaut von Claude",
  layers = DEFAULT_LAYERS,
}) => {
  const t = useTime();
  const tilt = p(t, 0.15, 0.85, easeInOut);
  const split = p(t, 0.55, 1.35, easeInOut);
  const out = p(t, dur - 0.3, dur);
  const n = layers.length;
  const gap = 250;
  const cx = mix(540, 370, tilt);
  const cy = 960;
  const scale = mix(2, 0.82, tilt); // Ebene ist halb so groß wie der Frame; 2× = Vollbild
  const plane = `perspective(2600px) rotateX(${mix(0, 52, tilt)}deg) rotateZ(${mix(0, -32, tilt)}deg) scale(${scale})`;

  const layerContent = (i: number) => {
    switch (i) {
      case 0:
        return (
          <div
            style={{
              position: "absolute",
              left: "18%",
              top: "16%",
              padding: "10px 22px",
              background: "white",
              borderRadius: 12,
              transform: "rotate(-4deg)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              fontFamily: sans,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 30, color: "#111" }}>{hookTitle}</div>
            <div style={{ fontWeight: 700, fontSize: 24, color: "#d97757" }}>{hookSub}</div>
          </div>
        );
      case 1:
        return cutout ? <Cutout src={cutout} trimBefore={trimBefore} /> : <Base src={video} trimBefore={trimBefore} style={{ opacity: 0.5 }} />;
      case 2:
        return (
          <div style={fill}>
            {Array.from({ length: 12 }).map((_, k) => (
              <Tile
                key={k}
                i={k}
                tiles={tiles}
                titleSize={16}
                style={{ left: 10 + (k % 3) * 176, top: 12 + Math.floor(k / 3) * 236, width: 166, height: 224 }}
              />
            ))}
          </div>
        );
      case 3:
        return <Base src={video} trimBefore={trimBefore} />;
      default:
        return (
          <svg viewBox="0 0 540 960" style={{ ...fill, width: "100%", height: "100%" }}>
            {Array.from({ length: 60 }).map((_, k) => {
              const h = 20 + Math.abs(Math.sin(k * 1.7 + t * 9) * Math.cos(k * 0.45)) * 150;
              return <rect key={k} x={30 + k * 8} y={480 - h / 2} width={4} height={h} rx={2} fill="rgba(255,255,255,0.85)" />;
            })}
          </svg>
        );
    }
  };

  return (
    <AbsoluteFill style={{ background: "#0b0d12", opacity: 1 - out }}>
      {/* Vor dem Kippen läuft das normale Bild weiter. */}
      <Base src={video} trimBefore={trimBefore} style={{ opacity: 1 - p(t, 0.1, 0.4) }} />
      {layers.map((_, idx) => {
        // Unterste Ebene zuerst zeichnen, damit die obere davor liegt.
        const i = n - 1 - idx;
        const dy = (i - (n - 1) / 2) * gap * split;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - PW / 2,
              top: cy - PH / 2 + dy,
              width: PW,
              height: PH,
              transform: plane,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                ...fill,
                overflow: "hidden",
                borderRadius: 10,
                border: `2px solid rgba(255,255,255,${0.35 * tilt})`,
                background: i === 0 || i === 1 ? `rgba(255,255,255,${0.05 * tilt})` : "#14171f",
                boxShadow: `0 30px 60px rgba(0,0,0,${0.5 * tilt})`,
                opacity: i === 3 ? 1 : p(t, 0.2, 0.6),
              }}
            >
              {layerContent(i)}
            </div>
          </div>
        );
      })}
      {layers.map((l, i) => {
        const k = p(t, 1.0 + i * 0.12, 1.35 + i * 0.12);
        const y = cy + (i - (n - 1) / 2) * gap - 40;
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: 700, top: y, opacity: k, transform: `translateX(${(1 - k) * 30}px)` }}>
            <div style={{ position: "absolute", left: -170, top: 22, width: 150 * k, height: 2, background: "rgba(255,255,255,0.5)" }} />
            <div style={{ position: "absolute", left: -178, top: 16, width: 14, height: 14, borderRadius: 7, background: "white" }} />
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 36, color: "white" }}>
              <span style={{ fontFamily: mono, fontSize: 22, color: "#6ea8ff", marginRight: 12 }}>{String(i + 1).padStart(2, "0")}</span>
              {l.title}
            </div>
            <div style={{ fontFamily: mono, fontSize: 22, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>{l.sub}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
