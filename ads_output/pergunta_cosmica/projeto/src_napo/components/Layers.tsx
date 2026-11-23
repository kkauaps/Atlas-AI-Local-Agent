import React from "react";
import { AbsoluteFill, useCurrentFrame, random, interpolate } from "remotion";
import { theme } from "../theme";

export const BgMesh: React.FC<{ a?: string; b?: string; base?: string }> = ({ a = theme.colors.accent, b = theme.colors.primary, base = theme.colors.bg }) => {
  const f = useCurrentFrame();
  const d1 = Math.sin(f / 55) * 60, d2 = Math.cos(f / 70) * 50;
  return (
    <AbsoluteFill style={{ background: base }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", top: -520, left: -420 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${a}55, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -420, right: -360 - d2, filter: "blur(80px)", background: `radial-gradient(circle, ${b}30, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

export const Bokeh: React.FC<{ count?: number; color?: string }> = ({ count = 14, color = theme.colors.primary }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = random(`bx${i}`) * 1080, y = random(`by${i}`) * 1920, r = 30 + random(`br${i}`) * 90;
        const drift = Math.sin(f / (40 + i * 3) + i) * 30;
        const o = 0.12 + 0.12 * Math.sin(f / (25 + i) + i * 2);
        return <div key={i} style={{ position: "absolute", left: x + drift, top: y - (f * (0.3 + random(`bs${i}`) * 0.6)) % 2100 + 100, width: r, height: r, borderRadius: "50%", background: i % 3 === 0 ? theme.colors.accent : color, opacity: o, filter: "blur(18px)" }} />;
      })}
    </AbsoluteFill>
  );
};

export const Snow: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const sp = 1.2 + random(`ss${i}`) * 3.5, r = 2 + random(`sr${i}`) * 6;
        const y = (random(`sy${i}`) * 1920 + f * sp) % 1960 - 20;
        const x = random(`sx${i}`) * 1080 + Math.sin(f / 30 + i) * 22;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "#fff", opacity: 0.35 + random(`so${i}`) * 0.5, filter: r > 6 ? "blur(1.5px)" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, mixBlendMode: "soft-light", opacity: 0.2 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 22%, transparent 70%, rgba(0,0,0,0.45))" }} />
  </AbsoluteFill>
);

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px", backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: 0.09, mixBlendMode: "overlay" }} />;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.5) 100%)" }} />
);

export const Flash: React.FC<{ at: number; len?: number }> = ({ at, len = 8 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, 0.95, 0], { easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#fff", opacity: o, pointerEvents: "none" }} />;
};
