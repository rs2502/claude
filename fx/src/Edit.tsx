import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { FX } from "./effects";
import { sans } from "./fonts";
import { Face } from "./lib/util";

export type Cue = {
  /** Name aus src/effects/index.ts, z. B. "billboard". */
  fx: string;
  /** Start in Sekunden im Video. */
  from: number;
  /** Dauer in Sekunden (Standard: empfohlene Dauer des Effekts). */
  dur?: number;
  /** Effekt-eigene Felder (Texte, Karten, Wort …). */
  props?: Record<string, unknown>;
};

export type EditProps = {
  video: string;
  cutout?: string;
  face?: Face;
  tiles?: string[];
  cues: Cue[];
  /** Effektname oben links einblenden (wie im Vorbild). */
  showLabels?: boolean;
  fps: number;
  durationInSeconds: number;
};

export const Label: React.FC<{ nr: number; name: string }> = ({ nr, name }) => (
  <div
    style={{
      position: "absolute",
      left: 36,
      top: 200,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 18px 8px 8px",
      borderRadius: 12,
      background: "rgba(10,10,10,0.72)",
      fontFamily: sans,
      fontWeight: 600,
      fontSize: 28,
      color: "white",
    }}
  >
    <span style={{ background: "#2563eb", borderRadius: 8, padding: "2px 10px", fontSize: 24 }}>{String(nr).padStart(2, "0")}</span>
    {name}
  </div>
);

/** Ganzes Video mit Ton; jeder Cue legt seinen Effekt für seine Dauer darüber. */
export const Edit: React.FC<EditProps> = ({ video, cutout, face, tiles, cues, showLabels = false }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {cues.map((c, i) => {
        const info = FX[c.fx];
        if (!info) throw new Error(`Unbekannter Effekt "${c.fx}". Erlaubt: ${Object.keys(FX).join(", ")}`);
        const dur = c.dur ?? info.dur;
        const from = Math.round(c.from * fps);
        const C = info.component;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.round(dur * fps)} name={`${i + 1} ${info.label}`}>
            <C video={video} cutout={cutout} face={face} tiles={tiles} trimBefore={from} dur={dur} {...c.props} />
            {showLabels ? <Label nr={i + 1} name={info.label} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
