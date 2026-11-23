import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";

export type V3 = [number, number, number];
export const ll = (lat: number, lon: number, r = 1): V3 => {
  const phi = ((lon + 180) / 360) * Math.PI * 2, th = ((90 - lat) * Math.PI) / 180;
  return [-Math.cos(phi) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(phi) * Math.sin(th) * r];
};
// rotation that brings (lat, lon) to face +z
export const faceRot = (lat: number, lon: number) => ({ x: (lat * Math.PI) / 180, y: Math.PI / 2 - ((lon + 180) / 360) * Math.PI * 2 });

export const RealEarth: React.FC<{ r?: number; opacity?: number; brazil?: number; clouds?: boolean }> = ({ r = 1, opacity = 1, brazil = 0, clouds = true }) => {
  const [tex, bra, cl] = useLoader(THREE.TextureLoader, [staticFile("buraco/tex/earth_real.jpg"), staticFile("buraco/tex/brazil_mask.png"), staticFile("buraco/tex/clouds.png")]);
  return (
    <group>
      <mesh><sphereGeometry args={[r, 96, 96]} /><meshStandardMaterial map={tex} roughness={0.85} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} /></mesh>
      {brazil > 0.01 && <mesh scale={1.002}><sphereGeometry args={[r, 96, 96]} /><meshBasicMaterial map={bra} color="#FBBF24" transparent opacity={brazil * 0.85} depthWrite={false} /></mesh>}
      {clouds && <mesh scale={1.015}><sphereGeometry args={[r, 64, 64]} /><meshStandardMaterial map={cl} transparent opacity={0.35 * opacity} depthWrite={false} /></mesh>}
      <mesh scale={1.08}><sphereGeometry args={[r, 48, 48]} /><meshBasicMaterial color="#5aa9ff" transparent opacity={0.14} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
};

// Earth with a quarter wedge removed (x>0, z>0) showing layers
const LAYERS: [number, string, string][] = [[1.0, "#6b4f2a", "#8b6b3d"], [0.985, "#c2410c", "#ea580c"], [0.55, "#f59e0b", "#fbbf24"], [0.19, "#fff7d6", "#fffbeb"]];
export const EarthCut: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const [tex] = useLoader(THREE.TextureLoader, [staticFile("buraco/tex/earth_real.jpg")]);
  return (
    <group>
      <mesh><sphereGeometry args={[1, 96, 96, Math.PI, Math.PI * 1.5]} /><meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} /></mesh>
      {LAYERS.map(([rOut, c, c2], i) => {
        const rIn = LAYERS[i + 1] ? LAYERS[i + 1][0] : 0;
        const em = i >= 1 ? 0.35 + 0.4 * i * glow : 0;
        return (
          <group key={i}>
            <mesh><ringGeometry args={[rIn, rOut, 96, 1, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color={c} emissive={c2} emissiveIntensity={em} side={THREE.DoubleSide} roughness={0.7} /></mesh>
            <mesh rotation={[0, -Math.PI / 2, 0]}><ringGeometry args={[rIn, rOut, 96, 1, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color={c} emissive={c2} emissiveIntensity={em} side={THREE.DoubleSide} roughness={0.7} /></mesh>
          </group>
        );
      })}
    </group>
  );
};
