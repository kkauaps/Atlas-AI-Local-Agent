import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { TOTAL, sec, wordFrame, segStart } from "./time";
import { VOICE_END } from "./timing";
import { Space, K } from "./Space";
import { Overlays } from "./Overlays";
import { Grain, Vignette, Flash } from "./components/Layers";
import { Captions } from "./components/Captions";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([600, 800, 900].map((w) => new FontFace(theme.fonts.display, `url(${staticFile(`fonts/montserrat-latin-${w}-normal.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};
const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.6, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`sol/sfx/${src}.mp3`)} volume={vol} /></Sequence>
);
const SpaceGrade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#1E3A8A", mixBlendMode: "soft-light", opacity: 0.22 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35), transparent 20%, transparent 72%, rgba(0,0,0,0.5))" }} />
  </AbsoluteFill>
);
const Progress: React.FC = () => { const f = useCurrentFrame(); return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />; };

export const Main: React.FC = () => {
  useFonts();
  const voEnd = sec(VOICE_END + theme.voOffset);
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <Space />
      <Flash at={sec(K.vanish) - 2} len={14} />
      <Overlays />
      <Captions />
      <SpaceGrade />
      <Progress />
      <Grain />
      <Vignette />
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("sol/voice.mp3")} /></Sequence>
      <Audio src={staticFile("sol/music.wav")} volume={(f) => interpolate(f, [0, 15, voEnd, voEnd + 10, TOTAL - 20, TOTAL], [0, 0.22, 0.22, 0.45, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Sfx at={sec(K.vanish) - 4} src="boom" vol={0.8} />
      <Sfx at={sec(K.s1) + 4} src="tick" vol={0.18} dur={sec(K.dark) - sec(K.s1) - 4} />
      <Sfx at={sec(K.dark) - 3} src="boom" vol={0.5} />
      <Sfx at={segStart(5) - 4} src="whoosh" vol={0.5} />
      <Sfx at={segStart(6) + 20} src="ice" vol={0.45} />
      <Sfx at={segStart(7) - 8} src="whoosh" vol={0.4} />
      <Sfx at={wordFrame(7, "fundo") - 6} src="bubbles" vol={0.4} />
      <Sfx at={wordFrame(8, "fontes") - 6} src="bubbles" vol={0.35} />
      <Sfx at={segStart(9) - 6} src="shimmer" vol={0.5} />
      <Sfx at={segStart(9) + 18} src="pop" vol={0.5} />
    </AbsoluteFill>
  );
};
