import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme } from "../theme";

type SpringCfg = (typeof theme.spring)[keyof typeof theme.spring];
export const useSpring = (delay: number, cfg: SpringCfg = theme.spring.smooth) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: cfg });
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Enter: React.FC<{ delay?: number; children: React.ReactNode; y?: number; x?: number; from?: number; cfg?: SpringCfg; style?: React.CSSProperties }> = ({ delay = 0, children, y = 50, x = 0, from = 0.85, cfg = theme.spring.smooth, style }) => {
  const p = useSpring(delay, cfg);
  return <div style={{ opacity: interpolate(p, [0, 0.6], [0, 1], cl), transform: `translate(${interpolate(p, [0, 1], [x, 0])}px, ${interpolate(p, [0, 1], [y, 0])}px) scale(${interpolate(p, [0, 1], [from, 1])})`, ...style }}>{children}</div>;
};

export const Breathe: React.FC<{ children: React.ReactNode; amt?: number; speed?: number; style?: React.CSSProperties }> = ({ children, amt = 0.015, speed = 22, style }) => {
  const f = useCurrentFrame();
  return <div style={{ transform: `scale(${1 + Math.sin(f / speed) * amt}) translateY(${Math.sin(f / 30) * 4}px)`, ...style }}>{children}</div>;
};

// Scene wrapper: scale-through entrance (8f) and faster exit (7f)
export const SceneFx: React.FC<{ children: React.ReactNode; first?: boolean; last?: boolean }> = ({ children, first, last }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig();
  const inP = first ? 1 : interpolate(f, [0, 9], [0, 1], { ...cl, easing: theme.ease.out });
  const outP = last ? 0 : interpolate(f, [d - 7, d], [0, 1], { ...cl, easing: theme.ease.in });
  const scale = interpolate(inP, [0, 1], [0.86, 1]) * interpolate(outP, [0, 1], [1, 1.18]);
  const blur = (1 - inP) * 10 + outP * 12;
  return <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined, opacity: interpolate(inP, [0, 1], [0.2, 1]) * interpolate(outP, [0, 1], [1, 0]) }}>{children}</div>;
};

export const Pill: React.FC<{ children: React.ReactNode; bg: string; color: string; size: number; pad?: string; glow?: boolean; rotate?: number }> = ({ children, bg, color, size, pad = "0.22em 0.55em", glow, rotate = 0 }) => (
  <span style={{ display: "inline-block", fontFamily: theme.fonts.display, whiteSpace: "nowrap", background: bg, color, fontSize: size, fontWeight: 900, padding: pad, borderRadius: size * 0.28, letterSpacing: "-0.02em", lineHeight: 1.05, transform: `rotate(${rotate}deg)`, boxShadow: glow ? `0 0 60px ${theme.colors.glow}, 0 20px 40px -10px rgba(0,0,0,.5)` : "0 20px 40px -12px rgba(0,0,0,.55)" }}>{children}</span>
);

export const Check: React.FC<{ size: number; color?: string; bg?: string }> = ({ size, color = "#fff", bg = theme.colors.green }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}><circle cx="20" cy="20" r="19" fill={bg} /><path d="M11 20.5l6 6 12-13" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Cross: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}><circle cx="20" cy="20" r="19" fill={theme.colors.accent} /><path d="M13 13l14 14M27 13L13 27" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" /></svg>
);
