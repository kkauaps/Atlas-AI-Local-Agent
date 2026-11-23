import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Img, staticFile, random } from "remotion";
import { theme } from "./theme";
import { wordT, segT, sec } from "./time";
import { cl } from "./cl";
import { H, Rise, Pill, Title, useAbsSpring, Callout } from "./ui";
import { Canvas3D, Stars, Glow, project } from "./three";
import { RealEarth, EarthCut, ll, faceRot, V3 } from "./globe";
import { BgMesh } from "./components/Layers";
import { Shine } from "./fx";

type P = { start: number };
const useT = (start: number) => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return (f + start) / fps; };
const F = (s: number) => sec(s);
const W = (seg: number, w: string, n = 0) => F(wordT(seg, w, n));
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const S: React.CSSProperties = { fontFamily: theme.fonts.display, fontWeight: 900 };
const BR = { lat: -15, lon: -47 }, AN = { lat: 15, lon: 133 }, JP = { lat: 36, lon: 138 };
const lerpAng = (a: number, b: number, p: number) => a + (b - a) * p;

/* 0 — HOOK: globe + drill beam */
export const Hook: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const r0 = faceRot(BR.lat, BR.lon);
  const beam = interpolate(t, [wordT(0, "atravessando") - 0.2, wordT(0, "inteira") + 0.3], [0, 1], { ...cl, easing: eio });
  const jump = useAbsSpring(W(0, "pulasse") - 3, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <Canvas3D pos={[0, 0.3, 4.2]} tgt={[0, -0.1, 0]} fov={44}>
        <Stars />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 2, 5]} intensity={2.6} color="#fff4e0" />
        <group rotation={[r0.x, 0, 0]}><group rotation={[0, r0.y + Math.sin(t * 0.4) * 0.15, 0]}>
          <RealEarth opacity={1 - 0.5 * beam} />
          {beam > 0 && (() => { const a = new THREE.Vector3(...ll(BR.lat, BR.lon, 1.02)); const b = new THREE.Vector3(...ll(AN.lat, AN.lon, 1.02)); const end = a.clone().lerp(b, beam); const mid = a.clone().add(end).multiplyScalar(0.5); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
            return (<><mesh position={mid} quaternion={q}><cylinderGeometry args={[0.025, 0.025, a.distanceTo(end), 16]} /><meshBasicMaterial color="#FBBF24" /></mesh><Glow pos={end.toArray() as V3} size={0.5} color="#FBBF24" opacity={1} /></>); })()}
        </group></group>
      </Canvas3D>
      <Title top={200}>
        <Rise at={2} start={start}><div style={{ ...H, fontSize: 80 }}>E SE VOCÊ PULASSE</div></Rise>
        <Rise at={W(0, "buraco") - 3} start={start} cfg={theme.spring.bouncy}><Shine at={W(0, "buraco")} start={start}><div style={{ ...H, fontSize: 80, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>NUM BURACO QUE</div><div style={{ ...H, fontSize: 80, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>ATRAVESSA A TERRA?</div></Shine></Rise>
      </Title>
      <AbsoluteFill style={{ top: 1250, alignItems: "center" }}><div style={{ opacity: jump, transform: `translateY(${(1 - jump) * 40}px)` }}><Pill bg="#fff" size={40}>3… 2… 1… PULA!</Pill></div></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 1 — WHERE YOU EXIT: Brazil -> antipode */
export const Exit: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const s1 = segT(1);
  const turn = interpolate(t, [wordT(1, "japao") - 0.6, wordT(1, "sair") + 0.4], [0, 1], { ...cl, easing: eio });
  const a0 = faceRot(BR.lat, BR.lon), a1 = faceRot(AN.lat + 4, AN.lon - 2);
  const rx = lerpAng(a0.x, a1.x, turn);
  let y0 = a0.y, y1 = a1.y; while (y1 - y0 > Math.PI) y1 -= 2 * Math.PI; while (y1 - y0 < -Math.PI) y1 += 2 * Math.PI;
  const ry = lerpAng(y0, y1, turn);
  const braz = interpolate(t, [wordT(1, "brasil") - 0.3, wordT(1, "brasil") + 0.3, wordT(1, "japao") - 0.6, wordT(1, "japao")], [0, 1, 1, 0.4], cl);
  const cam = { pos: [0, 0.2, 3.6] as V3, tgt: [0, 0, 0] as V3, fov: 44 };
  const rot = new THREE.Euler(rx, 0, 0); const rotY = new THREE.Euler(0, ry, 0);
  const world = (p: V3) => { const v = new THREE.Vector3(...p).applyEuler(rotY).applyEuler(rot); return v.toArray() as V3; };
  const jp = project(world(ll(JP.lat, JP.lon, 1.0)), cam.pos, cam.tgt, cam.fov);
  const an = project(world(ll(AN.lat, AN.lon, 1.0)), cam.pos, cam.tgt, cam.fov);
  const br = project(world(ll(BR.lat, BR.lon, 1.0)), cam.pos, cam.tgt, cam.fov);
  const xJ = useAbsSpring(W(1, "japao") + 4, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.45} />
        <directionalLight position={[2, 2, 5]} intensity={2.4} color="#fff4e0" />
        <group rotation={[rx, 0, 0]}><group rotation={[0, ry, 0]}><RealEarth brazil={braz} /></group></group>
      </Canvas3D>
      <Title top={170}><Rise at={F(s1) + 2} start={start}><div style={{ ...H, fontSize: 76 }}>ONDE VOCÊ SAIRIA?</div></Rise></Title>
      {turn < 0.3 && <Callout x={br.x} y={br.y} dx={160} dy={-140} text="BRASIL" at={W(1, "brasil") - 4} start={start} color={theme.colors.primary} size={40} out={W(1, "japao") - 10} />}
      {turn > 0.6 && jp.z < 1 && (
        <div style={{ position: "absolute", left: jp.x - 70, top: jp.y - 160, opacity: xJ }}>
          <div style={{ position: "relative" }}><Pill bg="#fff" size={34}>JAPÃO</Pill><svg width="190" height="70" style={{ position: "absolute", left: -10, top: -6 }}><path d="M10 10 L170 60 M170 10 L10 60" stroke={theme.colors.bad} strokeWidth={9} strokeLinecap="round" /></svg></div>
        </div>
      )}
      {turn > 0.9 && <Callout x={an.x} y={an.y} dx={-170} dy={170} text="VOCÊ SAI AQUI" at={W(1, "pacifico") - 4} start={start} color={theme.colors.primary} size={38} />}
      <AbsoluteFill style={{ top: 1240, alignItems: "center" }}><Rise at={W(1, "filipinas") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg="#22D3EE" size={38}>OCEANO PACÍFICO · PERTO DAS FILIPINAS</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};


/* ===== infographic Earth cross-section (2D) ===== */
const CX = 540, CY = 880, RR = 380;
const LAY: [number, string, string][] = [[1, "#8B5E34", "CROSTA"], [0.985, "#C2410C", "MANTO"], [0.546, "#F59E0B", "NÚCLEO EXTERNO"], [0.19, "#FFF3C4", "NÚCLEO INTERNO"]];
const Section: React.FC<{ cx?: number; cy?: number; r?: number; tunnel?: number; dim?: number; children?: React.ReactNode; glow?: boolean }> = ({ cx = CX, cy = CY, r = RR, tunnel = 1, dim = 0, children, glow = true }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="mantle"><stop offset="0.55" stopColor="#F97316" /><stop offset="1" stopColor="#9A3412" /></radialGradient>
        <radialGradient id="core"><stop offset="0" stopColor="#FFFBEB" /><stop offset="0.35" stopColor="#FDE68A" /><stop offset="1" stopColor="#F59E0B" /></radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      {glow && <circle cx={cx} cy={cy} r={r * 1.06} fill="rgba(251,146,60,.25)" filter="url(#soft)" />}
      <circle cx={cx} cy={cy} r={r} fill="#3b82f6" />
      <circle cx={cx} cy={cy} r={r * 0.985} fill="url(#mantle)" />
      <circle cx={cx} cy={cy} r={r * 0.546} fill="url(#core)" />
      <circle cx={cx} cy={cy} r={r * 0.19} fill="#FFFBEB" />
      <circle cx={cx} cy={cy} r={r * 0.19 + 8 + 4 * Math.sin(f / 8)} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8B5E34" strokeWidth={10} />
      {tunnel > 0 && <rect x={cx - 13} y={cy - r * tunnel} width={26} height={r * 2 * tunnel} rx={13} fill="#0b0b12" stroke="rgba(255,255,255,.35)" strokeWidth={3} />}
      {dim > 0 && <rect width={1080} height={1920} fill={`rgba(3,4,10,${dim})`} />}
      {children}
    </svg>
  );
};
const Astro: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-20} y={-6} width={40} height={44} rx={14} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={3} />
    <rect x={-28} y={-2} width={10} height={30} rx={5} fill="#E2E8F0" />
    <rect x={-14} y={34} width={11} height={22} rx={5} fill="#F8FAFC" /><rect x={3} y={34} width={11} height={22} rx={5} fill="#F8FAFC" />
    <rect x={18} y={0} width={10} height={26} rx={5} fill="#F8FAFC" transform="rotate(-30 23 0)" />
    <circle cx={0} cy={-24} r={20} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={3} />
    <rect x={-13} y={-32} width={26} height={16} rx={8} fill="#22D3EE" />
    <rect x={-16} y={8} width={14} height={9} rx={3} fill="#FBBF24" />
  </g>
);
const ArrowV: React.FC<{ x: number; y: number; len: number; color: string; w?: number }> = ({ x, y, len, color, w = 10 }) => {
  if (Math.abs(len) < 6) return null;
  const d = Math.sign(len), e = y + len;
  return <g><line x1={x} y1={y} x2={x} y2={e - d * 18} stroke={color} strokeWidth={w} strokeLinecap="round" /><path d={`M${x - 16} ${e - d * 22} L${x + 16} ${e - d * 22} L${x} ${e}Z`} fill={color} /></g>;
};
const Legend: React.FC<{ items: [string, string, string][]; at: number; start: number; top?: number }> = ({ items, at, start, top = 1300 }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", flexDirection: "column", gap: 10 }}>
    {items.map(([c, l, v], i) => (
      <Rise key={i} at={at + i * 5} start={start} y={20}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 18px", borderRadius: 18, background: "rgba(0,0,0,.45)", border: "2px solid rgba(255,255,255,.1)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: c }} />
          <div style={{ ...S, fontSize: 30, color: "#fff", flex: 1 }}>{l}</div>
          <div style={{ ...S, fontSize: 30, color: theme.colors.primary }}>{v}</div>
        </div>
      </Rise>
    ))}
  </div>
);

/* 2–3 — DEPTH: Kola vs crust */
export const Depth: React.FC<P> = ({ start }) => {
  const t = useT(start);
  const sp = useAbsSpring(F(segT(2)), start, theme.spring.smooth);
  const zoom = interpolate(t, [wordT(2, "doze") - 0.3, wordT(2, "doze") + 1.0], [0, 1], { ...cl, easing: eio });
  const kola = interpolate(t, [wordT(2, "doze") + 0.6, wordT(2, "doze") + 1.6], [0, 1], { ...cl, easing: eio });
  const crustHi = useAbsSpring(W(3, "crosta") - 4, start, theme.spring.bouncy);
  return (
    <AbsoluteFill>
      <BgMesh a="#7c2d12" b="#1e3a8a" base={theme.colors.bg} />
      <Title top={150}><Rise at={F(segT(2)) + 2} start={start}><div style={{ ...H, fontSize: 70 }}>O BURACO MAIS FUNDO</div><div style={{ ...H, fontSize: 70, color: theme.colors.primary }}>JÁ CAVADO</div></Rise></Title>
      <div style={{ opacity: sp * (1 - zoom), transform: `scale(${1 + zoom * 2})`, transformOrigin: `${CX}px ${CY - RR}px`, position: "absolute", inset: 0 }}>
        <Section tunnel={0}><text x={CX} y={CY + RR + 70} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={44} fill="#fff" opacity={interpolate(t, [wordT(2, "treze") - 0.3, wordT(2, "treze")], [0, 1], cl)}>DIÂMETRO: 12.742 km</text></Section>
      </div>
      {zoom > 0.02 && (
        <div style={{ position: "absolute", left: 90, top: 440, width: 900, height: 820, borderRadius: 34, overflow: "hidden", opacity: zoom, transform: `scale(${0.85 + 0.15 * zoom})`, border: "3px solid rgba(255,255,255,.2)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(#0b1022 0 14%, #6b4f2a 14% 54%, #9A3412 54%)" }} />
          <div style={{ position: "absolute", left: 20, top: 30, ...S, fontSize: 30, color: "#fff" }}>SUPERFÍCIE</div>
          <div style={{ position: "absolute", left: 20, top: 125, padding: "6px 14px", borderRadius: 10, background: "rgba(0,0,0,.35)", ...S, fontSize: 32, color: "#FDE68A", transform: `scale(${1 + 0.1 * crustHi})`, transformOrigin: "0 0" }}>CROSTA · ~35 km</div>
          <div style={{ position: "absolute", left: 20, top: 470, ...S, fontSize: 32, color: "#FED7AA" }}>MANTO ↓ (até o centro: 6.371 km)</div>
          <div style={{ position: "absolute", left: 600, top: 115, width: 40, height: 260 * kola, background: "#0b0b12", borderRadius: "0 0 20px 20px", border: "3px solid rgba(255,255,255,.4)", borderTop: "none" }} />
          <div style={{ position: "absolute", left: 660, top: 115 + 230 * kola, opacity: kola, ...S, fontSize: 34, color: theme.colors.primary }}>POÇO DE KOLA<br /><span style={{ color: "#fff" }}>12 km</span></div>
          <svg width={900} height={820} style={{ position: "absolute", inset: 0, opacity: crustHi }}><line x1={0} x2={900} y1={443} y2={443} stroke="#FBBF24" strokeWidth={6} strokeDasharray="18 12" /></svg>
        </div>
      )}
      <AbsoluteFill style={{ top: 1320, alignItems: "center" }}><Rise at={W(3, "crosta") - 2} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={40} glow>NEM ATRAVESSA A CROSTA</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 4–5 — HEAT & PRESSURE */
export const Heat: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const sp = useAbsSpring(F(segT(4)), start, theme.spring.smooth);
  const sun = useAbsSpring(W(4, "sol") - 4, start, theme.spring.bouncy);
  const pres = useAbsSpring(W(5, "pressao") - 4, start, theme.spring.bouncy);
  const squeeze = interpolate(t, [wordT(5, "pressao"), wordT(5, "milhoes") + 0.4], [0, 1], { ...cl, easing: eio });
  return (
    <AbsoluteFill>
      <BgMesh a="#9A3412" b="#FBBF24" base={theme.colors.bg} />
      <Title top={150}><Rise at={F(segT(4)) + 2} start={start}><div style={{ ...H, fontSize: 76 }}>LÁ EMBAIXO…</div></Rise></Title>
      <div style={{ position: "absolute", inset: 0, opacity: sp, transform: `scale(${0.75}) translateY(-120px)`, transformOrigin: `${CX}px ${CY}px` }}>
        <Section tunnel={0}>
          {pres > 0.05 && Array.from({ length: 8 }).map((_, i) => { const a = (i / 8) * Math.PI * 2; const r1 = RR * (1.25 - 0.18 * squeeze), r2 = RR * (1.05 - 0.1 * squeeze); return <g key={i} opacity={pres}><line x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1} x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2} stroke="#22D3EE" strokeWidth={10} strokeLinecap="round" /><circle cx={CX + Math.cos(a) * r2} cy={CY + Math.sin(a) * r2} r={10} fill="#22D3EE" /></g>; })}
        </Section>
      </div>
      <Legend at={W(4, "nucleo") - 6} start={start} top={1040} items={[["#8B5E34", "CROSTA", "fina"], ["#C2410C", "MANTO", "até ~3.700°C"], ["#F59E0B", "NÚCLEO EXTERNO", "metal líquido"], ["#FFF3C4", "NÚCLEO INTERNO", "~5.200°C"]]} />
      <div style={{ position: "absolute", left: 160, right: 160, top: 1390, display: "flex", justifyContent: "center", opacity: sun * (1 - pres), transform: `scale(${0.7 + 0.3 * sun})` }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 26px", borderRadius: 24, background: "rgba(251,191,36,.18)", border: `3px solid ${theme.colors.primary}` }}>
          <svg width="54" height="54" viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="#FBBF24" />{Array.from({ length: 8 }).map((_, i) => <line key={i} x1="50" y1="12" x2="50" y2="2" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" transform={`rotate(${i * 45 + f} 50 50)`} />)}</svg>
          <div style={{ ...S, fontSize: 32, color: "#fff" }}>≈ SUPERFÍCIE DO SOL (~5.500°C)</div>
        </div>
      </div>
      <AbsoluteFill style={{ top: 1390, alignItems: "center" }}><div style={{ opacity: pres, transform: `scale(${0.7 + 0.3 * pres})` }}><Pill bg="#22D3EE" size={38}>PRESSÃO: 3 MILHÕES × A DO AR</Pill></div></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 6–10 — THE FALL (explained) */
export const Fall: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const s6 = segT(6), s7 = segT(7), s8 = segT(8), s9 = segT(9), s10 = segT(10);
  const sA = interpolate(t, [wordT(6, "cairia") - 0.2, wordT(6, "centro") + 0.1], [0, 0.5], { ...cl, easing: Easing.in(Easing.sin) });
  const sB = interpolate(t, [s8 + 0.4, s9], [0, 0.25], { ...cl, easing: Easing.out(Easing.sin) });
  const sC = interpolate(t, [s9 + 0.2, wordT(9, "borda") + 0.2], [0, 0.25], { ...cl, easing: Easing.out(Easing.sin) });
  const s = sA + sB + sC;
  const osc = t > s10 + 0.4 ? t - s10 - 0.4 : 0;
  let y = Math.cos(Math.PI * s); let v = Math.sin(Math.PI * s);
  if (osc > 0) { y = -Math.cos(osc * 2.4); v = Math.sin(osc * 2.4); }
  const ay = CY - y * (RR - 30);
  const kmh = Math.round(Math.abs(v) * 28400);
  const mins = osc > 0 ? 38 : Math.round(s * 38);
  const gLen = y * 150; // gravity points to center (screen y grows downward)
  const vLen = (osc > 0 ? Math.sign(v) * -1 : 1) * Math.abs(v) * 150 * (osc > 0 ? -1 : 1);
  const field = interpolate(t, [s7 + 0.2, s7 + 1.4, s8 + 0.2, s8 + 0.6], [0, 1, 1, 0], cl);
  const swing = useAbsSpring(W(8, "balanco") - 6, start, theme.spring.bouncy);
  const hud = useAbsSpring(W(6, "cairia") - 6, start, theme.spring.smooth);
  const ttl = t < s7 ? "A QUEDA" : t < s8 ? "POR QUE ACELERA?" : t < s10 ? "DEPOIS DO CENTRO…" : "E NINGUÉM TE SEGURA…";
  const pend = Math.sin(t * 2.4) * 0.6;
  const trail = osc > 0 ? Array.from({ length: 10 }).map((_, i) => { const o = osc - i * 0.05; return o > 0 ? CY + Math.cos(o * 2.4) * (RR - 30) : null; }) : [];
  return (
    <AbsoluteFill>
      <BgMesh a="#1e3a8a" b="#F59E0B" base={theme.colors.bg} />
      <Section dim={field * 0.15}>
        {field > 0.02 && [-0.85, -0.55, -0.25, 0.25, 0.55, 0.85].map((p, i) => <g key={i} opacity={field}><ArrowV x={CX + 90} y={CY - p * (RR - 30)} len={p * 0.9 * 120} color={theme.colors.primary} w={8} /></g>)}
        {trail.map((ty, i) => ty !== null && <circle key={i} cx={CX} cy={ty} r={14 - i} fill="#22D3EE" opacity={0.5 - i * 0.045} />)}
        {t > wordT(6, "cairia") - 0.4 && <ArrowV x={CX - 60} y={ay} len={gLen} color={theme.colors.primary} />}
        {t > wordT(6, "cairia") - 0.4 && Math.abs(v) > 0.05 && <ArrowV x={CX + 60} y={ay} len={(osc > 0 ? -Math.sign(Math.sin(osc * 2.4)) : 1) * Math.abs(v) * 140} color="#22D3EE" />}
        <Astro x={CX} y={ay - 6} rot={Math.sin(f / 10) * 12} />
      </Section>
      <Title top={150}><div key={ttl} style={{ ...H, fontSize: 72 }}>{ttl}</div></Title>
      {t > wordT(6, "cairia") - 0.4 && t < s10 && (
        <div style={{ position: "absolute", left: 70, top: 300, display: "flex", flexDirection: "column", gap: 8, opacity: hud }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 22, height: 8, background: theme.colors.primary, borderRadius: 4 }} /><div style={{ ...S, fontSize: 26, color: theme.colors.primary }}>GRAVIDADE (PRO CENTRO)</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 22, height: 8, background: "#22D3EE", borderRadius: 4 }} /><div style={{ ...S, fontSize: 26, color: "#22D3EE" }}>SUA VELOCIDADE</div></div>
        </div>
      )}
      <div style={{ position: "absolute", left: 60, right: 60, top: 1320, display: "flex", justifyContent: "space-between", opacity: hud, transform: `translateY(${(1 - hud) * 40}px)` }}>
        <div style={{ width: 470, padding: "14px 22px", borderRadius: 22, background: "rgba(0,0,0,.55)", border: "2px solid rgba(34,211,238,.6)" }}>
          <div style={{ ...S, fontSize: 22, color: theme.colors.textDim }}>VELOCIDADE</div>
          <div style={{ ...S, fontSize: 54, color: "#22D3EE", fontVariantNumeric: "tabular-nums" }}>{kmh.toLocaleString("pt-BR")}<span style={{ fontSize: 26 }}> km/h</span></div>
        </div>
        <div style={{ width: 380, padding: "14px 22px", borderRadius: 22, background: "rgba(0,0,0,.55)", border: `2px solid ${theme.colors.primary}` }}>
          <div style={{ ...S, fontSize: 22, color: theme.colors.textDim }}>TEMPO DE QUEDA</div>
          <div style={{ ...S, fontSize: 54, color: theme.colors.primary, fontVariantNumeric: "tabular-nums" }}>{mins}<span style={{ fontSize: 26 }}> min</span></div>
        </div>
      </div>
      {/* swing analogy */}
      <div style={{ position: "absolute", right: 50, top: 290, width: 240, height: 250, borderRadius: 26, background: "rgba(0,0,0,.5)", border: "2px solid rgba(255,255,255,.15)", opacity: swing * (t < s10 ? 1 : 0), transform: `scale(${0.6 + 0.4 * swing})`, transformOrigin: "100% 0" }}>
        <svg width={240} height={210}><line x1={40} x2={200} y1={20} y2={20} stroke="#94A3B8" strokeWidth={6} /><g transform={`rotate(${pend * 57} 120 20)`}><line x1={105} y1={20} x2={105} y2={150} stroke="#cbd5e1" strokeWidth={3} /><line x1={135} y1={20} x2={135} y2={150} stroke="#cbd5e1" strokeWidth={3} /><rect x={95} y={148} width={50} height={10} rx={4} fill={theme.colors.primary} /><circle cx={120} cy={132} r={12} fill="#fff" /></g></svg>
        <div style={{ ...S, fontSize: 26, color: "#fff", textAlign: "center", marginTop: -6 }}>COMO UM BALANÇO</div>
      </div>
      <AbsoluteFill style={{ top: 228, alignItems: "center" }}>
        {t > s9 + 1 && t < s10 && <Rise at={W(9, "trinta") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={40} glow>DO OUTRO LADO EM ~38 MIN</Pill></Rise>}
        {t > s10 && <Rise at={W(10, "sempre") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg="#fff" size={42}>INDO E VOLTANDO PRA SEMPRE ∞</Pill></Rise>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 11–12 — REAL LIFE */
export const Reality: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const a = useAbsSpring(W(11, "ar") - 4, start, theme.spring.smooth);
  const b = useAbsSpring(W(11, "rotacao") - 4, start, theme.spring.smooth);
  const end = useAbsSpring(W(12, "pular") - 6, start, theme.spring.bouncy);
  const ta = Math.max(0, t - wordT(11, "ar"));
  const damp = Math.exp(-ta * 0.9);
  const ya = Math.cos(ta * 3.2) * damp;
  const tb = Math.max(0, t - wordT(11, "rotacao"));
  const drift = Math.min(1, tb * 0.7);
  const hit = drift >= 1;
  const r = 200;
  const panel = (cy: number, title: string, res: string, p: number, kind: "air" | "rot", resAt: number) => (
    <div style={{ position: "absolute", left: 60, right: 60, top: cy, height: 560, borderRadius: 34, background: "rgba(0,0,0,.4)", border: "2px solid rgba(255,255,255,.12)", opacity: p, transform: `translateY(${(1 - p) * 60}px)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 30, top: 24, ...S, fontSize: 40, color: "#fff" }}>{title}</div>
      <svg width={960} height={560} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(330 300) rotate(${kind === "rot" ? tb * 25 : 0})`}>
          <circle r={r} fill="#C2410C" /><circle r={r * 0.546} fill="#F59E0B" /><circle r={r * 0.19} fill="#FFFBEB" /><circle r={r} fill="none" stroke="#8B5E34" strokeWidth={8} />
          <rect x={-10} y={-r} width={20} height={2 * r} rx={10} fill="#0b0b12" />
          {kind === "air" ? <Astro x={0} y={-ya * (r - 25)} s={0.55} /> : <Astro x={-drift * 18 + (hit ? Math.sin(f) * 2 : 0)} y={-(r - 25) + drift * 90} s={0.55} rot={hit ? -30 : 0} />}
        </g>
        {kind === "air" && Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M${560 + i * 30} ${180 + (i % 3) * 60} q20 -10 40 0 t40 0`} stroke="rgba(186,230,253,.6)" strokeWidth={4} fill="none" transform={`translate(${-((f * 3 + i * 40) % 120)} 0)`} />)}
        {kind === "rot" && <path d="M560 160 A 160 160 0 0 1 700 300" stroke="#22D3EE" strokeWidth={8} fill="none" markerEnd="" />}
        {kind === "rot" && hit && <text x={380} y={170} fontFamily="Montserrat" fontWeight={900} fontSize={48} fill="#F87171">BAM!</text>}
      </svg>
      <div style={{ position: "absolute", right: 30, bottom: 30 }}><Rise at={resAt} start={start} cfg={theme.spring.bouncy}><Pill bg={kind === "air" ? "#BAE6FD" : "#F87171"} size={34}>{res}</Pill></Rise></div>
    </div>
  );
  return (
    <AbsoluteFill>
      <BgMesh a="#334155" b="#22D3EE" base={theme.colors.bg} />
      <Title top={150}><Rise at={W(11, "real") - 4} start={start}><div style={{ ...H, fontSize: 76 }}>NA VIDA REAL…</div></Rise></Title>
      {panel(300, "COM AR NO TÚNEL", "PARA NO CENTRO", a, "air", W(11, "centro") - 4)}
      {panel(890, "COM A ROTAÇÃO DA TERRA", "BATE NA PAREDE", b, "rot", W(11, "parede") - 4)}
      <AbsoluteFill style={{ background: `rgba(3,4,10,${0.75 * end})`, alignItems: "center", justifyContent: "center", display: end > 0.01 ? "flex" : "none" }}>
        <div style={{ opacity: end, transform: `scale(${0.7 + 0.3 * end}) rotate(-3deg)`, marginTop: -120 }}><div style={{ ...H, fontSize: 110, color: theme.colors.primary, textShadow: `0 0 50px ${theme.colors.glow}` }}>MELHOR</div><div style={{ ...H, fontSize: 110 }}>NÃO PULAR.</div></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 7 — CTA */
export const CTA: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const c = F(segT(13)) - 4;
  const p = useAbsSpring(c, start, theme.spring.smooth);
  return (
    <AbsoluteFill>
      <BgMesh a="#7c2d12" b="#22D3EE" base={theme.colors.bg} />
      <Title top={330}>
        <div style={{ width: 230, height: 230, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)", boxShadow: "0 0 60px rgba(124,92,255,.55)", transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`, marginBottom: 14 }}>
          <Img src={staticFile("buraco/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45) translateY(1%)" }} />
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
