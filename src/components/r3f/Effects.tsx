"use client";

import { Suspense, useRef, forwardRef } from "react";
import { sunposition } from "./Render";
import {
  EffectComposer,
  GodRays,
  BrightnessContrast,
  Bloom,
  ToneMapping,
  TiltShift2,
  WaterEffect,
  FXAA,
  DepthOfField,
  SSAO,
  Noise,
} from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { Mesh } from 'three'
import * as THREE from 'three'
import { useAppStore } from "@/stores/store";

const Sun = forwardRef<Mesh, any>((props, ref) => {
  const meshRef = useRef<Mesh>(null!);
  const implosionProgress = useAppStore((state) => state.implosionProgress);
  
  // Colori: blu iniziale -> rosso finale
  const colorlight ="#895858"
const colorlight2 ="#a00000"
  const blueColor = new THREE.Color("#a4c9ff");
  const redColor = new THREE.Color("#a00000");
  const emissiveBlue = new THREE.Color("#a4c9ff");
  const emissiveRed = new THREE.Color("#a00000");
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Lerp tra blu e rosso in base a implosionProgress
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const currentColor = blueColor.clone().lerp(redColor, implosionProgress);
    const currentEmissive = emissiveBlue.clone().lerp(emissiveRed, implosionProgress);
    
    material.color.copy(currentColor);
    material.emissive.copy(currentEmissive);
  });
  
  return (
    <mesh ref={(node) => {
      meshRef.current = node!;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }} position={sunposition} {...props}>
      <circleGeometry args={[2, 64]} />
      <meshStandardMaterial emissive={"#a4c9ff"}  color={"#ffbb00"} />
    </mesh>
  );
});

Sun.displayName = "Sun";

export function Effects() { 
  const material = useRef<Mesh>(null!);   
  return (           
             
        <Suspense>
            <Sun ref={material} />  
            <EffectComposer multisampling={0}  >
            <GodRays sun={material} weight={1} density={20} exposure={0.0008} decay={4} blur={true} />   
            <Bloom mipmapBlur luminanceThreshold={0.1} intensity={0.52} />  
            <Noise opacity={0.04} />
            <BrightnessContrast brightness={-0.05} contrast={0.04} />          
            </EffectComposer>        
        </Suspense>
    
  );
}