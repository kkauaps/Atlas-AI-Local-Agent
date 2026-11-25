import React from "react";
import { registerRoot, Composition } from "remotion";
import { FPS } from "./theme";
import { blockDur, BlockShell } from "./core";
import { Intro, B8 } from "./blocks_a";
import { B7, B6 } from "./blocks_b";
import { B5, B4, B3, B2, B1, Outro } from "./blocks_c";
import { Short, shortDur } from "./short";
const IntroC: React.FC = () => <BlockShell k="intro"><Intro /></BlockShell>;
const B8C: React.FC = () => <BlockShell k="b8" n={8} title="VOCÊ NUNCA TOCOU EM NADA"><B8 /></BlockShell>;
const B7C: React.FC = () => <BlockShell k="b7" n={7} title="VOCÊ ESTÁ VENDO O PASSADO"><B7 /></BlockShell>;
const B6C: React.FC = () => <BlockShell k="b6" n={6} title="VOCÊ ESTÁ MAIS RÁPIDO QUE UM AVIÃO"><B6 /></BlockShell>;
const B5C: React.FC = () => <BlockShell k="b5" n={5} title="VOCÊ É PRATICAMENTE VAZIO"><B5 /></BlockShell>;
const B4C: React.FC = () => <BlockShell k="b4" n={4} title="AS CORES NÃO EXISTEM LÁ FORA"><B4 /></BlockShell>;
const B3C: React.FC = () => <BlockShell k="b3" n={3} title="SUA CABEÇA ENVELHECE MAIS RÁPIDO QUE SEUS PÉS"><B3 /></BlockShell>;
const B2C: React.FC = () => <BlockShell k="b2" n={2} title="VOCÊ É FEITO DE ESTRELAS"><B2 /></BlockShell>;
const B1C: React.FC = () => <BlockShell k="b1" n={1} title="95% DO UNIVERSO É UM MISTÉRIO"><B1 /></BlockShell>;
const OutroC: React.FC = () => <BlockShell k="outro"><Outro /></BlockShell>;
registerRoot(() => <>
  <Composition id="Intro" component={IntroC} durationInFrames={blockDur("intro")} fps={FPS} width={1920} height={1080} />
  <Composition id="B8" component={B8C} durationInFrames={blockDur("b8")} fps={FPS} width={1920} height={1080} />
  <Composition id="B7" component={B7C} durationInFrames={blockDur("b7")} fps={FPS} width={1920} height={1080} />
  <Composition id="B6" component={B6C} durationInFrames={blockDur("b6")} fps={FPS} width={1920} height={1080} />
  <Composition id="B5" component={B5C} durationInFrames={blockDur("b5")} fps={FPS} width={1920} height={1080} />
  <Composition id="B4" component={B4C} durationInFrames={blockDur("b4")} fps={FPS} width={1920} height={1080} />
  <Composition id="B3" component={B3C} durationInFrames={blockDur("b3")} fps={FPS} width={1920} height={1080} />
  <Composition id="B2" component={B2C} durationInFrames={blockDur("b2")} fps={FPS} width={1920} height={1080} />
  <Composition id="B1" component={B1C} durationInFrames={blockDur("b1")} fps={FPS} width={1920} height={1080} />
  <Composition id="Outro" component={OutroC} durationInFrames={blockDur("outro")} fps={FPS} width={1920} height={1080} />
  <Composition id="ShortB2" component={Short} durationInFrames={shortDur(60.17)} fps={FPS} width={1080} height={1920} defaultProps={{ clip: "longo/clips/B2.mp4", n: 2, hook: "VOCÊ É FEITO DE", hook2: "RESTOS DE ESTRELAS", clipSec: 60.17 }} />
  <Composition id="ShortB1" component={Short} durationInFrames={shortDur(57.4) + 90} fps={FPS} width={1080} height={1920} defaultProps={{ clip: "longo/clips/B1.mp4", n: 1, hook: "95% DO UNIVERSO", hook2: "NINGUÉM NUNCA VIU", clipSec: 57.4 }} />
</>);
