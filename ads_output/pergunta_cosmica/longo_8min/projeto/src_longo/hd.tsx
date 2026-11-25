import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useVideoConfig } from "remotion";

export type V3 = [number, number, number];
export const POST = { on: false, res: 0.75 };

/* deterministic rng */
export const rng = (seed: number) => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

const Cam: React.FC<{ pos: V3; tgt: V3; fov: number; roll?: number }> = ({ pos, tgt, fov, roll = 0 }) => {
  const { camera } = useThree(); const c = camera as THREE.PerspectiveCamera;
  c.fov = fov; c.near = 0.05; c.far = 500; c.position.set(...pos); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(...tgt); c.updateProjectionMatrix();
  return null;
};

/* full-resolution canvas with cinematic post-processing (bloom + vignette + subtle CA/grain) */
export const Stage: React.FC<{ pos: V3; tgt: V3; fov?: number; roll?: number; bloom?: number; children: React.ReactNode; bg?: string; ca?: number }> = ({ pos, tgt, fov = 45, roll = 0, bloom = 1.1, children, bg = "#010208", ca = 0.0006 }) => {
  const { width, height } = useVideoConfig();
  const caOff = useMemo(() => new THREE.Vector2(ca, ca), [ca]);
  const W = Math.round(width * POST.res), Hh = Math.round(height * POST.res);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: Hh, transform: `scale(${1 / POST.res})`, transformOrigin: "0 0" }}>
    <ThreeCanvas width={W} height={Hh} gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, powerPreference: "high-performance" }}>
      <color attach="background" args={[bg]} />
      <Cam pos={pos} tgt={tgt} fov={fov} roll={roll} />
      <React.Suspense fallback={null}>{children}</React.Suspense>
      {POST.on && <EffectComposer multisampling={0} disableNormalPass>
        <Bloom intensity={bloom} luminanceThreshold={0.18} luminanceSmoothing={0.35} mipmapBlur radius={0.75} />
        <ChromaticAberration offset={caOff} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
        <Noise opacity={0.035} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Vignette eskil={false} offset={0.22} darkness={0.75} />
      </EffectComposer>}
    </ThreeCanvas>
    </div>
  );
};

/* soft round sprite texture */
export const dotTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,0.95)"); gr.addColorStop(0.4, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
export const cloudTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; const r = rng(99);
  for (let i = 0; i < 60; i++) { const x = 128 + (r() - 0.5) * 120, y = 128 + (r() - 0.5) * 120, rad = 30 + r() * 70;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

/* point cloud with per-point color + size; positions supplied as Float32Array (mutated per frame by caller) */
export const Points: React.FC<{ pos: Float32Array; col: Float32Array; size?: number; opacity?: number; additive?: boolean }> = ({ pos, col, size = 0.08, opacity = 1, additive = true }) => {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); return g; }, [pos.length]);
  useLayoutEffect(() => { (geo.attributes.position as THREE.BufferAttribute).array = pos; geo.attributes.position.needsUpdate = true; (geo.attributes.color as THREE.BufferAttribute).array = col; geo.attributes.color.needsUpdate = true; geo.computeBoundingSphere(); });
  return <points geometry={geo} frustumCulled={false}><pointsMaterial map={dotTex ?? undefined} size={size} vertexColors transparent opacity={opacity} depthWrite={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} sizeAttenuation toneMapped={false} /></points>;
};

/* dense starfield (static, built once) */
export const StarField: React.FC<{ n?: number; r?: number; size?: number; seed?: number; opacity?: number }> = ({ n = 9000, r = 120, size = 0.55, seed = 7, opacity = 1 }) => {
  const { pos, col } = useMemo(() => { const R = rng(seed); const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    const pal = [[1, 1, 1], [0.75, 0.85, 1], [1, 0.9, 0.7], [1, 0.75, 0.6], [0.8, 0.7, 1]];
    for (let i = 0; i < n; i++) { const u = R() * 2 - 1, th = R() * Math.PI * 2, rr = r * (0.5 + R() * 0.5), q = Math.sqrt(1 - u * u); p.set([rr * q * Math.cos(th), rr * u, rr * q * Math.sin(th)], i * 3);
      const k = pal[Math.floor(R() * pal.length)]; const b = 0.35 + Math.pow(R(), 3) * 1.6; c.set([k[0] * b, k[1] * b, k[2] * b], i * 3); }
    return { pos: p, col: c }; }, [n, r, seed]);
  return <Points pos={pos} col={col} size={size} opacity={opacity} />;
};

/* nebula: big soft colored billboards */
export const Nebula: React.FC<{ seed?: number; colors?: string[]; n?: number; spread?: number; z?: number; opacity?: number; size?: number }> = ({ seed = 3, colors = ["#7c3aed", "#2563eb", "#db2777", "#0891b2"], n = 12, spread = 40, z = -60, opacity = 0.55, size = 38 }) => {
  const items = useMemo(() => { const R = rng(seed); return Array.from({ length: n }).map((_, i) => ({ p: [(R() - 0.5) * spread * 1.8, (R() - 0.5) * spread, z + (R() - 0.5) * 30] as V3, s: size * (0.5 + R()), c: colors[i % colors.length], rot: R() * 6 })); }, [seed, n]);
  return <>{items.map((it, i) => <sprite key={i} position={it.p} scale={[it.s, it.s, 1]}><spriteMaterial map={cloudTex ?? undefined} color={it.c} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} rotation={it.rot} toneMapped={false} /></sprite>)}</>;
};

/* additive glow sprite */
export const Glow: React.FC<{ pos?: V3; size: number; color?: string; opacity?: number }> = ({ pos = [0, 0, 0], size, color = "#ffffff", opacity = 1 }) =>
  dotTex && opacity > 0.003 && size > 0.001 ? <sprite position={pos} scale={[size, size, 1]}><spriteMaterial map={dotTex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></sprite> : null;

/* animated star surface: fresnel-rimmed emissive sphere with procedural turbulence */
const starVS = `varying vec3 vN; varying vec3 vP; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const starFS = `uniform float uT; uniform vec3 uA; uniform vec3 uB; uniform float uHeat; varying vec3 vN; varying vec3 vP; varying vec3 vV;
float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=0.5; } return s; }
void main(){ vec3 p=normalize(vP)*3.; float n=fbm(p+vec3(uT*0.15, -uT*0.1, uT*0.07)); float g=fbm(p*2.5-vec3(uT*0.3));
 vec3 col=mix(uA,uB,smoothstep(0.35,0.75,n))*(0.75+0.6*g); float fr=pow(1.-max(dot(vN,vV),0.),2.2); col+=uB*fr*1.8; gl_FragColor=vec4(col*uHeat,1.); }`;
export const StarBody: React.FC<{ r: number; t: number; a?: string; b?: string; heat?: number; pos?: V3 }> = ({ r, t, a = "#ff5a00", b = "#ffe08a", heat = 1.6, pos = [0, 0, 0] }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: starVS, fragmentShader: starFS, uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) }, uHeat: { value: heat } }, toneMapped: false }), [a, b]);
  mat.uniforms.uT.value = t; mat.uniforms.uHeat.value = heat;
  return <group position={pos}><mesh material={mat}><sphereGeometry args={[r, 96, 96]} /></mesh><Glow size={r * 5} color={b} opacity={0.55} /><Glow size={r * 11} color={a} opacity={0.25} /></group>;
};

/* expanding shock ring */
export const Shock: React.FC<{ p: number; r: number; color?: string; tilt?: number; pos?: V3 }> = ({ p, r, color = "#fde68a", tilt = 1.25, pos = [0, 0, 0] }) => p <= 0 || p >= 1 ? null : (
  <mesh position={pos} rotation={[tilt, 0, 0]} scale={0.05 + p * r}><torusGeometry args={[1, 0.02 + 0.03 * (1 - p), 16, 160]} /><meshBasicMaterial color={color} transparent opacity={(1 - p) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
);

/* glassy holographic human built from capsules (fresnel rim) */
const holoFS = `uniform vec3 uC; uniform float uO; varying vec3 vN; varying vec3 vV; void main(){ float fr=pow(1.-abs(dot(vN,vV)),2.); gl_FragColor=vec4(uC*(0.12+fr*1.6), (0.08+fr*0.9)*uO); }`;
const holoVS = `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
export const BODY: { p: V3; r: number; len: number; rot?: V3 }[] = [
  { p: [0, 1.62, 0], r: 0.2, len: 0.08 },            // head
  { p: [0, 1.32, 0], r: 0.07, len: 0.1 },            // neck
  { p: [0, 0.95, 0], r: 0.26, len: 0.45 },           // torso
  { p: [0, 0.48, 0], r: 0.22, len: 0.12 },           // hips
  { p: [-0.42, 1.0, 0], r: 0.075, len: 0.5, rot: [0, 0, 0.12] }, { p: [0.42, 1.0, 0], r: 0.075, len: 0.5, rot: [0, 0, -0.12] },
  { p: [-0.5, 0.48, 0], r: 0.065, len: 0.45, rot: [0, 0, 0.05] }, { p: [0.5, 0.48, 0], r: 0.065, len: 0.45, rot: [0, 0, -0.05] },
  { p: [-0.14, -0.05, 0], r: 0.1, len: 0.6 }, { p: [0.14, -0.05, 0], r: 0.1, len: 0.6 },
  { p: [-0.15, -0.78, 0], r: 0.085, len: 0.6 }, { p: [0.15, -0.78, 0], r: 0.085, len: 0.6 },
];
export const HoloBody: React.FC<{ color?: string; opacity?: number; pos?: V3; scale?: number; spin?: number }> = ({ color = "#7dd3fc", opacity = 1, pos = [0, 0, 0], scale = 1, spin = 0 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: holoVS, fragmentShader: holoFS, uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }), [color]);
  mat.uniforms.uO.value = opacity;
  return <group position={pos} scale={scale} rotation={[0, spin, 0]}>{BODY.map((b, i) => <mesh key={i} position={b.p} rotation={b.rot ?? [0, 0, 0]} material={mat}><capsuleGeometry args={[b.r, b.len, 8, 24]} /></mesh>)}</group>;
};
/* sample n points on the body capsules (for particle morphs) */
export const sampleBody = (n: number, seed = 5) => { const R = rng(seed); const out = new Float32Array(n * 3);
  const w = BODY.map((b) => b.r * (b.len + b.r * 2)); const tot = w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) { let k = R() * tot, j = 0; while (k > w[j]) { k -= w[j]; j++; } const b = BODY[j];
    const th = R() * Math.PI * 2, y = (R() - 0.5) * (b.len + b.r * 1.6); const rr = b.r * (0.85 + R() * 0.2);
    const v = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr).applyEuler(new THREE.Euler(...(b.rot ?? [0, 0, 0])));
    out.set([b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z], i * 3); }
  return out; };
