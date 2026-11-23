import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { TOTAL, sec, wordFrame, segStart } from "./time";
import { VOICE_END } from "./timing";
import { SceneFx } from "./components/Motion";
import { Grain, Vignette } from "./components/Layers";
import { Captions } from "./components/Captions";
import { Dust, LightLeaks } from "./fx";
import { Hook, Krikalev, Relativity, GPS, NearLight, Problem, WormScene, Paradox, Party, Verdict, CTA } from "./Scenes";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([600, 800, 900].map((w) => new FontFace(theme.fonts.display, `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};
const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.2, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`tempo/sfx/${src}.mp3`)} volume={vol} /></Sequence>
);
const Progress: React.FC = () => { const f = useCurrentFrame(); return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />; };
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#312e81", mixBlendMode: "soft-light", opacity: 0.2 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), transparent 18%, transparent 74%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);
export const CUTS = [0, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => segStart(i) - 6), TOTAL];
const SCENES: React.FC<any>[] = [Hook, Krikalev, Relativity, GPS, NearLight, Problem, WormScene, Paradox, Party, Verdict, CTA];

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
      <Dust n={36} />
      <LightLeaks cuts={CUTS.slice(1, -1)} />
      <Captions />
      <Grade />
      <Progress />
      <Grain />
      <Vignette />
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("tempo/voice.wav")} volume={1} /></Sequence>
      <Audio src={staticFile("tempo/music.wav")} volume={(f) => interpolate(f, [0, 15, voEnd, voEnd + 10, TOTAL - 20, TOTAL], [0, 0.1, 0.1, 0.32, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUTS.slice(1, -1).map((c, i) => <Sfx key={i} at={c - 6} src="whoosh" vol={0.1} />)}
      <Sfx at={wordFrame(0, "possivel") - 3} src="shimmer" vol={0.2} />
      <Sfx at={wordFrame(1, "futuro") - 3} src="pop" vol={0.18} />
      <Sfx at={wordFrame(2, "rapido") - 4} src="whoosh" vol={0.18} />
      <Sfx at={wordFrame(4, "nave") - 2} src="whoosh" vol={0.18} />
      <Sfx at={wordFrame(6, "buracos") - 4} src="shimmer" vol={0.18} />
      <Sfx at={wordFrame(7, "nascimento") - 3} src="boom" vol={0.18} />
      <Sfx at={wordFrame(8, "depois") - 3} src="pop" vol={0.2} />
      <Sfx at={segStart(10) - 6} src="shimmer" vol={0.18} />
    </AbsoluteFill>
  );
};
