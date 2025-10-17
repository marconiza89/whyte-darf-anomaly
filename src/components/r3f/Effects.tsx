"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useEffect, useState, use, forwardRef, ComponentProps } from "react";
import { MeshReflectorMaterial,Circle, Lightformer, Float, useVideoTexture, useProgress, Html, OrbitControls, SoftShadows } from "@react-three/drei";
import { lightcolor, sunposition } from "./Render";
import { useAppStore } from "@/stores/store";

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

import { Mesh } from 'three'

const Sun = forwardRef<Mesh, any>((props, ref) => (
  <mesh ref={ref} position={sunposition} {...props}>
    <circleGeometry args={[2, 64]} />
    <meshStandardMaterial emissive={lightcolor} envMapIntensity={1} color={"#ffbb00"} />
  </mesh>
));


export function Effects() {
  const color ="#f1f1f1";
  const color2 ="#020d00";
  const color3 ="#000";
 
  const material = useRef<Mesh>(null!); 
  
  // Get implosion progress from store
  const implosionProgress = useAppStore((state) => state.implosionProgress);
  const currentStep = useAppStore((state) => state.currentStep);
  
  // Calculate brightness based on implosion progress
  // During implosion (step 0.5), darken the scene from 0 to -0.8
  const brightness = currentStep === 0.5 
    ? -0.05 - (implosionProgress * 1)  // Goes from -0.05 to -0.8
    : currentStep >= 1 
    ? -1  // Keep dark after implosion
    : -0.05;  // Normal brightness before implosion
  
  return (           
             
        <Suspense>
          <Sun ref={material} />    
        
          <EffectComposer multisampling={0}  >
            <GodRays sun={material} weight={1} density={20} exposure={0.0008} decay={4} blur={true} />   
            
              
            
            
            {/* <FXAA />   */}
                           
            <Bloom mipmapBlur luminanceThreshold={0.1} intensity={0.52} />  
            <Noise opacity={0.04} />
            <BrightnessContrast brightness={-0.05} contrast={0.04} />
            
            
          </EffectComposer>
        
        </Suspense>
    
  );
}

