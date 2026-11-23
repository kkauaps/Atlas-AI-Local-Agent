import React from "react";
import { AbsoluteFill, useCurrentFrame, random, interpolate } from "remotion";
import { cl } from "./cl";

// floating gold dust with depth (3 parallax layers)
export const Dust: React.FC<{ n?: number }> = ({ n = 46 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: n }).map((_, i) => {
        const depth = 0.4 + random(`dd${i}`) * 1.2;
        const x = (random(`dx${i}`) * 1180 + Math.sin(f / (60 + i) + i) * 30 * depth - f * 0.25 * depth + 2400) % 1180 - 50;
        const y = (random(`dy${i}`) * 2000 - f * 0.6 * depth + 4000) % 2000 - 40;
        const s = 3 + depth * 5;
        const tw = 0.25 + 0.55 * Math.abs(Math.sin(f / (18 + i % 7) + i));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,226,150,1), rgba(227,179,65,0) 70%)", opacity: tw * 0.7, filter: depth > 1.2 ? "blur(2px)" : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

// warm light leak flash on each cut
export const LightLeaks: React.FC<{ cuts: number[] }> = ({ cuts }) => {
  const f = useCurrentFrame();
  const near = cuts.find((c) => f >= c - 8 && f <= c + 10);
  if (near === undefined) return null;
  const p = interpolate(f, [near - 8, near, near + 10], [0, 1, 0], cl);
  const x = interpolate(f, [near - 8, near + 10], [-40, 140], cl);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: p * 0.75 }}>
      <div style={{ position: "absolute", left: `${x - 60}%`, top: "-20%", width: "90%", height: "140%", transform: "rotate(18deg)", background: "linear-gradient(90deg, transparent, rgba(255,170,60,.55), rgba(255,236,190,.8), rgba(255,120,40,.45), transparent)", filter: "blur(40px)" }} />
    </AbsoluteFill>
  );
};

// shine sweep across a text block
export const Shine: React.FC<{ at: number; start: number; children: React.ReactNode }> = ({ at, start, children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f + start, [at + 6, at + 26], [-30, 130], cl);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {children}
      {p > -30 && p < 130 && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay", background: `linear-gradient(110deg, transparent ${p - 20}%, rgba(255,255,255,.9) ${p}%, transparent ${p + 20}%)` }} />}
    </div>
  );
};
