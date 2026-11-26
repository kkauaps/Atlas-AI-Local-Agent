import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage } from "./hd";
import { Env, Human, Car, Chair } from "./real";
import { AssetGate } from "./assets";
const SETS: Record<number, { cam: [number, number, number]; tgt: [number, number, number]; env: string }> = {
  0: { cam: [0, 1.5, 4.2], tgt: [0, 1.0, 0], env: "venice_sunset_1k.hdr" },
  1: { cam: [5, 1.4, 6], tgt: [0, 0.6, 0], env: "pedestrian_overpass_1k.hdr" },
  2: { cam: [1.6, 1.2, 2.6], tgt: [0, 0.5, 0], env: "royal_esplanade_1k.hdr" },
  4: { cam: [0, 1.5, 4.2], tgt: [0, 1.0, 0], env: "venice_sunset_1k.hdr" },
  5: { cam: [0, 1.5, 4.2], tgt: [0, 1.0, 0], env: "royal_esplanade_1k.hdr" },
  6: { cam: [5, 1.4, 6], tgt: [0, 0.6, 0], env: "royal_esplanade_1k.hdr" },
  7: { cam: [0, 1.5, 4.2], tgt: [0, 1.0, 0], env: "" },
  8: { cam: [5, 1.4, 6], tgt: [0, 0.6, 0], env: "" },
  3: { cam: [0, 1.6, 3.2], tgt: [0, 1.4, 0], env: "moonless_golf_1k.hdr" },
};
export const RealTest: React.FC<{ r: number }> = ({ r }) => { const S = SETS[r];
  return <AbsoluteFill><AssetGate files={["Michelle.glb", "Xbot.glb", "ferrari.glb", "SheenChair.glb", ...(S.env ? [S.env] : [])]}><Stage pos={S.cam} tgt={S.tgt} fov={40}>
    {S.env && <Env file={S.env} intensity={r === 3 ? 2 : 1} />}<hemisphereLight args={["#fff", "#444", 1.5]} />
    <directionalLight position={[3, 5, 2]} intensity={1.2} />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[30, 64]} /><meshStandardMaterial color="#3a3a3c" roughness={0.85} /></mesh>
    <EB>{(r === 0 || r === 3 || r === 5 || r === 7) && <Human time={r === 7 ? 0.4 : 1.2} anim={r === 7 ? "walk" : "idle"} look={r === 3 ? 0.6 : 0} />}</EB>
    <EB>{(r === 1 || r === 6 || r === 8) && <Car rot={[0, Math.PI / 2, 0]} brake={1} />}</EB>
    {r === 2 && <Chair scale={1.6} />}
  </Stage></AssetGate></AbsoluteFill>; };
export class EB extends React.Component<{ children: React.ReactNode }, { e: any }> { state = { e: null as any }; static getDerivedStateFromError(e: any) { return { e }; } componentDidCatch(e: any) { console.error("EBCAUGHT " + (e?.stack || e)); } render() { return this.state.e ? null : this.props.children; } }
