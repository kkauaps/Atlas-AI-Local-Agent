import React, { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate, continueRender, delayRender } from "remotion";
import { theme } from "./theme";
import { TOTAL, sec, wordFrame, segStart } from "./time";
import { VOICE_END } from "./timing";
import { SceneFx } from "./components/Motion";
import { Grain, Vignette } from "./components/Layers";
import { Captions } from "./components/Captions";
import { Hook, Height, RiseScene, Empire, Brazil, Russia, Fall, Debate, CTA } from "./Scenes";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const list: [string, string, number][] = [[theme.fonts.display, "montserrat-latin-600-normal", 600], [theme.fonts.display, "montserrat-latin-800-normal", 800], [theme.fonts.display, "montserrat-latin-900-normal", 900], [theme.fonts.serif, "playfair-display-latin-700-normal", 700], [theme.fonts.serif, "playfair-display-latin-900-normal", 900]];
    Promise.all(list.map(([fam, file, w]) => new FontFace(fam, `url(${staticFile(`fonts/${file}.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};
const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.6, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`napo/sfx/${src}.mp3`)} volume={vol} /></Sequence>
);
const Progress: React.FC = () => { const f = useCurrentFrame(); return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: theme.colors.primary }} />; };
const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#C8A15A", mixBlendMode: "soft-light", opacity: 0.18 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), transparent 18%, transparent 74%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);
export const CUTS = [0, ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => segStart(i) - 6), TOTAL];
const SCENES: React.FC<any>[] = [Hook, Height, RiseScene, Empire, Brazil, Russia, Fall, Debate, CTA];

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
      <Captions />
      <Grade />
      <Progress />
      <Grain />
      <Vignette />
      <Sequence from={sec(theme.voOffset)}><Audio src={staticFile("napo/voice.mp3")} /></Sequence>
      <Audio src={staticFile("napo/music.wav")} volume={(f) => interpolate(f, [0, 15, voEnd, voEnd + 10, TOTAL - 20, TOTAL], [0, 0.2, 0.2, 0.42, 0.42, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUTS.slice(1, -1).map((c, i) => <Sfx key={i} at={c - 6} src="whoosh" vol={0.3} />)}
      <Sfx at={wordFrame(0, "mentira") - 3} src="boom" vol={0.6} />
      <Sfx at={wordFrame(1, "charges") - 4} src="pop" vol={0.5} />
      <Sfx at={wordFrame(2, "coroa") - 4} src="crown" vol={0.55} />
      <Sfx at={wordFrame(3, "dominou") - 6} src="cannon" vol={0.5} />
      <Sfx at={wordFrame(3, "codigo") - 6} src="quill" vol={0.5} />
      <Sfx at={wordFrame(4, "invadiu") - 4} src="cannon" vol={0.45} />
      <Sfx at={wordFrame(5, "invasao") - 4} src="wind" vol={0.45} dur={300} />
      <Sfx at={wordFrame(5, "milhoes") - 6} src="boom" vol={0.5} />
      <Sfx at={wordFrame(6, "waterloo") - 4} src="swords" vol={0.6} />
      <Sfx at={wordFrame(7, "genio") - 3} src="pop" vol={0.4} />
      <Sfx at={wordFrame(7, "tirano") - 3} src="pop" vol={0.4} />
      <Sfx at={segStart(8) - 6} src="shimmer" vol={0.5} />
    </AbsoluteFill>
  );
};
