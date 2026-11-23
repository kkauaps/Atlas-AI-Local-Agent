import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { theme } from "./theme";
import { cl } from "./three";

export const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.0, color: theme.colors.text, textAlign: "center", textShadow: "0 8px 30px rgba(0,0,0,.85)" };
// absolute-time spring: at = absolute frame, start = scene start frame
export const useAbsSpring = (at: number, start: number, cfg = theme.spring.snappy) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f + start - at, fps, config: cfg });
};
export const Rise: React.FC<{ at: number; start: number; children: React.ReactNode; y?: number; cfg?: any; out?: number; style?: React.CSSProperties }> = ({ at, start, children, y = 40, cfg = theme.spring.snappy, out, style }) => {
  const f = useCurrentFrame();
  const p = useAbsSpring(at, start, cfg);
  const o = out === undefined ? 0 : interpolate(f + start, [out, out + 8], [0, 1], { ...cl, easing: theme.ease.in });
  return <div style={{ opacity: Math.min(1, p * 1.6) * (1 - o), transform: `translateY(${(1 - p) * y - o * 24}px) scale(${0.85 + 0.15 * p})`, ...style }}>{children}</div>;
};
export const Pill: React.FC<{ bg: string; color?: string; size?: number; children: React.ReactNode; glow?: boolean }> = ({ bg, color = theme.colors.ink, size = 54, children, glow }) => {
  const f = useCurrentFrame();
  return <span style={{ display: "inline-block", whiteSpace: "nowrap", background: bg, color, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: size, padding: "0.2em 0.55em", borderRadius: size * 0.3, letterSpacing: "-0.02em", transform: `scale(${1 + Math.sin(f / 24) * 0.012})`, boxShadow: glow ? `0 0 50px ${theme.colors.glow}, 0 18px 36px -12px rgba(0,0,0,.6)` : "0 18px 36px -12px rgba(0,0,0,.6)" }}>{children}</span>;
};
export const Title: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 180 }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top, display: "flex", flexDirection: "column", gap: 10 }}>{children}</AbsoluteFill>
);
// callout anchored to a screen point with leader line
export const Callout: React.FC<{ x: number; y: number; dx: number; dy: number; text: string; at: number; start: number; color?: string; out?: number; size?: number }> = ({ x, y, dx, dy, text, at, start, color = "#fff", out, size = 40 }) => {
  const f = useCurrentFrame();
  const p = useAbsSpring(at, start, theme.spring.smooth);
  const o = out === undefined ? 0 : interpolate(f + start, [out, out + 8], [0, 1], { ...cl, easing: theme.ease.in });
  const vis = Math.min(1, p * 1.5) * (1 - o);
  if (vis <= 0.01) return null;
  const lx = x + dx * p, ly = y + dy * p;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: vis }}>
        <circle cx={x} cy={y} r={9} fill={color} />
        <circle cx={x} cy={y} r={9 + 14 * ((f % 40) / 40)} fill="none" stroke={color} strokeWidth={3} opacity={1 - (f % 40) / 40} />
        <line x1={x} y1={y} x2={lx} y2={ly} stroke={color} strokeWidth={4} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly, transform: `translate(${dx >= 0 ? "0" : "-100%"}, -50%) scale(${0.8 + 0.2 * p})`, transformOrigin: dx >= 0 ? "0 50%" : "100% 50%", opacity: vis }}>
        <span style={{ display: "inline-block", whiteSpace: "nowrap", background: color, color: theme.colors.ink, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: size, padding: "0.18em 0.5em", borderRadius: 14, boxShadow: "0 14px 30px -10px rgba(0,0,0,.6)" }}>{text}</span>
      </div>
    </AbsoluteFill>
  );
};
