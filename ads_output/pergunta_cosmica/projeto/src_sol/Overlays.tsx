import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random, Sequence } from "remotion";
import { theme } from "./theme";
import { sec, wordFrame, segStart, TOTAL } from "./time";
import { K } from "./Space";
import { Enter, Pill, useSpring, Breathe } from "./components/Motion";

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const H: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.0, color: theme.colors.text, textAlign: "center", textShadow: "0 8px 30px rgba(0,0,0,.85)" };
const Top: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 200 }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top, display: "flex", flexDirection: "column", gap: 14 }}>{children}</AbsoluteFill>
);
// Window: shows children between [from,to) with exit
const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = interpolate(f, [to - 8, to], [1, 0], { ...cl, easing: theme.ease.in });
  return <Sequence from={from} durationInFrames={to - from}><AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - o) * -30}px)` }}>{children}</AbsoluteFill></Sequence>;
};

// absolute-time window (children read the global frame)
const WinAbs: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = interpolate(f, [to - 8, to], [1, 0], { ...cl, easing: theme.ease.in });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${(1 - o) * -30}px)` }}>{children}</AbsoluteFill>;
};

const Timer: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const p = interpolate(t, [K.vanish, K.dark], [0, 1], cl);
  const secs = Math.round(p * 500);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  const hit = t >= K.dark;
  const flash = hit ? 0.5 + 0.5 * Math.sin((t - K.dark) * 14) : 0;
  const show = useSpring(sec(K.s1) - 4, theme.spring.snappy);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 190, display: "flex", flexDirection: "column" }}>
      <div style={{ opacity: show, transform: `scale(${0.8 + 0.2 * show})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 30, letterSpacing: "0.12em", color: theme.colors.textDim }}>SEM O SOL HÁ</div>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 150, fontVariantNumeric: "tabular-nums", color: hit ? `rgb(255,${Math.round(70 + 120 * (1 - flash))},${Math.round(70 + 120 * (1 - flash))})` : "#FFFFFF", textShadow: hit ? "0 0 50px rgba(255,60,60,.6)" : "0 0 40px rgba(255,255,255,.25)" }}>{mm}:{ss}</div>
      </div>
    </AbsoluteFill>
  );
};

const Thermo: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const tWeek = sec(0) + 0; // unused
  const a = K.s6, b = wordTsafe(6, "zero"), c = K.year + 0.6;
  const temp = t < b ? interpolate(t, [a + 0.3, b], [15, -18], { ...cl, easing: theme.ease.inOut }) : interpolate(t, [b + 0.4, c], [-18, -73], { ...cl, easing: theme.ease.inOut });
  const label = t < a + 1.2 ? "HOJE" : t < b + 0.4 ? "1 SEMANA" : "1 ANO";
  const show = useSpring(sec(a) - 2, theme.spring.snappy);
  const fill = interpolate(temp, [-80, 30], [0.04, 1], cl);
  const col = temp > 0 ? "#F97316" : temp > -30 ? "#38BDF8" : "#A5F3FC";
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
      <div style={{ opacity: show, transform: `translateY(${(1 - show) * 40}px)`, display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ width: 54, height: 330, borderRadius: 27, background: "rgba(255,255,255,0.12)", border: "3px solid rgba(255,255,255,0.35)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${fill * 100}%`, background: col, boxShadow: `0 0 30px ${col}` }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 800, fontSize: 44, color: theme.colors.textDim, letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 170, fontVariantNumeric: "tabular-nums", color: col, textShadow: `0 0 40px ${col}88`, lineHeight: 1 }}>{Math.round(temp)}°C</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
import { wordT } from "./time";
const wordTsafe = (s: number, w: string) => { try { return wordT(s, w); } catch { return K.s6 + 3; } };

/* ocean cross-section (2D) */
const Ocean: React.FC = () => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig();
  const pan = interpolate(f, [10, d - 20], [0, -1250], { ...cl, easing: theme.ease.inOut });
  const vents = [[260, 2900, 1.0], [560, 2960, 1.3], [840, 2920, 0.9]];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#020617" }}>
      <div style={{ position: "absolute", left: 0, top: pan, width: 1080, height: 3200 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#0c2a4a 0%,#0a1f3d 25%,#06142b 55%,#030a18 80%,#120806 100%)" }} />
        {/* ice crust */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 520, background: "linear-gradient(180deg,#f0f9ff 0%,#bae6fd 55%,#7dd3fc 100%)", boxShadow: "0 30px 60px rgba(125,211,252,.35)" }} />
        <svg width="1080" height="560" style={{ position: "absolute", top: 0 }}>
          {Array.from({ length: 14 }).map((_, i) => { const x = random(`c${i}`) * 1080; return <path key={i} d={`M${x} 0 L${x + 30 - random(`d${i}`) * 60} ${150 + random(`e${i}`) * 200} L${x + 10} ${300 + random(`f${i}`) * 220}`} stroke="rgba(14,116,144,.5)" strokeWidth="3" fill="none" />; })}
          <path d="M0 520 Q 120 490 240 525 T 480 515 T 720 530 T 960 512 T 1080 520 L1080 560 L0 560Z" fill="#7dd3fc" />
        </svg>
        {/* light rays */}
        {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ position: "absolute", left: 80 + i * 170 + Math.sin(f / 40 + i) * 20, top: 520, width: 60, height: 900, background: "linear-gradient(180deg, rgba(125,211,252,.12), transparent)", transform: "skewX(-8deg)", filter: "blur(6px)" }} />)}
        {/* particles */}
        {Array.from({ length: 70 }).map((_, i) => { const y = 600 + random(`py${i}`) * 2400; return <div key={i} style={{ position: "absolute", left: random(`px${i}`) * 1080 + Math.sin(f / 30 + i) * 10, top: y - (f * 0.4) % 60, width: 4, height: 4, borderRadius: 2, background: "rgba(186,230,253,.35)" }} />; })}
        {/* seabed */}
        <svg width="1080" height="420" style={{ position: "absolute", top: 2800 }}>
          <path d="M0 160 Q 150 120 300 150 T 600 140 T 900 160 T 1080 150 L1080 420 L0 420Z" fill="#1c1210" />
          {vents.map(([x, , s], i) => (
            <g key={i} transform={`translate(${x},${150 - 20}) scale(${s})`}>
              <path d="M-40 60 L-24 -90 L-10 -110 L10 -110 L24 -90 L40 60Z" fill="#2b1a14" stroke="#4a2a1e" strokeWidth="3" />
              <ellipse cx="0" cy="-112" rx="20" ry="8" fill="#ff7a1a" />
            </g>
          ))}
        </svg>
        {/* vent glow + plumes */}
        {vents.map(([x, , s], i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x - 140, top: 2800 + 30 - 140, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,140,40,.55), transparent 65%)", filter: "blur(8px)", opacity: 0.7 + 0.3 * Math.sin(f / 8 + i) }} />
            {Array.from({ length: 10 }).map((_, k) => { const ph = ((f * 1.6 + k * 30 + i * 13) % 300); return <div key={k} style={{ position: "absolute", left: x - 8 + Math.sin((f + k * 20) / 12) * 14, top: 2800 + 30 - ph * 2.2, width: 14 + ph / 18, height: 14 + ph / 18, borderRadius: "50%", background: "rgba(90,70,60,.45)", filter: "blur(4px)", opacity: 1 - ph / 300 }} />; })}
            {/* tube worms */}
            {Array.from({ length: 5 }).map((_, k) => { const wx = x + 50 + k * 16 * (i % 2 ? -1 : 1); const h = 70 + random(`w${i}${k}`) * 60; return (
              <div key={k} style={{ position: "absolute", left: wx, top: 2950 - h, width: 8, height: h, background: "linear-gradient(#ef4444 0 18%, #f1f5f9 18%)", borderRadius: 4, transform: `rotate(${Math.sin(f / 15 + k) * 6}deg)`, transformOrigin: "50% 100%" }} />); })}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Label: React.FC<{ text: string; color: string; delay: number; size?: number }> = ({ text, color, delay, size = 60 }) => (
  <Enter delay={delay} cfg={theme.spring.bouncy}><Breathe amt={0.012} speed={24}><Pill bg={color} color={theme.colors.ink} size={size}>{text}</Pill></Breathe></Enter>
);

export const Overlays: React.FC = () => {
  const F = (s: number) => sec(s);
  const oceanIn = segStart(7) - 8;
  const ctaIn = segStart(9) - 6;
  return (
    <AbsoluteFill>
      {/* 0: hook */}
      <Win from={0} to={F(K.s1) - 2}>
        <Top top={250}>
          <Enter delay={2} cfg={theme.spring.snappy}><div style={{ ...H, fontSize: 120 }}>E SE O SOL</div></Enter>
          <Enter delay={wordFrame(0, "desaparecesse") - 2} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 98, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>SUMISSE AGORA?</div></Enter>
        </Top>
      </Win>
      {/* timer s1..s5 */}
      <WinAbs from={F(K.s1) - 4} to={segStart(5) - 2}><Timer /></WinAbs>
      <Win from={F(K.s1)} to={segStart(2) - 2}><Top top={430}><Label text="E NINGUÉM PERCEBE" color="#fff" delay={wordFrame(1, "perceber") - F(K.s1) - 4} /></Top></Win>
      <Win from={segStart(2)} to={segStart(3) - 2}><Top top={430}><Label text="LUZ: 8 MIN 20 S ATÉ AQUI" color={theme.colors.primary} delay={wordFrame(2, "oito") - segStart(2) - 4} /></Top></Win>
      <Win from={segStart(3)} to={F(K.dark) - 2}><Top top={430}>
        <Label text="GRAVIDADE TAMBÉM" color={theme.colors.accent} delay={wordFrame(3, "gravidade") - segStart(3) - 4} />
        <Label text="VIAJA NA VELOCIDADE DA LUZ" color={theme.colors.accent} size={44} delay={wordFrame(3, "velocidade") - segStart(3) - 4} />
      </Top></Win>
      <Win from={F(K.dark) - 2} to={segStart(5) - 2}><Top top={430}>
        <Label text="ESCURIDÃO TOTAL" color="#fff" delay={2} />
        <Label text="A LUA APAGA JUNTO" color="#94A3B8" size={48} delay={wordFrame(4, "lua") - F(K.dark) - 2} />
      </Top></Win>
      <Win from={segStart(5)} to={segStart(6) - 2}><Top top={260}>
        <Enter delay={4}><div style={{ ...H, fontSize: 96 }}>SEM ÓRBITA</div></Enter>
        <Label text="LINHA RETA PELO ESPAÇO" color={theme.colors.green} delay={wordFrame(5, "reta") - segStart(5) - 4} />
      </Top></Win>
      <WinAbs from={segStart(6) - 2} to={oceanIn + 6}><Thermo /></WinAbs>
      {/* ocean */}
      <Sequence from={oceanIn} durationInFrames={ctaIn - oceanIn + 4}>
        <OceanWrap labels />
      </Sequence>
      {/* CTA */}
      <Sequence from={ctaIn}>
        <Top top={110}>
          <LogoBadge />
          <Enter delay={8} cfg={theme.spring.snappy}><div style={{ ...H, fontSize: 44, fontWeight: 800, color: theme.colors.textDim, letterSpacing: "0.04em" }}>SEGUE O</div></Enter>
          <Enter delay={9} cfg={theme.spring.bouncy} from={0.6}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ ...H, fontSize: 98 }}>PERGUNTA</div>
              <div style={{ ...H, fontSize: 98, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}`, marginTop: -6 }}>CÓSMICA</div>
            </div>
          </Enter>
          <Enter delay={16}><div style={{ ...H, fontSize: 40, fontWeight: 800, color: theme.colors.textDim }}>pra mais curiosidades do universo</div></Enter>
        </Top>
        <Top top={1330}>
          <Enter delay={22} cfg={theme.spring.bouncy}>
            <Breathe amt={0.04} speed={7}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#FFFFFF", color: theme.colors.ink, fontFamily: theme.fonts.display, fontWeight: 900, fontSize: 56, padding: "26px 52px", borderRadius: 999, boxShadow: "0 0 50px rgba(255,255,255,.35)" }}>
                <svg width="46" height="46" viewBox="0 0 40 40"><path d="M20 6v28M6 20h28" stroke={theme.colors.ink} strokeWidth="6" strokeLinecap="round" /></svg>SEGUIR
              </div>
            </Breathe>
          </Enter>
        </Top>
      </Sequence>
    </AbsoluteFill>
  );
};

import { Img, staticFile } from "remotion";
const LogoBadge: React.FC = () => {
  const f = useCurrentFrame();
  const p = useSpring(2, theme.spring.bouncy);
  return (
    <div style={{ width: 190, height: 190, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", opacity: Math.min(1, p * 1.5),
      transform: `scale(${p * (1 + Math.sin(f / 20) * 0.02)}) rotate(${(1 - p) * -40}deg) translateY(${Math.sin(f / 26) * 4}px)`, marginBottom: 8 }}>
      <Img src={staticFile("sol/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
    </div>
  );
};

const OceanWrap: React.FC<{ labels?: boolean }> = () => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig();
  const inP = interpolate(f, [0, 12], [0, 1], { ...cl, easing: theme.ease.out });
  const outP = interpolate(f, [d - 9, d], [0, 1], { ...cl, easing: theme.ease.in });
  const base = segStart(7) - 8;
  const rel = (s: number, w: string) => wordFrame(s, w) - base;
  const blur = (1 - inP) * 16 + outP * 14;
  return (
    <AbsoluteFill style={{ opacity: inP * (1 - outP), transform: `scale(${(1.25 - 0.25 * inP) * (1 - 0.12 * outP)})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      <Ocean />
      <Win from={0} to={rel(7, "fundo") - 6}><Top top={600}>
        <Label text="SUPERFÍCIE: GELO" color="#E0F2FE" delay={rel(7, "congelariam") - 4} />
      </Top></Win>
      <Win from={rel(7, "fundo") - 4} to={rel(8, "fontes") - 4}><Top top={260}>
        <Label text="NO FUNDO: ÁGUA LÍQUIDA" color={theme.colors.green} delay={0} />
        <Label text="AQUECIDA PELO CALOR DA TERRA" color="#FDBA74" size={42} delay={rel(7, "calor") - rel(7, "fundo") + 2} />
      </Top></Win>
      <Win from={rel(8, "fontes") - 4} to={d}><Top top={260}>
        <Label text="FONTES HIDROTERMAIS" color="#FB923C" delay={0} />
        <Label text="A VIDA AINDA RESISTE" color="#fff" size={48} delay={rel(8, "vida") - rel(8, "fontes") + 2} />
      </Top></Win>
    </AbsoluteFill>
  );
};
