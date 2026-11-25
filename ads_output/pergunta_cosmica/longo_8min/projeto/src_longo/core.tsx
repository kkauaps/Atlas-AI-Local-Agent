import React, { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, continueRender, delayRender, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { theme, FPS, STING } from "./theme";
import { BLOCKS } from "./blocks";
import { Grain, Vignette } from "./components/Layers";
import { Dust } from "./fx";
import { cl } from "./cl";

export const sec = (s: number) => Math.round(s * FPS);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
// block timing: VO starts at `vo` seconds from block start
export const voStart = (k: string) => (k === "intro" || k === "outro" ? 0.5 : STING + 0.25);
export const blockDur = (k: string) => sec(voStart(k) + BLOCKS[k].end + theme.tail + (k === "intro" ? 0.6 : k === "outro" ? 5.2 : 0));
export const useBlock = (k: string) => {
  const f = useCurrentFrame();
  const vo = voStart(k);
  const words = BLOCKS[k].words;
  const w = (word: string, n = 0) => { const l = words.filter((x) => norm(x.w) === norm(word)); const h = l[n] ?? l[0]; if (!h) throw new Error(`word ${k} ${word}`); return h.s + vo; };
  return { t: f / FPS, f, w, W: (word: string, n = 0) => sec(w(word, n)), vo };
};

export const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([600, 800, 900].map((wt) => new FontFace(theme.fonts.display, `url(${staticFile(`fonts/montserrat-latin-${wt}-normal.woff2`)})`, { weight: String(wt) }).load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(h));
  }, [h]);
};

/* captions for 16:9 (subtle, bottom) */
export const Captions16: React.FC<{ k: string }> = ({ k }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const vo = voStart(k); const words = BLOCKS[k].words;
  const pages = useMemo(() => { const p: (typeof words)[] = []; let cur: typeof words = [];
    words.forEach((w, i) => { cur.push(w); const nx = words[i + 1]; if (cur.length === 5 || !nx || /[.?!:,…]$/.test(w.w)) { p.push(cur); cur = []; } }); return p; }, [k]);
  const t = f / fps - vo;
  const pi = pages.findIndex((p, i) => t >= p[0].s - 0.05 && (i === pages.length - 1 ? t <= p[p.length - 1].e + 0.5 : t < pages[i + 1][0].s - 0.05));
  if (pi < 0) return null;
  const page = pages[pi];
  const p = spring({ frame: f - sec(page[0].s + vo) + 2, fps, config: theme.spring.snappy });
  return (
    <AbsoluteFill style={{ top: 935, alignItems: "center" }}>
      <div style={{ display: "flex", gap: 14, padding: "10px 22px", borderRadius: 18, background: "rgba(0,0,0,.55)", transform: `translateY(${(1 - p) * 14}px)`, opacity: p }}>
        {page.map((w, i) => { const act = t >= w.s - 0.03 && t <= w.e + 0.06;
          return <span key={i} style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 44, color: act ? theme.colors.primary : "#fff" }}>{w.w.replace(/[.,:!?…]$/, "")}</span>; })}
      </div>
    </AbsoluteFill>
  );
};

/* 3D metallic countdown sting */
const CamSet: React.FC<{ pos: [number, number, number] }> = ({ pos }) => { const { camera } = useThree(); camera.position.set(...pos); camera.lookAt(0, 0, 0); return null; };
const Num3D: React.FC<{ text: string; p: number; t: number }> = ({ text, p, t }) => {
  const [font, setFont] = useState<any>(null);
  const [h] = useState(() => delayRender("font3d"));
  useEffect(() => { fetch(staticFile("longo/fonts3d/helvetiker_bold.typeface.json")).then((r) => r.json()).then((j) => { setFont(new FontLoader().parse(j)); continueRender(h); }); }, [h]);
  const geo = useMemo(() => { if (!font) return null; const g = new TextGeometry(text, { font, size: 1.6, depth: 0.45, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 4 }); g.center(); return g; }, [font, text]);
  if (!geo) return null;
  return (
    <group rotation={[0.15 * (1 - p), -1.6 * (1 - p) + Math.sin(t * 1.2) * 0.12, 0]} scale={0.5 + 0.5 * p}>
      <mesh geometry={geo}><meshStandardMaterial color="#F2C14E" metalness={0.75} roughness={0.28} emissive="#5a3a00" emissiveIntensity={0.35} /></mesh>
    </group>
  );
};
export const Sting: React.FC<{ n: number; title: string; sub?: string }> = ({ n, title, sub }) => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = f / FPS;
  const p = spring({ frame: f - 2, fps: FPS, config: { damping: 15, stiffness: 70, mass: 1 } });
  const tp = spring({ frame: f - 22, fps: FPS, config: theme.spring.smooth });
  const out = interpolate(f, [sec(STING) - 10, sec(STING)], [0, 1], { ...cl, easing: theme.ease.in });
  const sweep = interpolate(f, [16, 40], [-0.3, 1.3], cl);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1a1530 0%, #05050c 65%)", opacity: 1 - out, transform: `scale(${1 + out * 0.15})` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
        <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true, alpha: true }}>
          <CamSet pos={[0, 0.25, 4.1]} />
          <ambientLight intensity={0.5} />
          <hemisphereLight args={["#fff6e0", "#2a1a4a", 1.2]} />
          <directionalLight position={[-4, 3, 5]} intensity={3} color="#fff3d6" />
          <pointLight position={[-6 + sweep * 12, 1.5, 3]} intensity={60} color="#ffffff" distance={10} />
          <directionalLight position={[4, -2, -3]} intensity={1.4} color="#7c5cff" />
          <group position={[0, 0.55, 0]}><Num3D text={`#${n}`} p={p} t={t} /></group>
        </ThreeCanvas>
      </div>
      <AbsoluteFill style={{ top: 740, alignItems: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: "-0.02em", opacity: tp, transform: `translateY(${(1 - tp) * 30}px)`, textAlign: "center" }}>{title}</div>
        {sub && <div style={{ fontFamily: theme.fonts.display, fontWeight: 700, fontSize: 32, color: theme.colors.textDim, opacity: tp }}>{sub}</div>}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 715, height: 3, background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`, opacity: tp * 0.8, transform: `scaleX(${tp})` }} />
    </AbsoluteFill>
  );
};

/* shared shell: sting + content + overlays + audio */
export const Grade16: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#312e81", mixBlendMode: "soft-light", opacity: 0.18 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 20%, transparent 75%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);
export const Sfx: React.FC<{ at: number; src: string; vol?: number; dur?: number }> = ({ at, src, vol = 0.2, dur = 150 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur}><Audio src={staticFile(`longo/sfx/${src}`)} volume={vol} /></Sequence>
);
export const BlockShell: React.FC<{ k: string; n?: number; title?: string; sub?: string; children: React.ReactNode }> = ({ k, n, title, sub, children }) => {
  useFonts();
  const hasSting = n !== undefined;
  const start = hasSting ? sec(STING) - 10 : 0;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {useCurrentFrame() >= start - 1 && children}
      <Dust n={30} />
      <Captions16 k={k} />
      <Grade16 />
      <Grain />
      <Vignette />
      {hasSting && <Sequence durationInFrames={sec(STING)}><Sting n={n!} title={title!} sub={sub} /></Sequence>}
      <Sequence from={sec(voStart(k))}><Audio src={staticFile(`longo/voice_${k}.wav`)} /></Sequence>
      {hasSting && <><Sfx at={0} src="riser.wav" vol={0.25} /><Sfx at={10} src="impact.wav" vol={0.35} /><Sfx at={24} src="sparkle.wav" vol={0.18} /><Sfx at={sec(STING) - 14} src="swoosh.wav" vol={0.2} /></>}
    </AbsoluteFill>
  );
};
