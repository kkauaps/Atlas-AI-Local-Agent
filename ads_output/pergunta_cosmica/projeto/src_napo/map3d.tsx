import React, { useMemo } from "react";
import * as THREE from "three";
import { MAP } from "./mapdata";
import { theme } from "./theme";

export const S3 = 100; // map units per world unit
export type K = "eu" | "at";
export const toWorld = (k: K, p: [number, number], y = 0): [number, number, number] => [(p[0] - 500) / S3, y, (p[1] - (MAP[k] as any).h / 2) / S3];
const parse = (d: string) => d.split("M").slice(1).map((sub) => sub.replace("Z", "").split("L").map((q) => q.split(",").map(Number) as [number, number]));
const DEPTH = 0.035;

const useShapes = (k: K) => useMemo(() => {
  const m = MAP[k] as any; const h = m.h;
  const out: Record<string, THREE.ExtrudeGeometry> = {};
  Object.entries(m.paths as Record<string, string>).forEach(([c, d]) => {
    const shapes = parse(d).filter((r) => r.length > 2).map((ring) => new THREE.Shape(ring.map(([x, y]) => new THREE.Vector2((x - 500) / S3, -(y - h / 2) / S3))));
    out[c] = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: false });
  });
  return out;
}, [k]);
const useBorders = (k: K) => useMemo(() => {
  const m = MAP[k] as any; const h = m.h; const arr: number[] = [];
  Object.values(m.paths as Record<string, string>).forEach((d) => parse(d).forEach((ring) => {
    for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length];
      arr.push((a[0] - 500) / S3, DEPTH + 0.002, (a[1] - h / 2) / S3, (b[0] - 500) / S3, DEPTH + 0.002, (b[1] - h / 2) / S3); }
  }));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3)); return g;
}, [k]);

export const Map3D: React.FC<{ k: K; fills?: Record<string, [string, number]>; snow?: number; snowSet?: string[] }> = ({ k, fills = {}, snow = 0, snowSet = [] }) => {
  const geos = useShapes(k);
  const borders = useBorders(k);
  const h = (MAP[k] as any).h / S3;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0c1532" roughness={0.9} /></mesh>
      <mesh position={[0, -0.03, 0]}><boxGeometry args={[10.4, 0.05, h + 0.4]} /><meshStandardMaterial color="#6b4f2a" roughness={0.6} /></mesh>
      {Object.entries(geos).map(([c, g]) => {
        const fill = fills[c];
        const sn = snowSet.includes(c) ? snow : 0;
        const base = new THREE.Color(theme.colors.land);
        if (fill && fill[1] > 0) base.lerp(new THREE.Color(fill[0]), fill[1]);
        if (sn > 0) base.lerp(new THREE.Color("#F8FAFC"), sn);
        return (
          <mesh key={c} geometry={g} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={base} roughness={0.75} />
          </mesh>
        );
      })}
      <lineSegments geometry={borders}><lineBasicMaterial color="#5c4a2c" transparent opacity={0.85} /></lineSegments>
    </group>
  );
};
export const LAND_Y = DEPTH;
