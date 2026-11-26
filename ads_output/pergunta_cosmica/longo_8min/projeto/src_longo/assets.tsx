import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { staticFile, delayRender, continueRender } from "remotion";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/* Load every asset BEFORE the 3D canvas mounts (no Suspense races) and keep it in a module cache. */
const CACHE = new Map<string, any>();
const PENDING = new Map<string, Promise<any>>();
const load = (f: string): Promise<any> => {
  if (CACHE.has(f)) return Promise.resolve(CACHE.get(f));
  if (PENDING.has(f)) return PENDING.get(f)!;
  const url = staticFile(`longo/${f}`);
  const L: any = f.endsWith(".glb") ? new GLTFLoader() : f.endsWith(".hdr") ? new RGBELoader() : new THREE.TextureLoader();
  const p = L.loadAsync(url).then((r: any) => { CACHE.set(f, r); return r; });
  PENDING.set(f, p); return p;
};
export const asset = <T = any,>(f: string): T => { const v = CACHE.get(f); if (!v) throw new Error(`asset not preloaded: ${f}`); return v; };
export const AssetGate: React.FC<{ files: string[]; children: React.ReactNode }> = ({ files, children }) => {
  const [ready, setReady] = useState(() => files.every((f) => CACHE.has(f)));
  const [h] = useState(() => (ready ? null : delayRender(`assets ${files.join(",")}`, { timeoutInMilliseconds: 180000 })));
  useEffect(() => { if (ready) return; Promise.all(files.map(load)).then(() => setReady(true)); }, []);
  useEffect(() => { if (ready && h !== null) continueRender(h); }, [ready]);
  return ready ? <>{children}</> : null;
};

export const COMMON_ASSETS = ["Michelle.glb", "Xbot.glb", "hardwood2_diffuse.jpg", "venice_sunset_1k.hdr", "moonless_golf_1k.hdr", "royal_esplanade_1k.hdr", "SheenChair.glb"];
