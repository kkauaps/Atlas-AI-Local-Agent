import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { TOTAL, sec, wordFrame, segStart, wordT } from "./time";
import { VOICE_END } from "./timing";
import { SceneFx } from "./components/Motion";
import { Grain, Vignette } from "./components/Layers";
import { Captions } from "./components/Captions";
import { Hook, Night, Tides, Animals, Axis, Outro } from "./Scenes";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([600, 800, 900].map((w) => new FontFace(theme.fonts.display, `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};
const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.6, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`lua/sfx/${src}.mp3`)} volume={vol} /></Sequence>
);
const Progress: React.FC = () => { const f = useCurrentFrame(); return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />; };
const SpaceGrade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#1E3A8A", mixBlendMode: "soft-light", opacity: 0.2 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), transparent 18%, transparent 74%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);

export const CUTS = [0, segStart(1) - 6, segStart(2) - 6, segStart(3) - 6, segStart(4) - 6, segStart(6) - 6, TOTAL];
const SCENES: React.FC<any>[] = [Hook, Night, Tides, Animals, Axis, Outro];

export const Main: React.FC = () => {
  useFonts();
  const voEnd = sec(VOICE_END + theme.voOffset);
  const cta = segStart(7) - 4;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {SCENES.map((S, i) => (
        <Sequence key={i} from={CUTS[i]} durationInFrames={CUTS[i + 1] - CUTS[i]}>
          <SceneFx first={i === 0} last={i === SCENES.length - 1}><S start={CUTS[i]} cta={cta} /></SceneFx>
        </Sequence>
      ))}
      <Captions />
      <SpaceGrade />
      <Progress />
      <Grain />
      <Vignette />
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("lua/voice.mp3")} /></Sequence>
      <Audio src={staticFile("lua/music.wav")} volume={(f) => interpolate(f, [0, 15, voEnd, voEnd + 10, TOTAL - 20, TOTAL], [0, 0.2, 0.2, 0.45, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUTS.slice(1, -1).map((c, i) => <Sfx key={i} at={c - 6} src="whoosh" vol={0.35} />)}
      <Sfx at={wordFrame(0, "agora") + 2} src="shimmer" vol={0.6} />
      <Sfx at={wordFrame(0, "agora") + 4} src="boom" vol={0.45} />
      <Sfx at={wordFrame(2, "mares") - 4} src="waves" vol={0.4} />
      <Sfx at={wordFrame(2, "sem") + 2} src="shimmer" vol={0.45} />
      {["tartarugas", "corais", "peixes"].map((w) => <Sfx key={w} at={wordFrame(3, w) - 6} src="pop" vol={0.45} />)}
      <Sfx at={wordFrame(3, "tartarugas") - 10} src="bubbles" vol={0.25} />
      <Sfx at={segStart(5) + 2} src="shimmer" vol={0.45} />
      <Sfx at={segStart(5) + 20} src="boom" vol={0.35} />
      <Sfx at={segStart(6) + 30} src="shimmer" vol={0.5} />
      <Sfx at={cta + 20} src="pop" vol={0.5} />
    </AbsoluteFill>
  );
};
