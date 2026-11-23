import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random, Easing, Img, staticFile } from "remotion";
import { theme } from "./theme";
import { wordT, segT, sec } from "./time";
import { cl } from "./cl";
import { H, Rise, Pill, Title, useAbsSpring } from "./ui";
import { Napo, MapSvg, Arrow, Pin, Ship, pt, bez } from "./art";
import { BgMesh } from "./components/Layers";
import { Napo3D } from "./napo3d";
import { Shine } from "./fx";
import { Board, Army, makePath, SnowFall } from "./board";
import * as THREE from "three";

type P = { start: number };
const useT = (start: number) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return (f + start) / fps; };
const F = (s: number) => sec(s);
const W = (seg: number, w: string, n = 0) => F(wordT(seg, w, n));
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };
const Card: React.FC<{ top: number; children: React.ReactNode; p?: number; style?: React.CSSProperties }> = ({ top, children, p = 1, style }) => (
  <div style={{ position: "absolute", left: 40, top, width: 1000, borderRadius: 34, overflow: "hidden", border: "3px solid rgba(227,179,65,0.35)", boxShadow: "0 40px 90px -30px rgba(0,0,0,.85)", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 80}px) scale(${0.92 + 0.08 * p})`, ...style }}>{children}</div>
);
const Rays: React.FC<{ y: number; o: number }> = ({ y, o }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 540 - 700, top: y - 700, width: 1400, height: 1400, opacity: o, transform: `rotate(${f * 0.2}deg)`, background: `repeating-conic-gradient(from 0deg, rgba(227,179,65,.16) 0deg 6deg, transparent 6deg 18deg)`, maskImage: "radial-gradient(circle, black 20%, transparent 65%)", WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 65%)" }} />;
};

/* 0 — HOOK */
export const Hook: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const fig = useAbsSpring(start + 2, start, theme.spring.smooth);
  const zoom = interpolate(f, [0, 120], [1.0, 1.06], { ...cl, easing: eio });
  const dom = useAbsSpring(W(0, "dominou") - 3, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.accent} b={theme.colors.primary} base={theme.colors.bg} />
      <Rays y={1000} o={fig} />
      <AbsoluteFill style={{ opacity: fig, transform: `translateY(${(1 - fig) * 140}px) scale(${zoom})` }}><Napo3D camDist={8.0} camY={1.8} tgtY={1.45} /></AbsoluteFill>
      <Title top={170}>
        <Rise at={start + 6} start={start}><div style={{ ...H, fontSize: 82 }}>ZOADO NA ESCOLA…</div></Rise>
        <Rise at={W(0, "dominou") - 3} start={start} cfg={theme.spring.bouncy}><Shine at={W(0, "dominou")} start={start}><div style={{ ...H, fontSize: 86, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}`, transform: `scale(${0.9 + 0.1 * dom})` }}>DOMINOU A EUROPA</div></Shine></Rise>
      </Title>
    </AbsoluteFill>
  );
};

/* 1 — BIRTH: Corsica */
export const Birth: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const mp = useAbsSpring(F(segT(1)), start, theme.spring.smooth);
  const zoom = interpolate(t, [segT(1), segT(2)], [2.6, 3.6], { ...cl, easing: eio });
  const fr = interpolate(t, [wordT(1, "francesa") - 0.3, wordT(1, "francesa") + 0.5], [0, 0.55], cl);
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      <Title top={150}><Rise at={W(1, "mil") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 110, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>1769</div></Rise></Title>
      <Card top={340} p={mp}>
        <MapSvg k="eu" width={1000} zoom={zoom} origin={pt("corsega")} fills={{ FRA: [theme.colors.empire, fr] }}>
          <Pin at={pt("corsega")} label="CÓRSEGA" p={interpolate(t, [wordT(1, "corsega") - 0.3, wordT(1, "corsega") + 0.2], [0, 1], cl)} zoom={zoom} dx={30} dy={-40} />
        </MapSvg>
      </Card>
      <AbsoluteFill style={{ top: 1110, alignItems: "center" }}><Rise at={W(1, "francesa") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.empire} color="#fff" size={40}>FRANCESA DESDE 1768</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 2 — SCHOOL BULLYING */
const Kid: React.FC<{ h: number; color?: string; f: number; i?: number; sad?: boolean }> = ({ h, color = "#334155", f, i = 0, sad }) => (
  <svg width={h * 0.5} height={h} viewBox="0 0 100 200" style={{ overflow: "visible" }}>
    <g transform={`translate(0 ${Math.sin(f / 10 + i) * (sad ? 0.5 : 2)})`}>
      <rect x="30" y="140" width="16" height="56" rx="6" fill="#1f2937" /><rect x="54" y="140" width="16" height="56" rx="6" fill="#1f2937" />
      <path d="M24 72 L76 72 L80 148 L20 148Z" fill={color} />
      <circle cx="50" cy="48" r="24" fill="#E9C3A1" />
      {sad ? <path d="M40 60 Q50 54 60 60" stroke="#3b2a1e" strokeWidth="3" fill="none" /> : <path d="M38 56 Q50 66 62 56" stroke="#3b2a1e" strokeWidth="3" fill="none" />}
      <circle cx="42" cy="44" r="3" fill="#1b1b1f" /><circle cx="58" cy="44" r="3" fill="#1b1b1f" />
      <path d="M26 40 Q50 14 74 40 Q62 28 50 30 Q38 28 26 40Z" fill="#3b2a1e" />
    </g>
  </svg>
);
export const School: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame(); const t = useT(start);
  const bubbles: [string, string, number, number, number][] = [
    ["SOTAQUE ESQUISITO!", "sotaque", 60, 640, -6], ["POBRE!", "pobreza", 640, 560, 5], ["QUE NOME É ESSE?", "nome", 80, 1020, 4],
  ];
  const nick = useAbsSpring(W(2, "apelido") - 4, start, theme.spring.bouncy);
  const tr = useAbsSpring(W(2, "palha") - 4, start, theme.spring.bouncy);
  const sp = useAbsSpring(F(segT(2)), start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#7f1d1d" b="#334155" base="#0d1120" />
      <Title top={150}>
        <Rise at={F(segT(2)) + 2} start={start}><div style={{ ...H, fontSize: 56 }}>ESCOLA MILITAR DE BRIENNE</div></Rise>
        <Rise at={W(2, "nove") - 4} start={start}><Pill bg="#fff" size={38}>AOS 9 ANOS · 1779</Pill></Rise>
      </Title>
      {/* kids circle */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, height: 520, opacity: sp }}>
        {[[30, "#7c2d12"], [210, "#14532d"], [700, "#7c2d12"], [880, "#4b5563"]].map(([x, c]: any, i) => (
          <div key={i} style={{ position: "absolute", left: x, top: 60 + (i % 2) * 40, opacity: 0.75, transform: `scaleX(${x > 540 ? -1 : 1})` }}><Kid h={400} color={c} f={f} i={i} /></div>
        ))}
        <div style={{ position: "absolute", left: 540 - 170, top: 40, width: 340, height: 520, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(227,179,65,.35), transparent 65%)" }} />
        <div style={{ position: "absolute", left: 445, top: 150 }}><Kid h={380} color="#1F3A93" f={f} sad /></div>
        <div style={{ position: "absolute", left: 540, top: 100, transform: "translateX(-50%)" }}><Pill bg={theme.colors.primary} size={32} glow>NAPOLEONE</Pill></div>
      </div>
      {bubbles.map(([txt, w, x, y, r], i) => {
        const p = useAbsSpring(W(2, w) - 4, start, theme.spring.bouncy);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, opacity: Math.min(1, p * 1.5), transform: `scale(${p}) rotate(${r}deg)` }}>
            <div style={{ position: "relative", background: "#fff", color: "#7f1d1d", ...S, fontSize: 40, padding: "16px 26px", borderRadius: 26 }}>{txt}
              <div style={{ position: "absolute", bottom: -18, left: 40, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: "20px solid #fff" }} />
            </div>
          </div>
        );
      })}
      <AbsoluteFill style={{ top: 1200, alignItems: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ opacity: nick, transform: `scale(${0.6 + 0.4 * nick}) rotate(-3deg)`, background: theme.colors.accent, padding: "16px 34px", borderRadius: 20, ...H, fontSize: 64, fontStyle: "italic", color: "#fff", textShadow: "none" }}>“La paille au nez”</div>
        <div style={{ opacity: tr, transform: `translateY(${(1 - tr) * 20}px)` }}><Pill bg="#fff" size={36}>= “PALHA NO NARIZ” (TROCADILHO COM NAPOLEONE)</Pill></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 3 — BOOKS & MATH */
export const Books: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const sp = useAbsSpring(F(segT(3)), start, theme.spring.smooth);
  const hist = useAbsSpring(W(3, "historia") - 4, start, theme.spring.bouncy);
  const mat = useAbsSpring(W(3, "matematica") - 4, start, theme.spring.bouncy);
  const formulas = ["a² + b² = c²", "π r²", "∑", "√2", "x = −b ± √Δ", "sen θ", "∫", "Δ = b² − 4ac"];
  return (
    <AbsoluteFill>
      <BgMesh a="#78350f" b={theme.colors.primary} base="#120d08" />
      <div style={{ position: "absolute", left: 540 - 380, top: 520, width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,196,90,.35), transparent 65%)", opacity: sp }} />
      {formulas.map((fm, i) => { const a = (i / formulas.length) * Math.PI * 2 + f / 90; return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * 380 - 80, top: 900 + Math.sin(a) * 300, ...S, fontSize: 40, color: theme.colors.primary, opacity: mat * (0.5 + 0.4 * Math.sin(f / 15 + i)), transform: `scale(${mat})` }}>{fm}</div>; })}
      <Title top={150}><Rise at={F(segT(3)) + 2} start={start}><div style={{ ...H, fontSize: 84 }}>O REFÚGIO</div></Rise><Rise at={F(segT(3)) + 6} start={start}><div style={{ ...H, fontSize: 84, color: theme.colors.primary }}>NOS LIVROS</div></Rise></Title>
      <AbsoluteFill style={{ alignItems: "center", top: 620, opacity: sp, transform: `translateY(${(1 - sp) * 80}px)` }}>
        <svg width="560" height="520" viewBox="0 0 280 260">
          {[0, 1, 2, 3].map((i) => <rect key={i} x={50 + (i % 2) * 6} y={200 - i * 24} width={180} height={22} rx={3} fill={["#7f1d1d", "#1e3a8a", "#14532d", "#78350f"][i]} stroke="#e7dcc2" strokeWidth={2} />)}
          <g transform={`translate(140 108) rotate(${Math.sin(f / 20) * 2})`}>
            <path d="M-90 0 Q-45 -18 0 0 L0 60 Q-45 42 -90 60Z" fill="#F3EBDD" stroke="#8B7651" strokeWidth="2" />
            <path d="M90 0 Q45 -18 0 0 L0 60 Q45 42 90 60Z" fill="#EFE3C6" stroke="#8B7651" strokeWidth="2" />
            {[10, 22, 34, 46].map((y) => <g key={y}><line x1={-78} x2={-12} y1={y} y2={y - 4} stroke="#b8a77f" strokeWidth={2} /><line x1={12} x2={78} y1={y - 4} y2={y} stroke="#b8a77f" strokeWidth={2} /></g>)}
          </g>
          <path d={`M140 ${70 - (f % 30)} q6 -8 0 -16`} stroke="rgba(255,255,255,.3)" strokeWidth="3" fill="none" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1190, alignItems: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ opacity: hist, transform: `scale(${0.7 + 0.3 * hist})` }}><Pill bg="#fff" size={40}>DEVORAVA HISTÓRIA</Pill></div>
        <div style={{ opacity: mat, transform: `scale(${0.7 + 0.3 * mat})` }}><Pill bg={theme.colors.primary} size={40} glow>O MELHOR EM MATEMÁTICA</Pill></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 5 — GENERAL + MONTENOTTE */
export const General: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const mp = useAbsSpring(F(segT(5)), start, theme.spring.smooth);
  const g = useAbsSpring(W(5, "general") - 4, start, theme.spring.bouncy);
  const sw = useAbsSpring(W(5, "montenotte") - 3, start, theme.spring.bouncy);
  const zoom = interpolate(t, [wordT(5, "seis"), segT(6)], [2.4, 3.0], { ...cl, easing: eio });
  const M = pt("montenotte");
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      <Title top={150}>
        <div style={{ opacity: g, transform: `scale(${0.7 + 0.3 * g})`, display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ ...S, fontSize: 64, color: theme.colors.primary }}>★</div><div style={{ ...H, fontSize: 76 }}>GENERAL AOS 24</div><div style={{ ...S, fontSize: 64, color: theme.colors.primary }}>★</div>
        </div>
        <Rise at={W(5, "seis") - 2} start={start}><Pill bg="#fff" size={38}>1796 · CAMPANHA DA ITÁLIA</Pill></Rise>
      </Title>
      <Card top={430} p={mp}>
        <MapSvg k="eu" width={1000} zoom={zoom} origin={M} fills={{ FRA: [theme.colors.empire, 0.5] }}>
          <g transform={`translate(${M[0]} ${M[1]}) scale(${(0.4 + 0.6 * sw) / zoom}) rotate(${(1 - sw) * 90})`} opacity={sw}>
            <path d="M-50 -50 L50 50 M50 -50 L-50 50" stroke="#E5E7EB" strokeWidth={12} strokeLinecap="round" />
            <path d="M-60 -38 L-38 -60 M60 -38 L38 -60" stroke={theme.colors.primary} strokeWidth={10} strokeLinecap="round" />
          </g>
          <Pin at={M} label="MONTENOTTE" p={sw} zoom={zoom} dx={34} dy={-44} />
        </MapSvg>
      </Card>
      <AbsoluteFill style={{ top: 1230, alignItems: "center" }}><Rise at={W(5, "montenotte") + 6} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={40} glow>1ª GRANDE VITÓRIA · AOS 26</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 6 — THE QUOTE */
export const Quote: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const qStart = W(6, "minha");
  const words = ["Minha", "nobreza", "começa", "em", "Montenotte."];
  const ctx = useAbsSpring(F(segT(6)), start, theme.spring.smooth);
  const card = useAbsSpring(qStart - 6, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#4c1d95" b={theme.colors.primary} base="#0b0a18" />
      <AbsoluteFill style={{ opacity: 0.55 }}><Napo3D camDist={9.5} camY={1.6} tgtY={2.3} glow="#a78bfa" /></AbsoluteFill>
      <Title top={150}><Rise at={F(segT(6)) + 2} start={start} out={qStart - 8}><div style={{ ...S, fontSize: 40, color: theme.colors.textDim, textAlign: "center", maxWidth: 900 }}>QUANDO TENTARAM ACHAR</div><div style={{ ...S, fontSize: 40, color: theme.colors.textDim, textAlign: "center" }}>ANTEPASSADOS NOBRES PRA ELE…</div></Rise></Title>
      <AbsoluteFill style={{ top: 520, alignItems: "center" }}>
        <div style={{ width: 920, padding: "60px 56px 44px", borderRadius: 34, background: "rgba(11,16,36,.82)", border: `3px solid ${theme.colors.primary}`, boxShadow: `0 0 80px ${theme.colors.glow}`, opacity: Math.min(1, card * 1.4), transform: `scale(${0.88 + 0.12 * card})`, position: "relative" }}>
          <div style={{ position: "absolute", top: -70, left: 30, ...H, fontSize: 200, color: theme.colors.primary, textShadow: "none", lineHeight: 1 }}>“</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center" }}>
            {words.map((w, i) => {
              const p = useAbsSpring(qStart + i * 6, start, theme.spring.snappy);
              return <span key={i} style={{ ...H, fontStyle: "italic", fontSize: 96, color: i === 4 ? theme.colors.primary : "#fff", opacity: p, transform: `translateY(${(1 - p) * 30}px)`, display: "inline-block", textShadow: "none" }}>{w}</span>;
            })}
          </div>
          <div style={{ ...S, fontSize: 30, color: theme.colors.textDim, textAlign: "right", marginTop: 26, opacity: card }}>— NAPOLEÃO (FRASE ATRIBUÍDA)</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1180, alignItems: "center" }}><Rise at={qStart + 40} start={start}><Pill bg="#fff" size={34}>A NOBREZA DELE VINHA DAS CONQUISTAS</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 7 — CORONATION */
export const Coronation: React.FC<P> = ({ start }) => {
  const crownP = useAbsSpring(W(7, "coroa") - 2, start, { damping: 16, stiffness: 70, mass: 1 });
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      <Rays y={900} o={1} />
      <Title top={160}><Rise at={W(7, "imperador") - 4} start={start} cfg={theme.spring.bouncy}><Shine at={W(7, "imperador")} start={start}><div style={{ ...H, fontSize: 84 }}>IMPERADOR AOS 35</div></Shine></Rise><Rise at={W(7, "coroacao") - 2} start={start}><Pill bg={theme.colors.primary} size={40} glow>1804 · ELE MESMO SE COROOU</Pill></Rise></Title>
      <AbsoluteFill><Napo3D crown={crownP} camDist={8.4} camY={2.0} tgtY={1.55} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 1 — HEIGHT + INCHES + CARICATURE */
const Ruler: React.FC<{ top: number; h: number }> = ({ top, h }) => (
  <svg width={1000} height={h + 40} style={{ position: "absolute", left: 40, top: top - 20 }}>
    {[150, 160, 170, 180].map((cm) => { const y = 20 + h - ((cm - 140) / 50) * h; return (<g key={cm}><line x1={60} x2={980} y1={y} y2={y} stroke="rgba(255,255,255,.18)" strokeWidth={2} strokeDasharray="8 10" /><text x={0} y={y + 10} fill={theme.colors.textDim} fontFamily="Montserrat" fontWeight={800} fontSize={28}>{(cm / 100).toFixed(2).replace(".", ",")}</text></g>); })}
  </svg>
);
export const Height: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const inch = W(4, "polegada"); const charge = W(4, "charges");
  const phase2 = f + start >= inch - 8, phase3 = f + start >= charge - 8;
  const p1o = interpolate(f + start, [inch - 10, inch - 2], [1, 0], cl);
  const chartTop = 470, chartH = 760;
  // figure heights: map 1.40m->0, 1.90m->chartH
  const fh = (m: number) => ((m - 1.4) / 0.5) * chartH;
  const figs: [number, string, "color" | "grey", number][] = [[1.65, "FRANCÊS MÉDIO", "grey", 6], [1.68, "NAPOLEÃO", "color", 0], [1.73, "BRASILEIRO MÉDIO", "grey", 12]];
  const ip = useAbsSpring(inch - 4, start, theme.spring.smooth);
  const eq = useAbsSpring(W(4, "inglesa") - 2, start, theme.spring.bouncy);
  const cp = useAbsSpring(charge - 4, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      {!phase2 && (
        <AbsoluteFill style={{ opacity: p1o }}>
          <Title top={150}>
            <Rise at={W(4, "metro") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 130, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>1,68 m</div></Rise>
            <Rise at={W(4, "normal") - 4} start={start}><Pill bg="#fff" size={42}>ALTURA NORMAL NA ÉPOCA</Pill></Rise>
          </Title>
          <Ruler top={chartTop + 80} h={chartH - 80} />
          <div style={{ position: "absolute", left: 120, top: chartTop + 80, width: 900, height: chartH - 80, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
            {figs.map(([m, l, mode, d], i) => (
              <Rise key={i} at={F(segT(4)) + d} start={start} y={80}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Napo h={fh(m) * 1.04} mode={mode} />
                  <div style={{ ...S, fontSize: 30, color: mode === "color" ? theme.colors.primary : theme.colors.textDim, marginTop: 8, textAlign: "center", width: 260 }}>{l}<br /><span style={{ fontSize: 40, color: "#fff" }}>{m.toFixed(2).replace(".", ",")} m</span></div>
                </div>
              </Rise>
            ))}
          </div>
        </AbsoluteFill>
      )}
      {phase2 && !phase3 && (
        <AbsoluteFill>
          <Title top={190}><Rise at={inch - 6} start={start}><div style={{ ...H, fontSize: 92 }}>A CONFUSÃO</div></Rise><Rise at={inch - 2} start={start}><div style={{ ...H, fontSize: 70, color: theme.colors.primary }}>DAS POLEGADAS</div></Rise></Title>
          <div style={{ position: "absolute", top: 620, left: 90, width: 900, display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
            <div style={{ opacity: ip, transform: `translateX(${(1 - ip) * -200}px)`, display: "flex", gap: 24, alignItems: "center", padding: "26px 40px", borderRadius: 30, background: "rgba(43,75,168,.35)", border: "3px solid #2B4BA8" }}>
              <div style={{ ...S, fontSize: 76, color: "#fff" }}>5′2″</div><div style={{ ...S, fontSize: 34, color: theme.colors.textDim }}>MEDIDA<br />FRANCESA</div>
            </div>
            <div style={{ ...S, fontSize: 90, color: theme.colors.primary, opacity: eq, transform: `scale(${eq})` }}>=</div>
            <div style={{ opacity: eq, transform: `translateX(${(1 - eq) * 200}px)`, display: "flex", gap: 24, alignItems: "center", padding: "26px 40px", borderRadius: 30, background: "rgba(192,57,43,.3)", border: `3px solid ${theme.colors.accent}` }}>
              <div style={{ ...S, fontSize: 76, color: "#fff" }}>5′7″</div><div style={{ ...S, fontSize: 34, color: theme.colors.textDim }}>MEDIDA<br />INGLESA</div>
            </div>
          </div>
        </AbsoluteFill>
      )}
      {phase3 && (
        <AbsoluteFill>
          <Title top={170}><Rise at={charge - 4} start={start}><div style={{ ...H, fontSize: 84 }}>E A PROPAGANDA</div></Rise><Rise at={charge} start={start}><div style={{ ...H, fontSize: 84, color: theme.colors.accent }}>BRITÂNICA</div></Rise></Title>
          <div style={{ position: "absolute", left: 140, top: 470, width: 800, height: 780, background: "#EFE3C6", borderRadius: 10, boxShadow: "0 40px 80px -20px rgba(0,0,0,.8)", border: "14px solid #6b4f2a", opacity: cp, transform: `rotate(${-3 + (1 - cp) * -10}deg) scale(${0.85 + 0.15 * cp})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 40, boxSizing: "border-box" }}>
            <div style={{ position: "absolute", top: 40, ...H, fontSize: 64, color: "#3a2a14", textShadow: "none", fontStyle: "italic" }}>“Little Boney”</div>
            <div style={{ position: "absolute", right: 90, bottom: 100 }}><div style={{ transform: `rotate(${Math.sin(f / 4) * 6}deg)`, transformOrigin: "50% 100%" }}><Napo h={210} mode="color" /></div></div>
            <div style={{ position: "absolute", left: 70, bottom: 60, ...S, fontSize: 24, color: "#5b4423" }}>CHARGE INGLESA (ILUSTRAÇÃO)</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* 3 — EMPIRE (3D war board) + CODE */
const empPath = makePath("eu", [pt("paris"), [320, 330], pt("berlin")]);
export const Empire: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const dom = wordT(8, "dominou");
  const waves: [string[], number][] = [[["FRA"], 0], [["BEL", "NLD", "LUX", "CHE"], 0.35], [["ITA", "DEU"], 0.7], [["ESP", "POL", "SVN", "HRV"], 1.05]];
  const fills: Record<string, [string, number]> = {};
  waves.forEach(([cs, d]) => cs.forEach((c) => (fills[c] = [theme.colors.empire, interpolate(t, [dom - 0.4 + d, dom + d], [0, 1], { ...cl, easing: eio })])));
  const s0 = segT(8) - 0.2;
  const point = interpolate(t, [s0, s0 + 0.4, s0 + 1.2, s0 + 1.6], [0, 1, 1, 0], cl);
  const u = interpolate(t, [s0 + 1.4, segT(9)], [0, 0.85], { ...cl, easing: Easing.inOut(Easing.quad) });
  const walking = t > s0 + 1.4;
  const L = empPath.at(u).p;
  const pull = interpolate(t, [s0, s0 + 3], [0, 1], { ...cl, easing: eio });
  const cam = { pos: [L.x - 0.3, 1.1 + 1.9 * pull, L.z + 1.7 + 1.4 * pull] as [number, number, number], tgt: [L.x + 0.45, 0, L.z - 0.55] as [number, number, number], fov: 50 };
  const code = useAbsSpring(W(8, "codigo") - 4, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <Board k="eu" cam={cam} fills={fills}><Army path={empPath} u={u} t={t} walking={walking} point={point} scale={0.1} /></Board>
      <Title top={150}><Rise at={F(segT(8)) + 2} start={start}><div style={{ ...H, fontSize: 84 }}>O IMPÉRIO</div></Rise><Rise at={W(8, "dominou") - 2} start={start}><Pill bg={theme.colors.empire} color="#fff" size={34}>IMPÉRIO E ALIADOS · 1812 (APROX.)</Pill></Rise></Title>
      <div style={{ position: "absolute", left: 120, top: 1150, width: 840, padding: "26px 34px", borderRadius: 26, background: "#EFE3C6", boxShadow: "0 30px 70px -20px rgba(0,0,0,.8)", display: "flex", gap: 26, alignItems: "center", opacity: Math.min(1, code * 1.4), transform: `translateY(${(1 - code) * 120}px) rotate(${(1 - code) * 6}deg)` }}>
        <svg width="110" height="120" viewBox="0 0 110 120"><rect x="10" y="8" width="80" height="104" rx="6" fill="#6b1f1a" /><rect x="18" y="8" width="72" height="104" rx="4" fill="#8B2A22" /><text x="54" y="72" textAnchor="middle" fontFamily="Playfair Display" fontWeight={900} fontSize="36" fill={theme.colors.primary}>CN</text><path d="M95 10 Q110 40 88 70" stroke="#3b2a14" strokeWidth="4" fill="none" /></svg>
        <div><div style={{ ...H, fontSize: 50, color: "#2a1d0c", textShadow: "none" }}>Código Napoleônico</div><div style={{ ...S, fontSize: 28, color: "#6b5a3a", marginTop: 6 }}>1804 · BASE DE LEIS ATÉ HOJE</div></div>
      </div>
    </AbsoluteFill>
  );
};

/* 4 — BRAZIL */
export const Brazil: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const inv = wordT(9, "invadiu"), fug = wordT(9, "fugiu"), rio = wordT(9, "rio"), ind = wordT(9, "independencia");
  const mp = useAbsSpring(F(segT(9)), start, theme.spring.smooth);
  const arrowP = interpolate(t, [inv - 0.2, inv + 0.8], [0, 1], { ...cl, easing: eio });
  const shipP = interpolate(t, [fug, rio + 0.2], [0, 1], { ...cl, easing: eio });
  const L = pt("lisboa"), Rr = pt("rio"), Pa = pt("paris_at");
  const sp = bez(L, Rr, -0.22, shipP);
  const trail = Array.from({ length: 30 }).map((_, i) => bez(L, Rr, -0.22, (i / 30) * shipP));
  const zoom = interpolate(t, [segT(9), segT(10)], [1.0, 1.08], cl);
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.green} b={theme.colors.primary} base={theme.colors.bg} />
      <Title top={140}><Rise at={F(segT(9))} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 96, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>1807 → 1808</div></Rise></Title>
      <Card top={290} p={mp} style={{ width: 920, left: 80 }}>
        <MapSvg k="at" width={920} zoom={zoom} origin={[600, 520]} fills={{ PRT: [theme.colors.red, interpolate(t, [inv + 0.6, inv + 1], [0, 0.85], cl)], BRA: [theme.colors.green, interpolate(t, [rio - 0.4, rio + 0.3], [0, 0.85], cl)] }}>
          <Arrow a={Pa} b={L} p={arrowP} color={theme.colors.red} bend={0.35} />
          <Pin at={L} label="LISBOA" p={interpolate(t, [inv, inv + 0.4], [0, 1], cl)} color="#fff" dx={-26} dy={-30} />
          {shipP > 0 && <polyline points={trail.map((q) => q.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="14 12" opacity={0.85} />}
          {shipP > 0 && shipP < 1 && <Ship at={sp} ang={0} s={1.6} />}
          <Pin at={Rr} label="RIO DE JANEIRO" p={interpolate(t, [rio - 0.2, rio + 0.3], [0, 1], cl)} color={theme.colors.primary} dx={30} dy={48} />
        </MapSvg>
      </Card>
      <AbsoluteFill style={{ top: 1290, alignItems: "center", gap: 10, display: "flex", flexDirection: "column" }}>
        <Rise at={W(9, "familia") - 4} start={start} out={F(rio) - 6}><Pill bg="#fff" size={40}>A FAMÍLIA REAL FOGE PRO BRASIL</Pill></Rise>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1230, alignItems: "center", gap: 12, display: "flex", flexDirection: "column" }}>
        <Rise at={W(9, "capital") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>RIO: CAPITAL DO IMPÉRIO PORTUGUÊS</Pill></Rise>
        <Rise at={F(ind) - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.green} color="#fff" size={36}>→ INDEPENDÊNCIA EM 1822</Pill></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 10 — RUSSIA: march, Moscow burning, winter retreat */
const rusPath = makePath("eu", [pt("varsovia"), pt("vilnius"), pt("smolensk"), pt("moscou")]);
const Fire: React.FC<{ at: [number, number, number]; t: number; amt: number }> = ({ at, t, amt }) => (
  <group position={at}>
    <pointLight position={[0, 0.3, 0]} intensity={14 * amt * (0.8 + 0.2 * Math.sin(t * 20))} distance={3.5} color="#ff7a1a" />
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45 * amt, 32]} /><meshBasicMaterial fog={false} color="#ff4a10" transparent opacity={0.5 * amt} /></mesh>
    {Array.from({ length: 30 }).map((_, i) => { const ph = (t * 0.9 + random(`fp${i}`)) % 1; return (
      <mesh key={i} position={[(random(`fx${i}`) - 0.5) * 0.6, 0.03 + ph * 0.9, (random(`fz${i}`) - 0.5) * 0.6]} scale={(1 - ph) * 0.13 * amt}>
        <sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial fog={false} color={ph < 0.4 ? "#ffe08a" : ph < 0.7 ? "#ff6a00" : "#3a3a3a"} transparent opacity={(1 - ph) * amt} />
      </mesh>); })}
  </group>
);
export const Russia: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const s0 = segT(10) - 0.2, mosc = wordT(10, "moscou"), cham = wordT(10, "chamas"), volta = wordT(10, "volta"), inv = wordT(10, "inverno");
  const fwd = interpolate(t, [s0 + 0.3, mosc + 0.4], [0, 0.97], { ...cl, easing: Easing.inOut(Easing.quad) });
  const back = interpolate(t, [volta - 0.2, segT(11) - 0.2], [0, 0.55], { ...cl, easing: Easing.inOut(Easing.quad) });
  const u = fwd - back;
  const retreat = t > volta - 0.2;
  const tf = (i: number) => inv + 0.1 + 2.4 * (0.05 + random(`f${i}`) * 0.9);
  const fallenAt = (i: number) => (random(`k${i}`) < 0.88 ? interpolate(t, [tf(i), tf(i) + 0.3], [0, 1], cl) : 0);
  const uAt = (i: number) => 0.97 - interpolate(tf(i), [volta - 0.2, segT(11) - 0.2], [0, 0.55], { ...cl, easing: Easing.inOut(Easing.quad) });
  const L = rusPath.at(u).p;
  const cam = { pos: [L.x - 1.0, 1.4, L.z + 2.0] as [number, number, number], tgt: [L.x + 0.3, 0, L.z - 0.3] as [number, number, number], fov: 50 };
  const snow = interpolate(t, [inv - 0.5, inv + 1.5], [0.05, 0.95], cl);
  const fire = interpolate(t, [cham - 0.3, cham + 0.4, segT(11), segT(11) + 1], [0, 1, 1, 0.6], cl);
  const army = interpolate(t, [wordT(10, "russia") - 0.2, wordT(10, "homens")], [0, 400000], { ...cl, easing: Easing.out(Easing.cubic) });
  const Mw = new THREE.Vector3(...(rusPath.at(1).p.toArray() as [number, number, number]));
  // reverse heading during retreat
  const pathR = retreat ? { ...rusPath, at: (x: number) => { const r = rusPath.at(x); return { p: r.p, dir: r.dir.clone().multiplyScalar(-1) }; } } : rusPath;
  return (
    <AbsoluteFill>
      <Board k="eu" cam={cam} fills={{ FRA: [theme.colors.empire, 0.8] }} snow={snow} snowSet={["RUS", "BLR", "LTU", "LVA", "EST", "UKR", "POL"]} light={1 - 0.35 * snow}>
        <Army path={pathR as any} u={u} t={t} n={28} walking={!(t > mosc + 0.4 && t < volta - 0.2)} fallenAt={fallenAt} snowU={uAt} />
        <Fire at={[Mw.x, Mw.y, Mw.z]} t={t} amt={fire} />
        <SnowFall center={L} t={t} amt={snow} />
      </Board>
      <Title top={150}>
        <Rise at={F(s0) + 2} start={start}><div style={{ ...H, fontSize: 80 }}>RÚSSIA · 1812</div></Rise>
        <Rise at={W(10, "chamas") - 4} start={start} out={W(10, "volta") - 6}><Pill bg="#FB923C" size={36}>MOSCOU EM CHAMAS</Pill></Rise>
      </Title>
      <AbsoluteFill style={{ top: 1150, alignItems: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <Rise at={W(10, "russia") - 4} start={start}><div style={{ ...S, fontSize: 96, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 8px 30px rgba(0,0,0,.9)", textDecoration: t > inv + 1.2 ? "line-through" : "none", textDecorationColor: "#F87171" }}>{Math.round(army).toLocaleString("pt-BR")}+</div></Rise>
        <Rise at={W(10, "inverno") - 4} start={start}><Pill bg="#BAE6FD" size={36}>INVERNO + FOME</Pill></Rise>
        <Rise at={W(10, "destruiram") - 2} start={start}><Pill bg="#F87171" size={36}>A MAIORIA NÃO VOLTOU</Pill></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 11 — ELBA, 100 DAYS, WATERLOO */
export const Fall: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const elba = wordT(11, "elba"), fug = wordT(11, "fugiu"), cem = wordT(11, "cem"), wat = wordT(11, "waterloo");
  const mp = useAbsSpring(F(segT(11)), start, theme.spring.smooth);
  const sw = useAbsSpring(F(wat) - 3, start, theme.spring.bouncy);
  const E = pt("elba"), Pa = pt("paris"), Wt = pt("waterloo");
  const arrow = interpolate(t, [fug - 0.1, fug + 1.0], [0, 1], { ...cl, easing: eio });
  const days = Math.round(interpolate(t, [cem - 0.2, wat - 0.2], [0, 100], { ...cl, easing: Easing.out(Easing.quad) }));
  const zoom = interpolate(t, [segT(11), wat], [2.0, 2.4], cl);
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b="#475569" base={theme.colors.bg} />
      <Title top={150}>
        <Rise at={F(elba) - 4} start={start} out={F(wat) - 6}><div style={{ ...H, fontSize: 84 }}>A FUGA DE ELBA</div></Rise>
      </Title>
      <Title top={150}>
        <Rise at={F(wat) - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 96 }}>WATERLOO</div><div style={{ ...H, fontSize: 56, color: theme.colors.primary }}>1815</div></Rise>
      </Title>
      <Card top={420} p={mp}>
        <MapSvg k="eu" width={1000} zoom={zoom} origin={[300, 430]} fills={{ FRA: [theme.colors.empire, 0.45] }}>
          <Pin at={E} label="ELBA" p={interpolate(t, [elba - 0.3, elba + 0.2], [0, 1], cl)} zoom={zoom} color="#fff" dx={28} dy={-30} />
          <Arrow a={E} b={Pa} p={arrow} color={theme.colors.primary} bend={0.3} w={8 / zoom * 2} />
          <Pin at={Pa} label="PARIS" p={interpolate(t, [fug + 0.8, fug + 1.1], [0, 1], cl)} zoom={zoom} dx={28} dy={-30} />
          <g transform={`translate(${Wt[0]} ${Wt[1]}) scale(${(0.4 + 0.6 * sw) / zoom}) rotate(${(1 - sw) * 90})`} opacity={sw}>
            <path d="M-50 -50 L50 50 M50 -50 L-50 50" stroke="#E5E7EB" strokeWidth={12} strokeLinecap="round" />
            <path d="M-60 -38 L-38 -60 M60 -38 L38 -60" stroke={theme.colors.primary} strokeWidth={10} strokeLinecap="round" />
          </g>
        </MapSvg>
      </Card>
      <AbsoluteFill style={{ top: 1230, alignItems: "center" }}>
        <Rise at={F(cem) - 4} start={start}><div style={{ display: "flex", alignItems: "baseline", gap: 14 }}><div style={{ ...S, fontSize: 110, color: theme.colors.primary, fontVariantNumeric: "tabular-nums", textShadow: `0 0 40px ${theme.colors.glow}` }}>{days}</div><div style={{ ...S, fontSize: 52, color: "#fff" }}>DIAS DE VOLTA</div></div></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 12 — ST HELENA */
export const Helena: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const hp = useAbsSpring(F(segT(12)), start, theme.spring.smooth);
  const zoom = interpolate(t, [segT(12), segT(13)], [1, 3.6], { ...cl, easing: eio });
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b="#475569" base={theme.colors.bg} />
      <Title top={150}><Rise at={F(segT(12)) + 2} start={start}><div style={{ ...H, fontSize: 84 }}>O EXÍLIO FINAL</div></Rise><Rise at={W(12, "mil") - 2} start={start}><Pill bg="#fff" size={40}>SANTA HELENA · 1821</Pill></Rise></Title>
      <Card top={430} p={hp} style={{ height: 900 }}>
        <MapSvg k="at" width={1000} zoom={zoom} origin={pt("helena")}>
          <Pin at={pt("helena")} label="SANTA HELENA" p={interpolate(t, [wordT(12, "helena") - 0.3, wordT(12, "helena") + 0.2], [0, 1], cl)} zoom={zoom} color={theme.colors.primary} dx={-30} dy={-40} />
        </MapSvg>
      </Card>
    </AbsoluteFill>
  );
};

/* 13 — THE DARK SIDE */
export const Legacy: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const a = useAbsSpring(W(13, "milhoes") - 4, start, theme.spring.smooth);
  const b = useAbsSpring(W(13, "escravidao") - 4, start, theme.spring.smooth);
  return (
    <AbsoluteFill style={{ background: "#0a0606" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(127,29,29,.45), transparent 60%)" }} />
      {Array.from({ length: 50 }).map((_, i) => <div key={i} style={{ position: "absolute", left: random(`ax${i}`) * 1080, top: 1920 - ((f * (0.6 + random(`as${i}`)) + random(`ay${i}`) * 1920) % 1920), width: 3, height: 3, borderRadius: 2, background: "rgba(255,255,255,.25)" }} />)}
      <Title top={200}><Rise at={F(segT(13)) + 2} start={start}><div style={{ ...H, fontSize: 70, color: theme.colors.textDim }}>O OUTRO LADO</div></Rise></Title>
      <AbsoluteFill style={{ top: 520, alignItems: "center", display: "flex", flexDirection: "column", gap: 70 }}>
        <div style={{ opacity: a, transform: `translateY(${(1 - a) * 40}px)`, textAlign: "center" }}>
          <div style={{ ...H, fontSize: 124, color: "#F87171" }}>MILHÕES</div>
          <div style={{ ...H, fontSize: 52 }}>DE MORTOS NAS GUERRAS</div>
        </div>
        <div style={{ opacity: b, transform: `translateY(${(1 - b) * 40}px)`, textAlign: "center", padding: "26px 40px", border: "3px solid rgba(248,113,113,.6)", borderRadius: 26 }}>
          <div style={{ ...S, fontSize: 72, color: "#fff" }}>1802</div>
          <div style={{ ...S, fontSize: 38, color: theme.colors.textDim, marginTop: 8 }}>ESCRAVIDÃO RESTABELECIDA</div>
          <div style={{ ...S, fontSize: 38, color: theme.colors.textDim }}>NAS COLÔNIAS FRANCESAS</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 7 — DEBATE */
export const Debate: React.FC<P> = ({ start }) => {
  const g = useAbsSpring(W(14, "genio") - 3, start, theme.spring.bouncy);
  const ty = useAbsSpring(W(14, "tirano") - 3, start, theme.spring.bouncy);
  const os = useAbsSpring(W(14, "dois") - 3, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(227,179,65,${0.35 * g}) 0%, ${theme.colors.bg} 50%, rgba(192,57,43,${0.4 * ty}) 100%)` }} />
      <Title top={150}><Rise at={W(14, "garoto") - 4} start={start} out={W(14, "genio") - 8}><div style={{ ...H, fontSize: 64 }}>DO GAROTO ZOADO</div><div style={{ ...H, fontSize: 64, color: theme.colors.primary }}>À LENDA DA HISTÓRIA</div></Rise></Title>
      <AbsoluteFill><Napo3D camDist={8.2} camY={1.8} tgtY={1.4} /></AbsoluteFill>
      <div style={{ position: "absolute", left: 40, top: 300, opacity: g, transform: `translateX(${(1 - g) * -200}px) rotate(-6deg)` }}><div style={{ ...H, fontSize: 104, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>GÊNIO</div></div>
      <div style={{ position: "absolute", right: 40, top: 420, opacity: ty, transform: `translateX(${(1 - ty) * 200}px) rotate(6deg)` }}><div style={{ ...H, fontSize: 104, color: "#F87171" }}>TIRANO</div></div>
      <AbsoluteFill style={{ top: 1260, alignItems: "center" }}><div style={{ opacity: os, transform: `scale(${0.6 + 0.4 * os})` }}><Pill bg="#fff" size={56}>OU OS DOIS?</Pill></div></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 8 — CTA */
export const CTA: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const c = F(segT(15)) - 4;
  const p = useAbsSpring(c, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#4c1d95" b={theme.colors.primary} base={theme.colors.bg} />
      <Rays y={760} o={0.6} />
      <Title top={330}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, marginBottom: 14 }}>
          <Img src={staticFile("napof/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
        </div>
        <Rise at={c + 5} start={start}><div style={{ ...S, fontSize: 46, color: theme.colors.textDim }}>SEGUE O</div></Rise>
        <Rise at={c + 9} start={start} cfg={theme.spring.bouncy}><div style={{ ...S, fontSize: 108, color: "#fff", textAlign: "center", lineHeight: 1 }}>PERGUNTA</div><div style={{ ...S, fontSize: 108, color: theme.colors.primary, textAlign: "center", lineHeight: 1, textShadow: `0 0 50px ${theme.colors.glow}` }}>CÓSMICA</div></Rise>
        <Rise at={c + 14} start={start}><div style={{ ...S, fontSize: 38, color: theme.colors.textDim }}>ciência, universo e história</div></Rise>
        <div style={{ height: 60 }} />
        <Rise at={c + 22} start={start} cfg={theme.spring.bouncy}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", color: theme.colors.ink, ...S, fontSize: 56, padding: "24px 52px", borderRadius: 999, boxShadow: "0 0 50px rgba(255,255,255,.35)", transform: `scale(${1 + Math.sin(f / 7) * 0.035})` }}>
            <svg width="44" height="44" viewBox="0 0 40 40"><path d="M20 6v28M6 20h28" stroke={theme.colors.ink} strokeWidth="6" strokeLinecap="round" /></svg>SEGUIR
          </div>
        </Rise>
      </Title>
    </AbsoluteFill>
  );
};
