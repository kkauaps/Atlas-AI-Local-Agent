import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "./theme";
import { useBlock, Sfx } from "./core";
import { useAbsSpring } from "./ui";
import { cl } from "./cl";
import { useV, Stage, StarField, Nebula, Glow, Points, StarBody, Shock, HoloBody, sampleBody, rng, V3 } from "./hd";

export const F = theme.fonts.display;
export const win = (t: number, a: number, b: number, fade = 0.4) => { const fd = Math.max(0.02, Math.min(fade, (b - a) / 2.2)); if (b - a < 0.08) return 0; return interpolate(t, [a - fd, a, b - fd, b], [0, 1, 1, 0], cl); };
export const Layer: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => o > 0.003 ? <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill> : null;
export const E = (t: number, a: number, b: number, ease = Easing.out(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...cl, easing: ease });

/* ---------- big kinetic title ---------- */
export const vx = (x: number) => 540 + (x - 960) * 0.56;
export const vy = (y: number) => 1180 + (y - 540) * 1.2;
export const Title: React.FC<{ at: number; lines: [string, string?]; top?: number; size?: number; color2?: string }> = ({ at, lines, top: top0 = 90, size: size0 = 96, color2 = theme.colors.primary }) => {
  const v = useV(); const top = v ? 290 + Math.max(0, top0 - 60) * 0.6 : top0; const size = v ? Math.min(96, size0 * 0.8) : size0;
  const p = useAbsSpring(at, 0, { damping: 16, stiffness: 120, mass: 0.8 });
  return (
    <div style={{ position: "absolute", left: v ? 40 : 0, right: v ? 40 : 0, top, textAlign: "center", fontFamily: F, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 0.98, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.92 + 0.08 * p})`, filter: `blur(${(1 - Math.min(1, p)) * 8}px)` }}>
      <div style={{ fontSize: size, color: "#fff", textShadow: "0 6px 40px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.9)" }}>{lines[0]}</div>
      {lines[1] && <div style={{ fontSize: size, color: color2, textShadow: `0 0 50px ${color2}66, 0 6px 40px rgba(0,0,0,.9)` }}>{lines[1]}</div>}
    </div>
  );
};
/* glass periodic tile */
export const Tile: React.FC<{ at: number; sym: string; name: string; num: number; color: string; x: number; y: number; size?: number }> = ({ at, sym, name, num, color, x: x0, y: y0, size: s0 = 210 }) => {
  const v = useV(); const x = v ? vx(x0) : x0, y = v ? vy(y0) : y0, size = v ? s0 * 0.66 : s0;
  const p = useAbsSpring(at, 0, { damping: 12, stiffness: 150, mass: 0.7 });
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: 26, opacity: Math.min(1, p * 1.5), transform: `scale(${0.4 + 0.6 * p}) rotateY(${(1 - p) * 60}deg) translateY(${Math.sin(f / 22 + x) * 6}px)`,
      background: `linear-gradient(150deg, ${color}EE, ${color}55 60%, rgba(0,0,0,.35))`, border: "2px solid rgba(255,255,255,.55)", boxShadow: `0 0 60px ${color}AA, inset 0 0 30px rgba(255,255,255,.25)`, backdropFilter: "blur(6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", left: 16, top: 10, fontFamily: F, fontWeight: 800, fontSize: size * 0.13, color: "#fff" }}>{num}</div>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: size * 0.46, color: "#fff", lineHeight: 1, textShadow: "0 4px 20px rgba(0,0,0,.5)" }}>{sym}</div>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: size * 0.11, color: "#fff", marginTop: 6, letterSpacing: "0.04em" }}>{name}</div>
    </div>
  );
};
export const Tag: React.FC<{ at: number; children: React.ReactNode; bottom?: number; color?: string; hideV?: boolean }> = ({ at, children, bottom: b0 = 170, color = theme.colors.primary, hideV }) => {
  const v = useV(); const p = useAbsSpring(at, 0, theme.spring.bouncy); if (v && hideV) return null; const bottom = v ? 570 : b0 + 60;
  return <div style={{ position: "absolute", left: v ? 50 : 0, right: v ? 50 : 0, bottom, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})` }}>
    <div style={{ textAlign: "center", lineHeight: 1.1, fontFamily: F, fontWeight: 900, fontSize: v ? 44 : 50, color: "#0b0b12", background: color, padding: "14px 34px", borderRadius: 20, boxShadow: `0 0 60px ${color}99` }}>{children}</div></div>;
};

/* ---------- particle systems (pure functions of time) ---------- */
export const burst = (n: number, seed: number, p: number, rMin: number, rMax: number, pal: number[][], flat = 1) => {
  const R = rng(seed); const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); const e = Easing.out(Easing.cubic)(p);
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, th = R() * Math.PI * 2, q = Math.sqrt(1 - u * u); const sp = rMin + (rMax - rMin) * Math.pow(R(), 0.7); const d = e * sp;
    pos.set([q * Math.cos(th) * d, u * d * flat, q * Math.sin(th) * d], i * 3); const k = pal[i % pal.length]; const b = (0.6 + R() * 1.2) * (1 - p * 0.55); col.set([k[0] * b, k[1] * b, k[2] * b], i * 3); }
  return { pos, col };
};

export const B2HD: React.FC = () => {
  const { t, w, W } = useBlock("b2"); const f = useCurrentFrame();
  const A = win(t, 3.0, w("logo") - 0.2), B = win(t, w("logo") - 0.2, w("elementos") - 0.2), C = win(t, w("elementos") - 0.2, w("calcio") - 0.3),
    D = win(t, w("calcio") - 0.3, w("ouro") - 0.3), Ee = win(t, w("ouro") - 0.3, w("tirando") - 0.2), G = win(t, w("tirando") - 0.2, 999);
  const shake = (a: number, amp = 0.15) => { const k = Math.max(0, 1 - (t - a) / 0.9); return t > a ? [Math.sin(f * 2.3) * amp * k, Math.cos(f * 1.7) * amp * k] : [0, 0]; };

  // B: big bang
  const bang = E(t, w("bang") - 0.15, w("bang") + 2.2);
  const bangP = burst(6000, 11, bang, 2, 14, [[1, 1, 1], [0.6, 0.75, 1], [0.75, 0.6, 1], [1, 0.85, 0.7]]);
  // C: star -> supernova
  const nova = E(t, w("explosoes") - 0.05, w("explosoes") + 2.6);
  const collapse = E(t, w("explosoes") - 0.5, w("explosoes") - 0.05, Easing.in(Easing.cubic));
  const novaP = burst(9000, 21, nova, 1.5, 16, [[0.75, 0.78, 0.85], [1, 0.35, 0.3], [1, 0.6, 0.2], [1, 0.95, 0.7], [0.6, 0.5, 1]], 0.85);
  const sC = shake(w("explosoes"), 0.22);
  // E: neutron star merger
  const spiral = E(t, w("ouro") - 0.3, w("colidiram") + 0.1, Easing.in(Easing.quad));
  const kilo = E(t, w("colidiram") + 0.05, w("colidiram") + 2.8);
  const kiloP = burst(8000, 31, kilo, 1, 12, [[1, 0.82, 0.3], [1, 0.95, 0.75], [0.85, 0.85, 0.9], [1, 0.7, 0.2]], 0.55);
  const sE = shake(w("colidiram") + 0.05, 0.25);
  const trail = useMemo(() => ({ pos: new Float32Array(2 * 90 * 3), col: new Float32Array(2 * 90 * 3) }), []);
  const ang = (tt: number) => { const s = E(tt, w("ouro") - 0.3, w("colidiram") + 0.1, Easing.in(Easing.quad)); return { r: 2.4 * (1 - s * 0.97), a: tt * 2.2 + Math.pow(s, 2) * 26 }; };
  for (let k = 0; k < 90; k++) { const tt = t - k * 0.012; const { r, a } = ang(tt); for (let s = 0; s < 2; s++) { const aa = a + s * Math.PI; trail.pos.set([Math.cos(aa) * r, 0, Math.sin(aa) * r], (s * 90 + k) * 3); const b = (1 - k / 90) * 1.4; trail.col.set([0.55 * b, 0.75 * b, 1 * b], (s * 90 + k) * 3); } }
  const { r: nsR, a: nsA } = ang(t);
  // F: stardust -> human
  const body = useMemo(() => sampleBody(9000, 8), []);
  const cloud = useMemo(() => { const R = rng(41); const p = new Float32Array(9000 * 3); for (let i = 0; i < 9000; i++) { const a = R() * Math.PI * 2, rr = 3 + R() * 9; p.set([Math.cos(a) * rr, (R() - 0.5) * 8, Math.sin(a) * rr - 2], i * 3); } return p; }, []);
  const form = E(t, w("tirando") + 0.2, w("estrela") + 0.4, Easing.inOut(Easing.cubic));
  const human = useMemo(() => ({ pos: new Float32Array(9000 * 3), col: new Float32Array(9000 * 3) }), []);
  { const R = rng(77); for (let i = 0; i < 9000; i++) { const sw = (1 - form) * (t * 0.6 + i * 0.001); const cx = cloud[i * 3], cz = cloud[i * 3 + 2]; const ca = Math.cos(sw), sa = Math.sin(sw);
      const sx = cx * ca - cz * sa, sz = cx * sa + cz * ca; const tx = body[i * 3], ty = body[i * 3 + 1] - 0.4, tz = body[i * 3 + 2]; const jit = Math.sin(t * 3 + i) * 0.01;
      human.pos.set([sx + (tx - sx) * form + jit, cloud[i * 3 + 1] + (ty - cloud[i * 3 + 1]) * form, sz + (tz - sz) * form], i * 3);
      const k = [[1, 0.85, 0.45], [1, 0.65, 0.3], [0.75, 0.65, 1], [0.6, 0.8, 1]][i % 4]; const b = 0.55 + R() * 0.9; human.col.set([k[0] * b, k[1] * b, k[2] * b], i * 3); } }

  return (
    <AbsoluteFill>
      {/* A: fly-through */}
      <Layer o={A}>
        <Stage pos={[0, 0, 30 - t * 4]} tgt={[0, 0, -40]} fov={55} roll={t * 0.03} bloom={1.3}>
          <StarField n={12000} size={0.6} /><Nebula seed={2} z={-70} opacity={0.5} />
        </Stage>
        <Title at={Math.round(3.2 * 30)} lines={["VOCÊ É FEITO DE", "RESTOS DE ESTRELAS"]} top={360} size={120} />
      </Layer>
      {/* B: big bang */}
      <Layer o={B}>
        <Stage pos={[0, 0.6, 16 - bang * 3]} tgt={[0, 0, 0]} fov={50} bloom={1.6}>
          <StarField n={5000} size={0.45} opacity={bang} />
          <Glow size={0.6 + bang * 30} color="#ffffff" opacity={bang > 0 ? Math.max(0, 1 - bang * 1.6) : 1} />
          <Glow size={bang * 40} color="#a78bfa" opacity={bang * (1 - bang) * 1.6} />
          {bang > 0 && <Points pos={bangP.pos} col={bangP.col} size={0.12} />}
          <Shock p={bang} r={22} color="#c4b5fd" tilt={1.45} /><Shock p={Math.max(0, bang - 0.12)} r={18} color="#ffffff" tilt={1.2} />
        </Stage>
        <Title at={W("big") - 4} lines={["LOGO DEPOIS DO", "BIG BANG"]} top={80} size={92} />
        <Tile at={W("hidrogenio") - 3} sym="H" name="HIDROGÊNIO" num={1} color="#3b82f6" x={760} y={620} size={240} />
        <Tile at={W("helio") - 3} sym="He" name="HÉLIO" num={2} color="#a855f7" x={1160} y={620} size={240} />
      </Layer>
      {/* C: star forge -> supernova */}
      <Layer o={C}>
        <Stage pos={[-2 + sC[0] - (t - w("elementos")) * 0.15, 0.5 + sC[1], 13 - (t - w("elementos")) * 0.25]} tgt={[-3.2, 0, 0]} fov={45} bloom={1.5}>
          <StarField n={6000} size={0.45} /><Nebula seed={5} colors={["#f97316", "#db2777", "#7c3aed"]} z={-50} opacity={0.35} />
          {collapse < 1 && nova < 0.02 && <StarBody pos={[-3.2, 0, 0]} r={2.4 * (1 - collapse * 0.85)} t={t} heat={1.4 + collapse * 3} />}
          <Glow pos={[-3.2, 0, 0]} size={1 + nova * 40} color="#ffffff" opacity={nova > 0 ? Math.max(0, 1 - nova * 1.4) : 0} />
          <Glow pos={[-3.2, 0, 0]} size={nova * 26} color="#fb923c" opacity={nova * (1 - nova) * 2} />
          {nova > 0 && <group position={[-3.2, 0, 0]}><Points pos={novaP.pos} col={novaP.col} size={0.11} /></group>}
          <Shock p={nova} r={20} color="#fde68a" pos={[-3.2, 0, 0]} /><Shock p={Math.max(0, nova - 0.1)} r={16} color="#f97316" pos={[-3.2, 0, 0]} tilt={0.9} />
        </Stage>
        <Title at={W("fabricados") - 6} lines={["FORJADOS DENTRO", "DE ESTRELAS"]} top={70} size={84} />
        <Tile at={W("carbono") - 3} sym="C" name="CARBONO" num={6} color="#64748b" x={1240} y={560} />
        <Tile at={W("oxigenio") - 3} sym="O" name="OXIGÊNIO" num={8} color="#ef4444" x={1480} y={560} />
        <Tile at={W("ferro") - 3} sym="Fe" name="FERRO" num={26} color="#c2410c" x={1720} y={560} />
        <Tag at={W("explosoes") - 4} color="#fb923c">💥 ESPALHADOS NA EXPLOSÃO</Tag>
      </Layer>
      {/* D: your body */}
      <Layer o={D}>
        <Stage pos={[Math.sin(t * 0.25) * 2.2, 0.7, 5.2]} tgt={[0, 0.55, 0]} fov={42} bloom={1.2}>
          <StarField n={6000} size={0.4} /><Nebula seed={9} colors={["#7c3aed", "#2563eb"]} z={-40} opacity={0.4} />
          <HoloBody color="#93c5fd" opacity={E(t, w("calcio") - 0.3, w("calcio") + 0.5)} pos={[0, -0.3, 0]} spin={t * 0.15} />
          {/* bones glow (Ca) */}
          {[[-0.15, -1.08], [0.15, -1.08], [-0.14, -0.35], [0.14, -0.35], [-0.42, 0.7], [0.42, 0.7]].map(([x, y], i) => <Glow key={i} pos={[x, y, 0.05]} size={0.5 + 0.08 * Math.sin(f / 6 + i)} color="#e0f2fe" opacity={E(t, w("ossos") - 0.4, w("ossos") + 0.2) * 0.9} />)}
          {/* blood (Fe) */}
          {Array.from({ length: 14 }).map((_, i) => { const ph = ((t * 0.5 + i / 14) % 1); return <Glow key={i} pos={[Math.sin(ph * 6.28) * 0.12, 0.2 + ph * 1.1, 0.12]} size={0.22} color="#ef4444" opacity={E(t, w("sangue") - 0.5, w("sangue") + 0.2)} />; })}
          {/* lungs (O) */}
          {[-0.12, 0.12].map((x, i) => <Glow key={i} pos={[x, 0.95, 0.1]} size={0.6 + 0.12 * Math.sin(t * 3)} color="#22d3ee" opacity={E(t, w("respira") - 0.5, w("respira") + 0.2)} />)}
        </Stage>
        <Tile at={W("calcio") - 3} sym="Ca" name="CÁLCIO · OSSOS" num={20} color="#94a3b8" x={460} y={560} size={230} />
        <Tile at={W("sangue") - 4} sym="Fe" name="FERRO · SANGUE" num={26} color="#dc2626" x={1460} y={430} size={230} />
        <Tile at={W("respira") - 4} sym="O" name="OXIGÊNIO · AR" num={8} color="#0891b2" x={1460} y={720} size={230} />
        <Title at={W("forjado") - 6} lines={["TUDO FORJADO EM", "ESTRELAS ANTIGAS"]} top={60} size={78} />
      </Layer>
      {/* E: neutron star merger */}
      <Layer o={Ee}>
        <Stage pos={[sE[0], 3.2 + sE[1], 8.5 - spiral * 1.5]} tgt={[0, 0, 0]} fov={45} bloom={1.7}>
          <StarField n={7000} size={0.45} /><Nebula seed={12} colors={["#1d4ed8", "#7c3aed"]} z={-60} opacity={0.4} />
          {kilo < 0.02 && <>
            <Points pos={trail.pos} col={trail.col} size={0.16} />
            {[0, 1].map((s) => { const a = nsA + s * Math.PI; const p: V3 = [Math.cos(a) * nsR, 0, Math.sin(a) * nsR]; return <StarBody key={s} pos={p} r={0.32} t={t * 3} a="#60a5fa" b="#e0f2fe" heat={2.2} />; })}
          </>}
          <Glow size={0.5 + kilo * 34} color="#ffffff" opacity={kilo > 0 ? Math.max(0, 1 - kilo * 1.5) : 0} />
          <Glow size={kilo * 22} color="#fbbf24" opacity={kilo * (1 - kilo) * 2.2} />
          {kilo > 0 && <Points pos={kiloP.pos} col={kiloP.col} size={0.1} />}
          {[0, 0.12, 0.24, 0.36].map((d, i) => <Shock key={i} p={Math.max(0, kilo - d)} r={18} color={i % 2 ? "#93c5fd" : "#fde68a"} tilt={1.5} />)}
        </Stage>
        <Title at={W("ouro") - 4} lines={["E O OURO? VEIO DE", "ESTRELAS DE NÊUTRONS"]} top={70} size={80} />
        <Tile at={W("colidiram") + 6} sym="Au" name="OURO" num={79} color="#ca8a04" x={1440} y={560} />
        <Tile at={W("colidiram") + 12} sym="Pt" name="PLATINA" num={78} color="#64748b" x={1680} y={560} />
        <Tag at={W("dezessete") - 4}>2017: OBSERVADO DE VERDADE</Tag>
      </Layer>
      {/* F: stardust becomes you */}
      <Layer o={G}>
        <Stage pos={[Math.sin(t * 0.3) * 3.5, 0.4, Math.cos(t * 0.3) * 3.5 + 2.6]} tgt={[0, 0.1, 0]} fov={45} bloom={1.5}>
          <StarField n={7000} size={0.45} /><Nebula seed={15} colors={["#7c3aed", "#db2777", "#f59e0b"]} z={-45} opacity={0.45} />
          <Points pos={human.pos} col={human.col} size={0.085} />
          <HoloBody color="#fbbf24" opacity={form * 0.7} pos={[0, -0.4, 0]} />
          <Glow pos={[0, 0.5, 0]} size={5 * form} color="#fbbf24" opacity={0.18 * form} />
        </Stage>
        <Title at={W("quase") - 4} lines={["QUASE TODO ÁTOMO DO SEU CORPO", "NASCEU NUMA ESTRELA"]} top={70} size={72} />
        <Tag at={W("poeira") - 4} bottom={150}>✨ VOCÊ É POEIRA DE ESTRELAS</Tag>
      </Layer>
      <Sfx at={W("bang") - 3} src="impact.wav" vol={0.32} />
      <Sfx at={W("bang") - 30} src="riser.wav" vol={0.18} />
      <Sfx at={W("explosoes") - 20} src="riser.wav" vol={0.2} />
      <Sfx at={W("explosoes") - 1} src="impact.wav" vol={0.32} />
      <Sfx at={W("calcio") - 3} src="sparkle.wav" vol={0.16} />
      <Sfx at={W("colidiram") - 1} src="impact.wav" vol={0.34} />
      <Sfx at={W("poeira") - 4} src="sparkle.wav" vol={0.22} />
    </AbsoluteFill>
  );
};
