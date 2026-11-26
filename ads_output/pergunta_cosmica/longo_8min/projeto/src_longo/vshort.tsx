import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, Audio, Img, staticFile, useCurrentFrame, interpolate, spring } from "remotion";
import { theme, FPS } from "./theme";
import { BLOCKS } from "./blocks";
import { useFonts, voStart, blockDur, sec, Grade16 } from "./core";
import { Grain, Vignette } from "./components/Layers";
import { Dust } from "./fx";
import { cl } from "./cl";
import { B2HD } from "./b2hd";
import { B1HD } from "./hd_b";

const F = theme.fonts.display;
const END = 100; // end-card frames
/* vertical karaoke captions: 3 words, big, lower third */
const CaptionsV: React.FC<{ k: string; off: number }> = ({ k, off }) => {
  const f = useCurrentFrame() + off;
  const vo = voStart(k); const words = BLOCKS[k].words;
  const pages = useMemo(() => { const p: (typeof words)[] = []; let cur: typeof words = [];
    words.forEach((w, i) => { cur.push(w); const nx = words[i + 1]; if (cur.length === 3 || !nx || /[.?!:,…]$/.test(w.w)) { p.push(cur); cur = []; } }); return p; }, [k]);
  const t = f / FPS - vo;
  const pi = pages.findIndex((p, i) => t >= p[0].s - 0.05 && (i === pages.length - 1 ? t <= p[p.length - 1].e + 0.5 : t < pages[i + 1][0].s - 0.05));
  if (pi < 0) return null;
  const page = pages[pi];
  const p = spring({ frame: f - sec(page[0].s + vo) + 2, fps: FPS, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1440, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 18px", transform: `scale(${0.85 + 0.15 * p})`, opacity: p }}>
        {page.map((w, i) => { const act = t >= w.s - 0.03 && t <= w.e + 0.06;
          return <span key={i} style={{ fontFamily: F, fontWeight: 900, fontSize: 70, textTransform: "uppercase", color: act ? theme.colors.primary : "#fff", WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "0 6px 24px rgba(0,0,0,.9)" }}>{w.w.replace(/[.,:!?…]$/, "")}</span>; })}
      </div>
    </div>
  );
};

export const vShortDur = (k: string, skip: number) => blockDur(k) - sec(skip) + END;
const VShort: React.FC<{ k: string; n: number; skip: number; children: React.ReactNode }> = ({ k, n, skip, children }) => {
  useFonts();
  const f = useCurrentFrame(); const off = sec(skip);
  const mainEnd = sec(voStart(k) + BLOCKS[k].end + 0.6) - off;
  const endP = interpolate(f, [mainEnd, mainEnd + 14], [0, 1], cl);
  const bp = spring({ frame: f - 2, fps: FPS, config: theme.spring.bouncy });
  const lp = spring({ frame: f - mainEnd - 8, fps: FPS, config: theme.spring.bouncy });
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <Sequence from={-off}>
        <AbsoluteFill style={{ opacity: 1 - endP * 0.75, filter: endP > 0 ? `blur(${endP * 14}px)` : undefined }}>{children}</AbsoluteFill>
        <Sequence from={sec(voStart(k))}><Audio src={staticFile(`longo/voice_${k}.wav`)} /></Sequence>
      </Sequence>
      {/* voice is placed with Sequence offset so it lines up with block time */}
      <Dust n={26} />
      {endP < 1 && <AbsoluteFill style={{ opacity: 1 - endP }}><CaptionsV k={k} off={off} /></AbsoluteFill>}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: Math.min(1, bp) * (1 - endP), transform: `translateY(${(1 - bp) * -30}px)` }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 34, letterSpacing: "0.08em", color: "#0b0b12", background: theme.colors.primary, padding: "10px 26px", borderRadius: 14, boxShadow: `0 0 40px ${theme.colors.glow}` }}>COISAS QUE PARECEM MENTIRA · #{n}</div>
      </div>
      {endP > 0 && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 34, opacity: endP }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: `6px solid ${theme.colors.primary}`, boxShadow: `0 0 80px ${theme.colors.glow}`, transform: `scale(${0.6 + 0.4 * lp})` }}><Img src={staticFile("longo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 76, color: "#fff", textAlign: "center" }}>PERGUNTA CÓSMICA</div>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 48, color: theme.colors.primary, textAlign: "center", lineHeight: 1.15 }}>AS 8 COISAS COMPLETAS<br />NO VÍDEO DO CANAL 👆</div>
      </AbsoluteFill>}
      <Grade16 /><Grain /><Vignette />
      <Audio src={staticFile("longo/music_long.wav")} volume={(fr) => interpolate(fr, [0, 15, mainEnd, mainEnd + 20, mainEnd + END], [0, 0.08, 0.08, 0.26, 0], cl)} />
    </AbsoluteFill>
  );
};
// skip "Número dois:" / "E o número um:" so the Short opens straight on the hook
export const SKIP_B2 = voStart("b2") + 1.05;
export const SKIP_B1 = voStart("b1") + 0.88;
export const VShortB2: React.FC = () => <VShort k="b2" n={2} skip={SKIP_B2}><B2HD /></VShort>;
export const VShortB1: React.FC = () => <VShort k="b1" n={1} skip={SKIP_B1}><B1HD /></VShort>;
