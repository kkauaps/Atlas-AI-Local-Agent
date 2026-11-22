import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { useSpring } from "./Motion";

type M = { src: string; video?: boolean; rate?: number; pos?: string; zoomFrom?: number; zoomTo?: number; panX?: number; from?: number };
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Media: React.FC<M & { style?: React.CSSProperties }> = ({ src, video, rate = 1, pos = "50% 50%", zoomFrom = 1, zoomTo = 1.1, panX = -20, from = 0, style }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig();
  const t = interpolate(f, [from, d], [0, 1], { ...cl, easing: theme.ease.inOut });
  const s: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${zoomFrom + (zoomTo - zoomFrom) * t}) translateX(${panX * t}px)`, ...style };
  return video ? <OffthreadVideo src={staticFile(src)} playbackRate={rate} muted style={s} /> : <Img src={staticFile(src)} style={s} />;
};

export const BlurBg: React.FC<M & { show?: number }> = (p) => (
  <AbsoluteFill style={{ overflow: "hidden", opacity: p.show ?? 1 }}>
    <Media {...p} zoomFrom={1.35} zoomTo={1.45} style={{ filter: "blur(38px) brightness(0.42) saturate(1.2)" }} />
  </AbsoluteFill>
);

export const Card: React.FC<M & { top: number; w?: number; h: number; delay?: number; children?: React.ReactNode; exitAt?: number }> = ({ top, w = 1000, h, delay = 0, children, exitAt, ...m }) => {
  const f = useCurrentFrame();
  const p = useSpring(delay, theme.spring.smooth);
  const out = exitAt === undefined ? 0 : interpolate(f, [exitAt, exitAt + 8], [0, 1], { ...cl, easing: theme.ease.in });
  return (
    <div style={{ position: "absolute", left: (1080 - w) / 2, top, width: w, height: h, borderRadius: 40, overflow: "hidden", border: "2px solid rgba(255,255,255,0.18)", boxShadow: "0 50px 100px -30px rgba(0,0,0,0.8)",
      opacity: interpolate(p, [0, 0.5], [0, 1], cl) * (1 - out), transform: `translateY(${interpolate(p, [0, 1], [80, 0]) - out * 60}px) scale(${interpolate(p, [0, 1], [0.88, 1]) * (1 - out * 0.08)})` }}>
      <Media {...m} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55))" }} />
      {children}
    </div>
  );
};
