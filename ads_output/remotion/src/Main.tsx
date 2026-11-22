import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { CUTS, TOTAL, sec, wordFrame } from "./time";
import { VOICE_END } from "./timing";
import { SceneFx } from "./components/Motion";
import { Grade, Grain, Vignette } from "./components/Layers";
import { Captions } from "./components/Captions";
import { Hook, Pain, Turn, Reveal, Profile, Calendar, Offer, CTA } from "./scenes/Scenes";

const SCENES = [Hook, Pain, Turn, Reveal, Profile, Calendar, Offer, CTA];

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([600, 800, 900].map((w) => new FontFace(theme.fonts.display, `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff))))
      .then(() => continueRender(h));
  }, [h]);
};

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={90}><Audio src={staticFile(`sfx/${src}.mp3`)} volume={vol} /></Sequence>
);

const BrandTag: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [CUTS[3] + 20, CUTS[3] + 32, CUTS[7] - 6, CUTS[7]], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });
  return <div style={{ position: "absolute", top: 120, left: 60, opacity: o, transform: `translateY(${(1 - o) * -20}px)`, background: theme.colors.primary, color: theme.colors.ink, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 30, padding: "8px 18px", borderRadius: 12 }}>MÉTODO 4D</div>;
};
const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />;
};

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
      <Grade />
      <Captions />
      <BrandTag />
      <Progress />
      <Grain />
      <Vignette />
      {/* audio */}
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("voice.mp3")} volume={1} /></Sequence>
      <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 10, voEnd, voEnd + 15, TOTAL - 30, TOTAL], [0, 0.14, 0.14, 0.4, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUTS.slice(1, -1).map((c, i) => <React.Fragment key={i}><Sfx at={c - 6} src="whoosh" vol={0.35} /><Sfx at={c} src="hit" vol={0.3} /></React.Fragment>)}
      <Sfx at={wordFrame(0, "foto") + 1} src="shutter" vol={0.8} />
      <Sfx at={wordFrame(3, "metodo") + 2} src="chime" vol={0.45} />
      {[["trinta"], ["exercicios"], ["dez"], ["feitos"], ["agulha"]].map(([w], i) => <Sfx key={w} at={wordFrame(4, w) - 4} src="pop" vol={0.35} />)}
      <Sfx at={wordFrame(2, "natal") - 3} src="bell" vol={0.35} />
      <Sfx at={wordFrame(6, "natal") - 2} src="bell" vol={0.35} />
      <Sfx at={wordFrame(7, "condicao") - 4} src="chime" vol={0.35} />
      <Sfx at={wordFrame(8, "toca") - 3} src="pop" vol={0.4} />
    </AbsoluteFill>
  );
};
