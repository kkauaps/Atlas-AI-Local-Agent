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

/* 2 — SCALE: Kola 12 km vs 12.742 km */
export const Scale: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame(); const t = useT(start);
  const sp = useAbsSpring(F(segT(2)), start, theme.spring.smooth);
  const kola = useAbsSpring(W(2, "doze") - 4, start, theme.spring.bouncy);
  const zoom = interpolate(t, [wordT(2, "doze") - 0.2, wordT(2, "doze") + 1.2], [0, 1], { ...cl, easing: eio });
  const earth = useAbsSpring(W(2, "treze") - 4, start, theme.spring.bouncy);
  const R = 440, cx = 540, cy = 1280;
  return (
    <AbsoluteFill>
      <BgMesh a="#7c2d12" b="#22D3EE" base={theme.colors.bg} />
      <Title top={150}><Rise at={F(segT(2)) + 2} start={start}><div style={{ ...H, fontSize: 72 }}>O BURACO MAIS FUNDO</div><div style={{ ...H, fontSize: 72, color: theme.colors.primary }}>DO MUNDO</div></Rise></Title>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: sp }}>
        <defs><radialGradient id="ec"><stop offset="0" stopColor="#fff7d6" /><stop offset="0.2" stopColor="#fbbf24" /><stop offset="0.55" stopColor="#ea580c" /><stop offset="0.97" stopColor="#c2410c" /><stop offset="1" stopColor="#6b4f2a" /></radialGradient></defs>
        <circle cx={cx} cy={cy} r={R} fill="url(#ec)" />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy - R + 6} stroke="#fff" strokeWidth={6} />
        <g opacity={earth}><line x1={cx - R} y1={cy + R + 40} x2={cx + R} y2={cy + R + 40} stroke="#fff" strokeWidth={4} /><text x={cx} y={cy + R + 90} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={44} fill="#fff">12.742 km</text></g>
      </svg>
      {/* magnifier */}
      <div style={{ position: "absolute", left: cx - 40 + zoom * 120, top: cy - R - 330, width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: `8px solid ${theme.colors.primary}`, boxShadow: `0 0 40px ${theme.colors.glow}`, opacity: kola, transform: `scale(${0.4 + 0.6 * kola})`, background: "#0b1022" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, bottom: 0, background: "linear-gradient(#6b4f2a, #8b6b3d)" }} />
        <div style={{ position: "absolute", left: 140, top: 150, width: 20, height: 20 + 90 * zoom, background: "#0b0b12" }} />
        <div style={{ position: "absolute", left: 20, top: 40, ...S, fontSize: 28, color: "#fff" }}>POÇO DE KOLA</div>
        <div style={{ position: "absolute", left: 175, top: 190, ...S, fontSize: 30, color: theme.colors.primary }}>12 km</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: kola }}><line x1={cx} y1={cy - R} x2={cx + zoom * 120 + 110} y2={cy - R - 40} stroke={theme.colors.primary} strokeWidth={4} strokeDasharray="10 8" /></svg>
      <AbsoluteFill style={{ top: 1790 - 40, alignItems: "center" }}><Rise at={W(2, "treze") + 10} start={start}><Pill bg="#fff" size={34}>NÃO CHEGAMOS NEM A 0,1% DO CAMINHO</Pill></Rise></AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 3–6 — CUTAWAY: heat, fall, slow down, oscillate */
const Capsule: React.FC = () => (
  <group>
    <mesh><capsuleGeometry args={[0.045, 0.09, 8, 16]} /><meshStandardMaterial color="#e5e7eb" metalness={0.7} roughness={0.25} /></mesh>
    <mesh position={[0, 0.02, 0.04]}><sphereGeometry args={[0.022, 12, 12]} /><meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.8} /></mesh>
  </group>
);
export const Inside: React.FC<P> = ({ start }) => {
  const t = useT(start); const f = useCurrentFrame();
  const s3 = segT(3), s4 = segT(4), s5 = segT(5), s6 = segT(6), s7 = segT(7);
  // fall parameter s: 0 (top) -> 0.5 (center) -> 1 (other side)
  const sA = interpolate(t, [wordT(4, "cairia") - 0.3, wordT(4, "centro") + 0.2], [0, 0.5], { ...cl, easing: Easing.in(Easing.sin) });
  const sB = interpolate(t, [s5, wordT(5, "borda") + 0.2], [0, 0.5], { ...cl, easing: Easing.out(Easing.sin) });
  let s = sA + sB;
  const osc = t > s6 + 0.3 ? (t - s6 - 0.3) : 0;
  let y = Math.cos(Math.PI * s);
  if (osc > 0) y = -Math.cos(osc * 2.2);
  const speed = osc > 0 ? Math.abs(Math.sin(osc * 2.2)) : Math.abs(Math.sin(Math.PI * s));
  const kmh = Math.round(speed * 28400);
  const mins = osc > 0 ? 38 : Math.min(38, s * 38);
  const camOrbit = t * 0.12;
  const zoomIn = interpolate(t, [s3, s3 + 2], [1.25, 1], { ...cl, easing: eio });
  const ang = 0.78 + Math.sin(camOrbit) * 0.18;
  const cam = { pos: [4.6 * zoomIn * Math.cos(ang), 2.1 * zoomIn, 4.6 * zoomIn * Math.sin(ang)] as V3, tgt: [0, -0.22, 0] as V3, fov: 44 };
  const showCap = t > s4 - 0.2;
  const capP: V3 = [0, y * 0.97, 0];
  const c2 = project(capP, cam.pos, cam.tgt, cam.fov);
  const inner = project([0, -0.1, 0.12] as V3, cam.pos, cam.tgt, cam.fov);
  const outer = project([0.25, 0.35, 0.0] as V3, cam.pos, cam.tgt, cam.fov);
  const mantle = project([0.55, 0.62, 0.0] as V3, cam.pos, cam.tgt, cam.fov);
  const crust = project([0.0, 0.97, 0.15] as V3, cam.pos, cam.tgt, cam.fov);
  const heat = useAbsSpring(W(3, "cinco") - 4, start, theme.spring.bouncy);
  const sunP = useAbsSpring(W(3, "sol") - 4, start, theme.spring.bouncy);
  const hudIn = useAbsSpring(W(4, "cairia") - 6, start, theme.spring.smooth);
  const forever = useAbsSpring(W(6, "sempre") - 4, start, theme.spring.bouncy);
  const brake = interpolate(t, [wordT(5, "gravidade") - 0.2, wordT(5, "frear") + 0.3], [0, 1], cl) * (1 - interpolate(t, [s6, s6 + 0.3], [0, 1], cl));
  const temp = Math.round(interpolate(t, [wordT(3, "nucleo") - 0.2, wordT(3, "graus") + 0.2], [15, 5200], { ...cl, easing: Easing.out(Easing.cubic) }));
  const phase3 = t < s4 - 0.1;
  return (
    <AbsoluteFill>
      <Canvas3D {...cam}>
        <Stars />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 3, 4]} intensity={2.2} color="#fff4e0" />
        <pointLight position={[0.3, 0, 0.3]} intensity={2.5} color="#fbbf24" distance={2} />
        <EarthCut glow={1} />
        <Glow pos={[0.08, 0, 0.08]} size={0.7} color="#fff3c4" opacity={0.8 + 0.2 * Math.sin(f / 6)} />
        {/* tunnel */}
        <mesh><cylinderGeometry args={[0.045, 0.045, 2.02, 16, 1, true]} /><meshStandardMaterial color="#0b0b12" side={THREE.DoubleSide} transparent opacity={0.85} /></mesh>
        {showCap && <group position={capP} rotation={[0, t * 2, 0]} scale={2.2}><Capsule /></group>}
        {showCap && <Glow pos={capP} size={0.35} color="#ffffff" opacity={0.9} />}
        {showCap && speed > 0.3 && <Glow pos={[0, y * 0.97 + 0.12 * Math.sign(-Math.sin(Math.PI * s + 0.0001)), 0]} size={0.18} color="#22D3EE" opacity={speed * 0.8} />}
      </Canvas3D>
      {phase3 && (<>
        <Callout x={crust.x} y={crust.y} dx={-170} dy={-60} text="CROSTA" at={F(s3) + 6} start={start} color="#E7DCC2" size={28} out={F(s4) - 10} />
        <Callout x={mantle.x} y={mantle.y} dx={140} dy={-120} text="MANTO" at={F(s3) + 12} start={start} color="#FB923C" size={30} out={F(s4) - 10} />
        <Callout x={outer.x} y={outer.y} dx={-30} dy={-230} text="NÚCLEO EXTERNO" at={F(s3) + 18} start={start} color="#FBBF24" size={28} out={F(s4) - 10} />
        <Callout x={inner.x} y={inner.y} dx={110} dy={250} text="NÚCLEO INTERNO" at={W(3, "nucleo") - 4} start={start} color="#FFF7D6" size={30} out={F(s4) - 10} />
      </>)}
      <Title top={150}>
        {phase3 ? (<Rise at={F(s3) + 2} start={start} out={F(s4) - 8}><div style={{ ...H, fontSize: 72 }}>O QUE TEM LÁ DENTRO</div></Rise>)
          : t < s6 ? (<Rise at={F(s4)} start={start} out={F(s6) - 8}><div style={{ ...H, fontSize: 72 }}>A QUEDA</div></Rise>)
          : (<Rise at={F(s6)} start={start}><div style={{ ...H, fontSize: 72 }}>E NINGUÉM TE SEGURA…</div></Rise>)}
      </Title>
      {phase3 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1230, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ opacity: heat, transform: `scale(${0.7 + 0.3 * heat})`, padding: "20px 28px", borderRadius: 26, background: "rgba(234,88,12,.22)", border: "3px solid #FB923C" }}>
            <div style={{ ...S, fontSize: 26, color: theme.colors.textDim }}>NÚCLEO</div>
            <div style={{ ...S, fontSize: 64, color: "#FDBA74", fontVariantNumeric: "tabular-nums" }}>{temp.toLocaleString("pt-BR")}°C</div>
          </div>
          <div style={{ ...S, fontSize: 60, color: "#fff", opacity: sunP }}>≈</div>
          <div style={{ opacity: sunP, transform: `scale(${0.7 + 0.3 * sunP})`, padding: "20px 28px", borderRadius: 26, background: "rgba(251,191,36,.18)", border: `3px solid ${theme.colors.primary}`, display: "flex", gap: 16, alignItems: "center" }}>
            <svg width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="#FBBF24" />{Array.from({ length: 8 }).map((_, i) => <line key={i} x1="50" y1="12" x2="50" y2="2" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" transform={`rotate(${i * 45 + f} 50 50)`} />)}</svg>
            <div><div style={{ ...S, fontSize: 24, color: theme.colors.textDim }}>SUPERFÍCIE DO SOL</div><div style={{ ...S, fontSize: 50, color: theme.colors.primary }}>~5.500°C</div></div>
          </div>
        </div>
      )}
      {!phase3 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1230, display: "flex", justifyContent: "space-between", opacity: hudIn, transform: `translateY(${(1 - hudIn) * 50}px)` }}>
          <div style={{ width: 460, padding: "18px 24px", borderRadius: 26, background: "rgba(0,0,0,.55)", border: "2px solid rgba(34,211,238,.6)" }}>
            <div style={{ ...S, fontSize: 24, color: theme.colors.textDim }}>VELOCIDADE</div>
            <div style={{ ...S, fontSize: 60, color: "#22D3EE", fontVariantNumeric: "tabular-nums" }}>{kmh.toLocaleString("pt-BR")}<span style={{ fontSize: 28 }}> km/h</span></div>
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,.15)", marginTop: 8 }}><div style={{ width: `${speed * 100}%`, height: "100%", borderRadius: 5, background: "#22D3EE" }} /></div>
          </div>
          <div style={{ width: 380, padding: "18px 24px", borderRadius: 26, background: "rgba(0,0,0,.55)", border: `2px solid ${theme.colors.primary}` }}>
            <div style={{ ...S, fontSize: 24, color: theme.colors.textDim }}>TEMPO DE QUEDA</div>
            <div style={{ ...S, fontSize: 60, color: theme.colors.primary, fontVariantNumeric: "tabular-nums" }}>{Math.floor(mins)}<span style={{ fontSize: 28 }}> min</span></div>
          </div>
        </div>
      )}
      {brake > 0.05 && <AbsoluteFill style={{ top: 1405, alignItems: "center" }}><div style={{ opacity: brake }}><Pill bg="#F87171" size={34}>A GRAVIDADE AGORA TE FREIA</Pill></div></AbsoluteFill>}
      {t > s5 + 1 && t < s6 && <AbsoluteFill style={{ top: 1405, alignItems: "center" }}><Rise at={W(5, "trinta") - 4} start={start} cfg={theme.spring.bouncy}><Pill bg={theme.colors.primary} size={40} glow>~38 MINUTOS DE QUEDA</Pill></Rise></AbsoluteFill>}
      {t > s6 && <AbsoluteFill style={{ top: 1405, alignItems: "center" }}><div style={{ opacity: forever, transform: `scale(${0.6 + 0.4 * forever})` }}><Pill bg="#fff" size={44}>INDO E VOLTANDO PRA SEMPRE ∞</Pill></div></AbsoluteFill>}
    </AbsoluteFill>
  );
};

/* 7 — CTA */
export const CTA: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const c = F(segT(7)) - 4;
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
