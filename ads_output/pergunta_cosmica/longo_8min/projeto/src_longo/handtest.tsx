import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage, Glow } from "./hd";
import { WoodTable, Hand, SoftShadow, Person } from "./touch";
const CAMS: [number, number, number][] = [[0, 1.2, 4.5], [0, 1.2, 4.5], [0, 1.2, 4.5],[1.2, 1.0, 3.4], [2.6, 0.7, 2.2], [0.3, 0.45, 1.6], [1.0, 2.6, 2.0]];
export const HandTest: React.FC<{ r: number }> = ({ r }) => (
  <AbsoluteFill><Stage pos={r >= 10 ? [1.5, 1.4, 3.6] : CAMS[r]} tgt={r >= 10 ? [0, 1, 0] : [-0.4, 0.45, 0]} fov={38} bg="#0d0907">
    <fog attach="fog" args={["#0d0907", 4, 11]} />
    <hemisphereLight args={["#ffe9d0", "#2a1a10", 0.7]} /><directionalLight position={[2, 5, 3]} intensity={2.8} color="#ffe6c8" /><directionalLight position={[-3, 2, -4]} intensity={2.2} color="#8fb0ff" />
    {[[-3, 1.6, -6, "#ffb46b"], [2, 2.2, -7, "#ffd59a"], [5, 1, -8, "#ff8f5a"], [-6, 2.8, -9, "#ffe0b0"]].map(([x, y, z, c], i) => <Glow key={i} pos={[x as number, y as number, z as number]} size={2.2} color={c as string} opacity={0.35} />)}
    <WoodTable y={0} size={[16, 14]} /><SoftShadow pos={[-0.35, 0.004, 0]} sx={1.4} sz={0.9} opacity={0.55} />
    {r >= 10 && <Person pos={[0, 0, 0]} time={r - 10} anim={r > 11 ? "walk" : "idle"} />}
    {r < 10 && <Hand tipTo={[0, 0.07, 0]} rot={[0, 0.35, Math.PI / 2 - 0.75]} curl={[0.15, 1.45, 1.55, 1.6]} thumb={0.9} scale={10} />}
  </Stage></AbsoluteFill>
);
