import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { TOTAL, sec, wordFrame, segStart } from "./time";
import { VOICE_END } from "./timing";
import { SceneFx } from "./components/Motion";
import { Grain, Vignette } from "./components/Layers";
import { Captions } from "./components/Captions";
import { Intro } from "./Intro";
import { Dust, LightLeaks } from "./fx";
import { INTRO_END } from "./intro_timing";
import { Hook, Birth, School, Books, Height, General, Quote, Coronation, Empire, Brazil, Russia, Fall, Helena, Legacy, Debate, CTA } from "./Scenes";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const list: [string, string, number][] = [[theme.fonts.display, "montserrat-latin-600-normal", 600], [theme.fonts.display, "montserrat-latin-800-normal", 800], [theme.fonts.display, "montserrat-latin-900-normal", 900], [theme.fonts.serif, "playfair-display-latin-700-normal", 700], [theme.fonts.serif, "playfair-display-latin-900-normal", 900]];
    Promise.all(list.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};
const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.6, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`napof/sfx/${src}.mp3`)} volume={vol} /></Sequence>
);
const Progress: React.FC = () => { const f = useCurrentFrame(); return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />; };
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#C8A15A", mixBlendMode: "soft-light", opacity: 0.18 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), transparent 18%, transparent 74%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);
export const CUTS = [0, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => segStart(i) - 6), TOTAL];
const SCENES: React.FC<any>[] = [Intro, Hook, Birth, School, Books, Height, General, Quote, Coronation, Empire, Brazil, Russia, Fall, Helena, Legacy, Debate, CTA];

export const Main: React.FC = () => {
  useFonts();
  const voEnd = sec(VOICE_END + theme.voOffset);
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {SCENES.map((S, i) => (
        <Sequence key={i} from={CUTS[i]} durationInFrames={CUTS[i + 1] - CUTS[i]}>
          <SceneFx first={i === 0} last={i === SCENES.length - 1}><S start={CUTS[i]} /></SceneFx>
        </Sequence>
      ))}
      <Dust />
      <LightLeaks cuts={CUTS.slice(1, -1)} />
      <Captions />
      <Grade />
      <Progress />
      <Grain />
      <Vignette />
      <Sequence from={sec(theme.introOffset)}><Audio src={staticFile("napof/intro_fast.wav")} volume={1} /></Sequence>
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("napof/voice.wav")} volume={1} /></Sequence>
      <Audio src={staticFile("napof/music.wav")} volume={(f) => interpolate(f, [0, 15, voEnd, voEnd + 10, TOTAL - 20, TOTAL], [0, 0.09, 0.09, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUTS.slice(1, -1).map((c, i) => <Sfx key={i} at={c - 6} src="whoosh" vol={0.1} />)}
      <Sfx at={segStart(0) - 8} src="boom" vol={0.22} />
      {["sotaque", "pobreza", "nome"].map((w) => <Sfx key={w} at={wordFrame(2, w) - 4} src="pop" vol={0.15} />)}
      <Sfx at={wordFrame(3, "matematica") - 4} src="shimmer" vol={0.15} />
      <Sfx at={wordFrame(4, "charges") - 4} src="pop" vol={0.15} />
      <Sfx at={wordFrame(5, "montenotte") - 4} src="swords" vol={0.18} />
      <Sfx at={wordFrame(6, "minha") - 6} src="shimmer" vol={0.16} />
      <Sfx at={wordFrame(7, "coroa") - 4} src="crown" vol={0.2} />
      <Sfx at={wordFrame(8, "dominou") - 6} src="cannon" vol={0.15} />
      <Sfx at={wordFrame(8, "codigo") - 6} src="quill" vol={0.16} />
      <Sfx at={wordFrame(9, "invadiu") - 4} src="cannon" vol={0.14} />
      <Sfx at={wordFrame(10, "chamas") - 4} src="boom" vol={0.14} />
      <Sfx at={wordFrame(10, "inverno") - 6} src="wind" vol={0.18} dur={180} />
      <Sfx at={wordFrame(11, "waterloo") - 4} src="swords" vol={0.18} />
      <Sfx at={segStart(15) - 6} src="shimmer" vol={0.18} />
    </AbsoluteFill>
  );
};
