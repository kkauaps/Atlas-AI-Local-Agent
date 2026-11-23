import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { WORDS } from "../timing";
import { theme } from "../theme";
import { sec } from "../time";

// pages of up to 3 words, never crossing a sentence end or segment
type W = (typeof WORDS)[number];
const pages: W[][] = [];
{ let cur: W[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const next = WORDS[i + 1];
    if (cur.length === 3 || !next || next.seg !== w.seg || /[.?!:,]$/.test(w.w)) { pages.push(cur); cur = []; }
  });
}
export const Captions: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = f / fps - theme.voOffset;
  const pi = pages.findIndex((p, i) => t >= p[0].s - 0.05 && (i === pages.length - 1 ? t <= p[p.length - 1].e + 0.6 : t < pages[i + 1][0].s - 0.05));
  if (pi < 0) return null;
  const page = pages[pi];
  const startF = sec(page[0].s + theme.voOffset);
  const p = spring({ frame: f - startF + 2, fps, config: theme.spring.snappy });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: 1475 }}>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", maxWidth: 960, transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`, opacity: p }}>
        {page.map((w, i) => {
          const active = t >= w.s - 0.03 && t <= w.e + 0.08;
          return <span key={i} style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 70, letterSpacing: "-0.02em", textTransform: "uppercase", color: active ? theme.colors.ink : theme.colors.text, background: active ? "#FFFFFF" : "transparent", padding: "2px 14px", borderRadius: 14, transform: `scale(${active ? 1.08 : 1})`, WebkitTextStroke: active ? undefined : "2px rgba(0,0,0,0.85)", textShadow: active ? undefined : "0 6px 18px rgba(0,0,0,0.8)", paintOrder: "stroke fill" } as React.CSSProperties}>{w.w.replace(/[.,:!?]$/, "")}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
