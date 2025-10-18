"use client";

import { Suspense, useRef,  forwardRef, } from "react";
import { lightcolor, sunposition } from "./Render";
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

