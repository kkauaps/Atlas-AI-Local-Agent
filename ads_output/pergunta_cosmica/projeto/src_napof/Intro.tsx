import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, useLoader } from "@react-three/fiber";
import { theme } from "./theme";
import { INTRO_WORDS, INTRO_END } from "./intro_timing";
import { H, Pill } from "./ui";
import { cl } from "./cl";

type V3 = [number, number, number];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const iw = (w: string, n = 0) => { const l = INTRO_WORDS.filter((x) => norm(x.w) === norm(w)); return (l[n] ?? l[0]).s + theme.introOffset; };
const eio = Easing.bezier(0.65, 0, 0.35, 1);

const glowTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(0.25, "rgba(255,190,80,0.7)"); gr.addColorStop(0.6, "rgba(255,130,30,0.18)"); gr.addColorStop(1, "rgba(255,120,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
})();
const CamSet: React.FC<{ pos: V3; tgt: V3; fov: number }> = ({ pos, tgt, fov }) => {
  const { camera } = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = fov; c.near = 0.05; c.far = 400; c.position.set(...pos); c.lookAt(...tgt); c.updateProjectionMatrix(); return null;
};
const Stars: React.FC = () => {
  const geo = React.useMemo(() => { const n = 3000, p = new Float32Array(n * 3); let s = 9; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, th = r() * 6.283, q = Math.sqrt(1 - u * u), R = 120 + r() * 60; p.set([R * q * Math.cos(th), R * u, R * q * Math.sin(th)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g; }, []);
  return <points geometry={geo}><pointsMaterial size={0.35} color="#fff" sizeAttenuation transparent opacity={0.9} /></points>;
};
const PLANETS: [string, number, number, string, number][] = [ // name, orbit, radius, color, speed
  ["mercury", 4, 0.22, "#a8a29e", 1.6], ["venus", 5.6, 0.38, "#e7c38a", 1.2], ["earth", 7.4, 0.42, "earth", 1.0], ["mars", 9.2, 0.3, "#c2552d", 0.8], ["jupiter", 13, 1.2, "#d6a97a", 0.45], ["saturn", 17, 1.0, "#e3cf9c", 0.35],
];
const earthAng = (t: number) => 0.9 + t * 0.05;
const System: React.FC<{ t: number }> = ({ t }) => {
  const [sunT, earthT, cloudT] = useLoader(THREE.TextureLoader, [staticFile("napof/tex/sun.jpg"), staticFile("napof/tex/earth.jpg"), staticFile("napof/tex/clouds.png")]);
  return (
    <>
      <Stars />
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 0, 0]} intensity={260} decay={1.6} color="#fff1d6" />
      <mesh rotation={[0, t * 0.1, 0]}><sphereGeometry args={[2.2, 64, 64]} /><meshBasicMaterial map={sunT} /></mesh>
      {glowTex && <sprite scale={[9, 9, 1]}><spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>}
      {glowTex && <sprite scale={[16, 16, 1]}><spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.4} /></sprite>}
      {PLANETS.map(([n, R, r, c, sp]) => {
        const a = n === "earth" ? earthAng(t) : 0.4 + t * 0.05 * sp + R;
        const p: V3 = [Math.cos(a) * R, 0, Math.sin(a) * R];
        return (
          <group key={n}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[R - 0.02, R + 0.02, 160]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} /></mesh>
            <group position={p}>
              {n === "earth" ? (<>
                <mesh rotation={[0.41, t * 0.3, 0]}><sphereGeometry args={[r, 48, 48]} /><meshStandardMaterial map={earthT} roughness={0.9} /></mesh>
                <mesh rotation={[0.41, t * 0.35, 0]} scale={1.02}><sphereGeometry args={[r, 48, 48]} /><meshStandardMaterial map={cloudT} transparent opacity={0.6} depthWrite={false} /></mesh>
                <mesh scale={1.12}><sphereGeometry args={[r, 32, 32]} /><meshBasicMaterial color="#5aa9ff" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
              </>) : (
                <mesh><sphereGeometry args={[r, 40, 40]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
              )}
              {n === "saturn" && <mesh rotation={[-1.2, 0, 0.2]}><ringGeometry args={[1.4, 2.2, 64]} /><meshStandardMaterial color="#d9c38f" transparent opacity={0.75} side={THREE.DoubleSide} /></mesh>}
            </group>
          </group>
        );
      })}
    </>
  );
};

export const Intro: React.FC<{ start: number }> = () => {
  const f = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const t = f / fps;
  const end = theme.introOffset + INTRO_END;
  const k = interpolate(t, [0, end + 0.2], [0, 1], { ...cl, easing: eio });
  const ea = earthAng(t); const E: V3 = [Math.cos(ea) * 7.4, 0, Math.sin(ea) * 7.4];
  const far: V3 = [6, 26, 30], farT: V3 = [0, 0, 0];
  const Ed = Math.hypot(E[0], E[2]); const near: V3 = [E[0] - (E[2] / Ed) * 1.45 - (E[0] / Ed) * 0.5, 0.35, E[2] + (E[0] / Ed) * 1.45 - (E[2] / Ed) * 0.5];
  const pos = far.map((v, i) => v + (near[i] - v) * Math.pow(k, 2.2)) as V3;
  const tgt = farT.map((v, i) => v + (E[i] - v) * Math.min(1, k * 1.3)) as V3;
  const tiny = iw("minusculo"), est = iw("estrelas"), homem = iw("homem"), mi2 = iw("minusculo", 1);
  const show = (a: number, b: number) => interpolate(t, [a - 0.15, a + 0.2, b - 0.2, b], [0, 1, 1, 0], cl);
  const s1 = show(0.35, est - 0.6), s2 = show(est - 0.55, homem - 0.3), s3 = show(homem - 0.3, end + 0.4);
  const pop = interpolate(t, [mi2 - 0.05, mi2 + 0.35], [0, 1], { ...cl, easing: Easing.out(Easing.back(3)) });
  const youDot = interpolate(t, [tiny - 0.3, tiny], [0, 1], cl) * (1 - s3);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: width / 2, height: height / 2, transform: "scale(2)", transformOrigin: "0 0" }}>
        <ThreeCanvas width={width / 2} height={height / 2} gl={{ antialias: true }}>
          <color attach="background" args={["#02030a"]} />
          <React.Suspense fallback={null}><CamSet pos={pos} tgt={tgt} fov={48} /><System t={t} /></React.Suspense>
        </ThreeCanvas>
      </div>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, display: "flex", flexDirection: "column", gap: 8, opacity: s1, transform: `translateY(${(1 - s1) * 20}px)` }}>
        <div style={{ ...H, fontSize: 84 }}>NO UNIVERSO,</div>
        <div style={{ ...H, fontSize: 84, color: "#7DD3FC" }}>SOMOS MINÚSCULOS</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", top: 1130, opacity: youDot }}>
        <Pill bg="#fff" size={30}>VOCÊ ESTÁ AQUI ↓ (MAIS OU MENOS)</Pill>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, display: "flex", flexDirection: "column", gap: 8, opacity: s2, transform: `translateY(${(1 - s2) * 20}px)` }}>
        <div style={{ ...H, fontSize: 64 }}>MAS ESSE VÍDEO</div>
        <div style={{ ...H, fontSize: 64 }}>NÃO É SOBRE</div>
        <div style={{ ...H, fontSize: 84, color: theme.colors.primary, textDecoration: "line-through", textDecorationColor: theme.colors.accent }}>ESTRELAS</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, display: "flex", flexDirection: "column", gap: 8, opacity: s3 }}>
        <div style={{ ...H, fontSize: 58 }}>É SOBRE UM HOMEM QUE</div>
        <div style={{ ...H, fontSize: 58 }}>O MUNDO CHAMAVA DE</div>
        <div style={{ ...H, fontSize: 22 + 70 * pop, color: theme.colors.primary, textShadow: `0 0 40px ${theme.colors.glow}` }}>minúsculo</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
