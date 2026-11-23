import React from "react";
import { registerRoot, Composition } from "remotion";
import { FPS } from "./theme";
import { blockDur, BlockShell } from "./core";
import { Intro, B8 } from "./blocks_a";
import { B7, B6 } from "./blocks_b";
const IntroC: React.FC = () => <BlockShell k="intro"><Intro /></BlockShell>;
const B8C: React.FC = () => <BlockShell k="b8" n={8} title="VOCÊ NUNCA TOCOU EM NADA"><B8 /></BlockShell>;
const B7C: React.FC = () => <BlockShell k="b7" n={7} title="VOCÊ ESTÁ VENDO O PASSADO"><B7 /></BlockShell>;
const B6C: React.FC = () => <BlockShell k="b6" n={6} title="VOCÊ ESTÁ MAIS RÁPIDO QUE UM AVIÃO"><B6 /></BlockShell>;
registerRoot(() => <>
  <Composition id="Intro" component={IntroC} durationInFrames={blockDur("intro")} fps={FPS} width={1920} height={1080} />
  <Composition id="B8" component={B8C} durationInFrames={blockDur("b8")} fps={FPS} width={1920} height={1080} />
  <Composition id="B7" component={B7C} durationInFrames={blockDur("b7")} fps={FPS} width={1920} height={1080} />
  <Composition id="B6" component={B6C} durationInFrames={blockDur("b6")} fps={FPS} width={1920} height={1080} />
</>);
