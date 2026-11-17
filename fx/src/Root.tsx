import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { Edit, EditProps, Label } from "./Edit";
import { FX } from "./effects";
import { FontPreload } from "./FontPreload";
import { Face } from "./lib/util";

type DemoProps = {
  video: string;
  cutout?: string;
  face?: Face;
  tiles?: string[];
  /** Länge des Testvideos in Frames; jeder Effekt startet an einer anderen Stelle darin. */
  videoFrames: number;
};

const FPS = 30;
const names = Object.keys(FX);
const demoFrames = names.reduce((n, k) => n + Math.round(FX[k].dur * FPS), 0);

/** Alle 16 Effekte nacheinander auf dem Testvideo, mit Namen oben links. */
const Demo: React.FC<DemoProps> = ({ video, cutout, face, tiles, videoFrames }) => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <FontPreload />
      {names.map((k, i) => {
        const info = FX[k];
        const len = Math.round(info.dur * FPS);
        const from = at;
        at += len;
        const trim = (i * 47) % Math.max(1, videoFrames - len);
        const C = info.component;
        return (
          <Sequence key={k} from={from} durationInFrames={len} name={info.label}>
            <C video={video} cutout={cutout} face={face} tiles={tiles} trimBefore={trim} dur={info.dur} />
            <Label nr={i + 1} name={info.label} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const demoDefaults: DemoProps = {
  video: "test.mp4",
  cutout: "test-cutout.webm",
  face: { x: 540, y: 560 },
  tiles: Array.from({ length: 12 }, (_, i) => `tiles/${String(i + 1).padStart(2, "0")}.jpg`),
  videoFrames: 240,
};

const editDefaults: EditProps = {
  video: "test.mp4",
  cutout: "test-cutout.webm",
  face: { x: 540, y: 560 },
  tiles: demoDefaults.tiles,
  cues: [
    { fx: "billboard", from: 0.5, props: { word: "HALLO" } },
    { fx: "frosted", from: 3 },
  ],
  showLabels: false,
  fps: FPS,
  durationInSeconds: 6,
};

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} fps={FPS} width={1080} height={1920} durationInFrames={demoFrames} defaultProps={demoDefaults} />
    <Composition
      id="Edit"
      component={Edit}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={180}
      defaultProps={editDefaults}
      calculateMetadata={({ props }) => ({
        fps: props.fps,
        durationInFrames: Math.round(props.durationInSeconds * props.fps),
      })}
    />
    {names.map((k, i) => {
      const info = FX[k];
      const C = info.component;
      const Single: React.FC<DemoProps> = (p) => <C {...p} trimBefore={0} dur={info.dur} />;
      return (
        <Composition
          key={k}
          id={`fx-${String(i + 1).padStart(2, "0")}-${k}`}
          component={Single}
          fps={FPS}
          width={1080}
          height={1920}
          durationInFrames={Math.round(info.dur * FPS)}
          defaultProps={demoDefaults}
        />
      );
    })}
  </>
);
