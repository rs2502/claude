import React from "react";
import { Arena } from "./Arena";
import { BackdropWord } from "./BackdropWord";
import { Billboard } from "./Billboard";
import { ColorPop } from "./ColorPop";
import { Dealer } from "./Dealer";
import { EndCard } from "./EndCard";
import { Frosted } from "./Frosted";
import { GiantCaptions } from "./GiantCaptions";
import { HallOfFame } from "./HallOfFame";
import { Halo } from "./Halo";
import { Headline } from "./Headline";
import { KineticHook } from "./KineticHook";
import { LiquidGlass } from "./LiquidGlass";
import { Magnifier } from "./Magnifier";
import { MatchCut } from "./MatchCut";
import { MosaicDrop } from "./MosaicDrop";
import { PhoneWall } from "./PhoneWall";
import { ProfileWall } from "./ProfileWall";
import { PromptDrop } from "./PromptDrop";
import { RabbitHole } from "./RabbitHole";
import { RedCollage } from "./RedCollage";
import { RevealBar } from "./RevealBar";
import { SplitStage } from "./SplitStage";
import { Teardown } from "./Teardown";

export type FxInfo = {
  label: string;
  // Effekt-Props sind je Effekt verschieden; das Register reicht sie nur durch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.FC<any>;
  /** Empfohlene Dauer in Sekunden. */
  dur: number;
  /** Sieht nur mit Freisteller richtig aus. */
  cutout: boolean;
};

export const FX: Record<string, FxInfo> = {
  teardown: { label: "Teardown", component: Teardown, dur: 2.6, cutout: false },
  "mosaic-drop": { label: "Mosaic Drop", component: MosaicDrop, dur: 1.8, cutout: false },
  halo: { label: "Halo", component: Halo, dur: 1.8, cutout: true },
  "match-cut": { label: "Match Cut", component: MatchCut, dur: 1.2, cutout: false },
  dealer: { label: "The Dealer", component: Dealer, dur: 2.4, cutout: false },
  "hall-of-fame": { label: "Hall of Fame", component: HallOfFame, dur: 1.8, cutout: true },
  "rabbit-hole": { label: "Rabbit Hole", component: RabbitHole, dur: 1.8, cutout: true },
  billboard: { label: "Billboard", component: Billboard, dur: 1.6, cutout: true },
  "liquid-glass": { label: "Liquid Glass", component: LiquidGlass, dur: 2.0, cutout: false },
  "prompt-drop": { label: "Prompt Drop", component: PromptDrop, dur: 2.6, cutout: false },
  arena: { label: "The Arena", component: Arena, dur: 2.0, cutout: false },
  headline: { label: "Headline", component: Headline, dur: 2.6, cutout: false },
  "split-stage": { label: "Split Stage", component: SplitStage, dur: 2.0, cutout: true },
  frosted: { label: "Frosted", component: Frosted, dur: 2.0, cutout: false },
  "color-pop": { label: "Color Pop", component: ColorPop, dur: 2.0, cutout: true },
  "reveal-bar": { label: "Reveal Bar", component: RevealBar, dur: 1.4, cutout: false },
};

/** Bausteine für den Alltag, nicht aus der Vorlage; nicht im Demo. */
export const EXTRA: Record<string, FxInfo> = {
  "kinetic-hook": { label: "Kinetic Hook", component: KineticHook, dur: 1.6, cutout: false },
  magnifier: { label: "Lupe", component: Magnifier, dur: 1.0, cutout: false },
  endcard: { label: "Endcard", component: EndCard, dur: 2.0, cutout: false },
  "backdrop-word": { label: "Backdrop Word", component: BackdropWord, dur: 1.6, cutout: true },
  "giant-captions": { label: "Giant Captions", component: GiantCaptions, dur: 2.0, cutout: false },
  "profile-wall": { label: "Profile Wall", component: ProfileWall, dur: 2.4, cutout: false },
  "phone-wall": { label: "Phone Wall", component: PhoneWall, dur: 2.0, cutout: true },
  "red-collage": { label: "Red Collage", component: RedCollage, dur: 2.2, cutout: true },
};
