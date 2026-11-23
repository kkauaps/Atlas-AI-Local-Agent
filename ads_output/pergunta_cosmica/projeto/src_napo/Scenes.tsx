import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random, Easing, Img, staticFile } from "remotion";
import { theme } from "./theme";
import { wordT, segT, sec } from "./time";
import { cl } from "./cl";
import { H, Rise, Pill, Title, useAbsSpring } from "./ui";
import { Napo, MapSvg, Arrow, Pin, Ship, pt, bez } from "./art";
import { BgMesh } from "./components/Layers";
import { Napo3D } from "./napo3d";
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
  const fig = useAbsSpring(2, start, theme.spring.smooth);
  const stamp = useAbsSpring(W(0, "mentira") - 2, start, theme.spring.bouncy);
  const zoom = interpolate(f, [0, 90], [1.0, 1.06], { ...cl, easing: eio });
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.accent} b={theme.colors.primary} base={theme.colors.bg} />
      <Rays y={1000} o={fig} />
      <AbsoluteFill style={{ opacity: fig, transform: `translateY(${(1 - fig) * 140}px) scale(${zoom})` }}>
        <Napo3D camDist={8.0} camY={1.8} tgtY={1.45} />
      </AbsoluteFill>
      <Title top={170}>
        <Rise at={3} start={start}><div style={{ ...H, fontSize: 104 }}>NAPOLEÃO ERA</div></Rise>
        <Rise at={W(0, "baixinho") - 3} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 132, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>BAIXINHO?</div></Rise>
      </Title>
      <AbsoluteFill style={{ alignItems: "center", top: 930 }}>
        <div style={{ opacity: Math.min(1, stamp * 1.5), transform: `scale(${2.2 - 1.2 * stamp}) rotate(-12deg)`, border: `10px solid ${theme.colors.accent}`, borderRadius: 18, padding: "6px 34px", ...S, fontSize: 130, color: theme.colors.accent, background: "rgba(251,247,238,.92)", letterSpacing: "0.06em" }}>MITO!</div>
      </AbsoluteFill>
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
  const inch = W(1, "polegada"); const charge = W(1, "charges");
  const phase2 = f + start >= inch - 8, phase3 = f + start >= charge - 8;
  const p1o = interpolate(f + start, [inch - 10, inch - 2], [1, 0], cl);
  const chartTop = 470, chartH = 760;
  // figure heights: map 1.40m->0, 1.90m->chartH
  const fh = (m: number) => ((m - 1.4) / 0.5) * chartH;
  const figs: [number, string, "color" | "grey", number][] = [[1.65, "FRANCÊS MÉDIO", "grey", 6], [1.68, "NAPOLEÃO", "color", 0], [1.73, "BRASILEIRO MÉDIO", "grey", 12]];
  const ip = useAbsSpring(inch - 4, start, theme.spring.smooth);
  const eq = useAbsSpring(W(1, "inglesa") - 2, start, theme.spring.bouncy);
  const cp = useAbsSpring(charge - 4, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      {!phase2 && (
        <AbsoluteFill style={{ opacity: p1o }}>
          <Title top={150}>
            <Rise at={W(1, "metro") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 130, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>1,68 m</div></Rise>
            <Rise at={W(1, "normal") - 4} start={start}><Pill bg="#fff" size={42}>ALTURA NORMAL NA ÉPOCA</Pill></Rise>
          </Title>
          <Ruler top={chartTop + 80} h={chartH - 80} />
          <div style={{ position: "absolute", left: 120, top: chartTop + 80, width: 900, height: chartH - 80, display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
            {figs.map(([m, l, mode, d], i) => (
              <Rise key={i} at={F(segT(1)) + d} start={start} y={80}>
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

/* 2 — RISE: Corsica, timeline, coronation */
export const RiseScene: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame(); const t = useT(start);
  const coro = W(2, "coroacao");
  const phaseC = f + start >= coro - 8;
  const mp = useAbsSpring(W(2, "ilha") - 6, start, theme.spring.smooth);
  const zoom = interpolate(t, [segT(2), segT(2) + 4], [3.2, 3.8], { ...cl, easing: eio });
  const nodes: [string, string, number][] = [["1769", "NASCE NA CÓRSEGA", W(2, "nasceu")], ["1793", "GENERAL AOS 24", W(2, "general")], ["1804", "IMPERADOR AOS 35", W(2, "imperador")]];
  const crownP = useAbsSpring(W(2, "coroa", 1) - 2, start, { damping: 16, stiffness: 70, mass: 1 });
  const n0 = useAbsSpring(nodes[0][2] - 4, start, theme.spring.bouncy);
  const n1 = useAbsSpring(nodes[1][2] - 4, start, theme.spring.bouncy);
  const n2 = useAbsSpring(nodes[2][2] - 4, start, theme.spring.bouncy);
  const nps = [n0, n1, n2];
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b={theme.colors.primary} base={theme.colors.bg} />
      {!phaseC && (
        <>
          <Title top={150}><Rise at={F(segT(2)) + 2} start={start}><div style={{ ...H, fontSize: 88 }}>DE ONDE ELE VEIO</div></Rise></Title>
          <Card top={330} p={mp}>
            <MapSvg k="eu" width={1000} zoom={zoom} origin={pt("corsega")} fills={{ FRA: [theme.colors.empire, 0.35] }}>
              <Pin at={pt("corsega")} label="CÓRSEGA" p={mp} zoom={zoom} dx={30} dy={-40} />
            </MapSvg>
          </Card>
          <div style={{ position: "absolute", left: 60, top: 1100, width: 960, display: "flex", justifyContent: "space-between" }}>
            <div style={{ position: "absolute", left: 60, right: 60, top: 34, height: 8, borderRadius: 4, background: "rgba(255,255,255,.15)" }} />
            {nodes.map(([y, l, at], i) => {
              const p = nps[i];
              return (
                <div key={i} style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)` }}>
                  <div style={{ width: 76, height: 76, borderRadius: 38, background: i === 2 ? theme.colors.primary : "#2B4BA8", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", ...S, fontSize: 30, color: i === 2 ? theme.colors.ink : "#fff", boxShadow: i === 2 ? `0 0 40px ${theme.colors.glow}` : undefined }}>{i === 1 ? "★" : i === 2 ? "♛" : "●"}</div>
                  <div style={{ ...S, fontSize: 46, color: "#fff", marginTop: 10 }}>{y}</div>
                  <div style={{ ...S, fontSize: 26, color: theme.colors.textDim, textAlign: "center" }}>{l}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {phaseC && (
        <AbsoluteFill>
          <Rays y={900} o={1} />
          <Title top={160}><Rise at={coro - 6} start={start}><div style={{ ...H, fontSize: 84 }}>A COROAÇÃO</div></Rise><Rise at={coro - 2} start={start}><Pill bg={theme.colors.primary} size={40} glow>ELE MESMO SE COROOU</Pill></Rise></Title>
          <AbsoluteFill><Napo3D crown={crownP} camDist={8.4} camY={2.0} tgtY={1.55} /></AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* 3 — EMPIRE (3D war board) + CODE */
const empPath = makePath("eu", [pt("paris"), [320, 330], pt("berlin")]);
export const Empire: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const dom = wordT(3, "dominou");
  const waves: [string[], number][] = [[["FRA"], 0], [["BEL", "NLD", "LUX", "CHE"], 0.35], [["ITA", "DEU"], 0.7], [["ESP", "POL", "SVN", "HRV"], 1.05]];
  const fills: Record<string, [string, number]> = {};
  waves.forEach(([cs, d]) => cs.forEach((c) => (fills[c] = [theme.colors.empire, interpolate(t, [dom - 0.4 + d, dom + d], [0, 1], { ...cl, easing: eio })])));
  const s0 = segT(3);
  const point = interpolate(t, [s0, s0 + 0.4, s0 + 1.2, s0 + 1.6], [0, 1, 1, 0], cl);
  const u = interpolate(t, [s0 + 1.4, segT(4)], [0, 0.85], { ...cl, easing: Easing.inOut(Easing.quad) });
  const walking = t > s0 + 1.4;
  const L = empPath.at(u).p;
  const pull = interpolate(t, [s0, s0 + 3], [0, 1], { ...cl, easing: eio });
  const cam = { pos: [L.x - 0.3, 1.1 + 1.9 * pull, L.z + 1.7 + 1.4 * pull] as [number, number, number], tgt: [L.x + 0.45, 0, L.z - 0.55] as [number, number, number], fov: 50 };
  const code = useAbsSpring(W(3, "codigo") - 4, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <Board k="eu" cam={cam} fills={fills}><Army path={empPath} u={u} t={t} walking={walking} point={point} scale={0.1} /></Board>
      <Title top={150}><Rise at={F(segT(3)) + 2} start={start}><div style={{ ...H, fontSize: 84 }}>O IMPÉRIO</div></Rise><Rise at={W(3, "dominou") - 2} start={start}><Pill bg={theme.colors.empire} color="#fff" size={34}>IMPÉRIO E ALIADOS · 1812 (APROX.)</Pill></Rise></Title>
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
  const inv = wordT(4, "invadiu"), fug = wordT(4, "fugiu"), rio = wordT(4, "rio"), ind = wordT(4, "independencia");
  const mp = useAbsSpring(F(segT(4)) + 2, start, theme.spring.smooth);
  const arrowP = interpolate(t, [inv - 0.2, inv + 0.8], [0, 1], { ...cl, easing: eio });
  const shipP = interpolate(t, [fug, rio + 0.2], [0, 1], { ...cl, easing: eio });
  const L = pt("lisboa"), Rr = pt("rio"), Pa = pt("paris_at");
  const sp = bez(L, Rr, -0.22, shipP);
  const trail = Array.from({ length: 30 }).map((_, i) => bez(L, Rr, -0.22, (i / 30) * shipP));
  const zoom = interpolate(t, [segT(4), segT(5)], [1.0, 1.08], cl);
  return (
    <AbsoluteFill>
      <BgMesh a={theme.colors.green} b={theme.colors.primary} base={theme.colors.bg} />
      <Title top={140}><Rise at={W(4, "mil") - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 96, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>1807</div></Rise></Title>
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
        <Rise at={W(4, "familia") - 4} start={start} out={W(4, "rio") - 6}><Pill bg="#fff" size={40}>A FAMÍLIA REAL FOGE PRO BRASIL</Pill></Rise>
      </AbsoluteFill>
      <AbsoluteFill style={{ top: 1230, alignItems: "center", gap: 12, display: "flex", flexDirection: "column" }}>
        <Rise at={W(4, "capital") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={36} glow>RIO: CAPITAL DO IMPÉRIO PORTUGUÊS</Pill></Rise>
        <Rise at={F(ind) - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.green} color="#fff" size={36}>→ INDEPENDÊNCIA EM 1822</Pill></Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 5 — RUSSIA (3D war board, snow, losses) */
const rusPath = makePath("eu", [pt("varsovia"), pt("vilnius"), pt("smolensk"), pt("moscou")]);
export const Russia: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const s5 = segT(5), perdeu = wordT(5, "perdeu"), mil = wordT(5, "milhoes");
  const u = interpolate(t, [s5 + 0.3, perdeu + 0.5], [0, 0.9], { ...cl, easing: Easing.inOut(Easing.quad) });
  const lost = interpolate(t, [perdeu - 0.2, perdeu + 2.6], [0, 1], cl);
  const tf = (i: number) => perdeu - 0.2 + 2.8 * (0.05 + random(`f${i}`) * 0.85);
  const fallenAt = (i: number) => (random(`k${i}`) < 0.85 ? interpolate(t, [tf(i), tf(i) + 0.35], [0, 1], cl) : 0);
  const uAt = (i: number) => interpolate(tf(i), [s5 + 0.3, perdeu + 0.5], [0, 0.9], { ...cl, easing: Easing.inOut(Easing.quad) });
  const L = rusPath.at(u).p;
  const cam = { pos: [L.x - 1.0, 1.35, L.z + 2.0] as [number, number, number], tgt: [L.x + 0.3, 0, L.z - 0.3] as [number, number, number], fov: 50 };
  const snow = interpolate(t, [s5, perdeu + 1], [0.15, 0.9], cl);
  const army = interpolate(t, [wordT(5, "exercito") - 0.3, wordT(5, "homens")], [0, 400000], { ...cl, easing: Easing.out(Easing.cubic) });
  const dark = interpolate(t, [mil - 0.6, mil], [0, 1], { ...cl, easing: eio });
  return (
    <AbsoluteFill>
      <Board k="eu" cam={cam} fills={{ FRA: [theme.colors.empire, 0.8] }} snow={snow} snowSet={["RUS", "BLR", "LTU", "LVA", "EST", "UKR", "POL"]} light={1 - 0.35 * lost}>
        <Army path={rusPath} u={u} t={t} n={28} walking={u < 0.9} fallenAt={fallenAt} snowU={uAt} />
        <SnowFall center={L} t={t} amt={snow} />
      </Board>
      <Title top={150}><Rise at={F(s5) + 2} start={start}><div style={{ ...H, fontSize: 80 }}>RÚSSIA · 1812</div></Rise></Title>
      <AbsoluteFill style={{ top: 1150, alignItems: "center", display: "flex", flexDirection: "column", gap: 10 }}>
        <Rise at={W(5, "exercito") - 4} start={start}><div style={{ ...S, fontSize: 96, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 8px 30px rgba(0,0,0,.9)", textDecoration: lost > 0.5 ? "line-through" : "none", textDecorationColor: "#F87171" }}>{Math.round(army).toLocaleString("pt-BR")}+</div></Rise>
        <Rise at={F(perdeu + 1.0)} start={start}><Pill bg="#F87171" size={38}>A MAIORIA NÃO VOLTOU</Pill></Rise>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(10,4,4,${0.82 * dark})`, alignItems: "center", justifyContent: "center", display: dark > 0.01 ? "flex" : "none" }}>
        <div style={{ opacity: dark, transform: `scale(${0.9 + 0.1 * dark})`, textAlign: "center", marginTop: -200 }}>
          <div style={{ ...H, fontSize: 130, color: "#F87171" }}>MILHÕES</div>
          <div style={{ ...H, fontSize: 64 }}>DE MORTOS NAS</div>
          <div style={{ ...H, fontSize: 64 }}>GUERRAS NAPOLEÔNICAS</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 6 — WATERLOO + ST HELENA */
export const Fall: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const wat = wordT(6, "waterloo"), ex = wordT(6, "exilado");
  const phase2 = f + start >= F(ex) - 8;
  const mp = useAbsSpring(F(segT(6)), start, theme.spring.smooth);
  const sw = useAbsSpring(F(wat) - 3, start, theme.spring.bouncy);
  const hp = useAbsSpring(F(ex) - 6, start, theme.spring.smooth);
  const zoom = interpolate(t, [ex - 0.2, ex + 2.2], [1, 3.4], { ...cl, easing: eio });
  return (
    <AbsoluteFill>
      <BgMesh a="#1E2F6B" b="#475569" base={theme.colors.bg} />
      {!phase2 ? (
        <>
          <Title top={150}><Rise at={F(wat) - 4} start={start} cfg={theme.spring.bouncy}><div style={{ ...H, fontSize: 96 }}>WATERLOO</div></Rise><Rise at={F(wat)} start={start}><div style={{ ...H, fontSize: 60, color: theme.colors.primary }}>1815</div></Rise></Title>
          <Card top={420} p={mp}>
            <MapSvg k="eu" width={1000} zoom={2.6} origin={pt("waterloo")}>
              <g transform={`translate(${pt("waterloo")[0]} ${pt("waterloo")[1]}) scale(${(0.4 + 0.6 * sw) / 2.6}) rotate(${(1 - sw) * 90})`} opacity={sw}>
                <path d="M-60 -60 L60 60 M60 -60 L-60 60" stroke="#E5E7EB" strokeWidth={14} strokeLinecap="round" />
                <path d="M-70 -48 L-48 -70 M70 -48 L48 -70" stroke={theme.colors.primary} strokeWidth={12} strokeLinecap="round" />
              </g>
            </MapSvg>
          </Card>
        </>
      ) : (
        <>
          <Title top={150}><Rise at={F(ex) - 6} start={start}><div style={{ ...H, fontSize: 84 }}>EXÍLIO</div></Rise><Rise at={F(ex) - 2} start={start}><Pill bg="#fff" size={40}>SANTA HELENA · 1821</Pill></Rise></Title>
          <Card top={430} p={hp} style={{ height: 900 }}>
            <MapSvg k="at" width={1000} zoom={zoom} origin={pt("helena")}>
              <Pin at={pt("helena")} label="SANTA HELENA" p={hp} zoom={zoom} color={theme.colors.primary} dx={-30} dy={-40} />
            </MapSvg>
          </Card>
        </>
      )}
    </AbsoluteFill>
  );
};

/* 7 — DEBATE */
export const Debate: React.FC<P> = ({ start }) => {
  const g = useAbsSpring(W(7, "genio") - 3, start, theme.spring.bouncy);
  const ty = useAbsSpring(W(7, "tirano") - 3, start, theme.spring.bouncy);
  const os = useAbsSpring(W(7, "dois") - 3, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(227,179,65,${0.35 * g}) 0%, ${theme.colors.bg} 50%, rgba(192,57,43,${0.4 * ty}) 100%)` }} />
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
  const c = F(segT(8)) - 4;
  const p = useAbsSpring(c, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#4c1d95" b={theme.colors.primary} base={theme.colors.bg} />
      <Rays y={760} o={0.6} />
      <Title top={330}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, marginBottom: 14 }}>
          <Img src={staticFile("napo/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
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
