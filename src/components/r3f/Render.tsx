"use client";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { type ThreeElement } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from "react";
import { Sphere, MeshDistortMaterial, Environment, Lightformer, useTexture, MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import { Effects } from "./Effects";
import { WindParticles } from "./WindParticles";
import { useAppStore } from "@/stores/store";
import * as THREE from "three";
import { Model } from "./Telescope";


export const lightcolor = "#9aceff";
export const sunposition: [number, number, number] = [0, 55, -100];

function CameraController() {
    const { camera } = useThree();
    const exploreProgress = useAppStore((state) => state.exploreProgress);

    useFrame((_, delta) => {
        // Smooth camera transition based on explore button progress
        const targetZ = THREE.MathUtils.lerp(10, 5, exploreProgress);
        camera.position.z = THREE.MathUtils.lerp(
            camera.position.z,
            targetZ,
            delta * 2
        );

        // Keep camera looking at origin
        camera.lookAt(0, 0, 0);
    });

    return null;
}

function Terrain({ position }: { position: [number, number, number] }) {
    const colorMap = useTexture('/textures/rock_05_diff_1k.jpg');
    const displacementMap = useTexture('/textures/rock_05_disp_1k.png');
    return (
        <mesh castShadow receiveShadow position={position} rotation={[-Math.PI / 2, 0, 0]} >
            <planeGeometry args={[20, 20, 256, 256]} />
            <meshStandardMaterial
                color={"#8d8d8d"}

                map={colorMap}
                displacementMap={displacementMap}
                displacementScale={1.9}
            />
        </mesh>
    );
}

function GaiaTerrain({ position }: { position: [number, number, number] }) {
    const colorMap = useTexture('/textures/aerial_rocks_04_diff_1k.jpg');
    const displacementMap = useTexture('/textures/aerial_rocks_04_disp_1k.png');
    return (
        <mesh castShadow receiveShadow position={position} rotation={[-Math.PI / 2, 0, 0]} >
            <planeGeometry args={[20, 20, 256, 256]} />
            <meshStandardMaterial
                

                map={colorMap}
                displacementMap={displacementMap}
                displacementScale={1.9}
            />
        </mesh>
    );
}

function TerrainGrid({ gridX = 2, gridZ = 2 }: { gridX?: number; gridZ?: number }) {
    const terrains = [];

    for (let x = -gridX; x <= gridX; x++) {
        for (let z = -gridZ; z <= gridZ; z++) {
            terrains.push(
                <Suspense key={`terrain-${x}-${z}`} fallback={null}>
                    <Terrain position={[x * 20, 0, z * 20]} />
                </Suspense>
            );
        }
    }

    return <>{terrains}</>;
}

function GaiaTerrainGrid({ gridX = 2, gridZ = 2 }: { gridX?: number; gridZ?: number }) {
    const terrains = [];

    for (let x = -gridX; x <= gridX; x++) {
        for (let z = -gridZ; z <= gridZ; z++) {
            terrains.push(
                <Suspense key={`terrain-${x}-${z}`} fallback={null}>
                    <GaiaTerrain position={[x * 20, 0, z * 20]} />
                </Suspense>
            );
        }
    }

    return <>{terrains}</>;
}

function Anomaly() {
    const exploreProgress = useAppStore((state) => state.exploreProgress);
    const implosionProgress = useAppStore((state) => state.implosionProgress);
    const currentStep = useAppStore((state) => state.currentStep);
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Calculate distortion based on explore progress
    const distort = THREE.MathUtils.lerp(0.4, 0.8, exploreProgress);
    
    useFrame(() => {
        if (meshRef.current) {
            // During implosion phase (step 0.5), scale down from 1.0 to 0.1
            if (currentStep === 0.5) {
                const targetScale = THREE.MathUtils.lerp(1.0, 0.1, implosionProgress);
                meshRef.current.scale.setScalar(targetScale);
            }
            // Otherwise maintain scale at 1.0
            else if (currentStep === 0) {
                meshRef.current.scale.setScalar(1.0);
            }
            // After implosion, keep at 0.1
            else if (currentStep >= 1) {
                meshRef.current.scale.setScalar(0.1);
            }
        }
    });
    
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1.5, 64, 64]} />
            <MeshDistortMaterial
                roughness={0.}
                color={"#000000"}
                distort={distort}
                speed={2}
            />
        </mesh>
    )
}


function Water() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
            <planeGeometry args={[80, 80, 256, 256]} />
            <MeshReflectorMaterial
                roughness={0.}
                color={"#000"}
            />
        </mesh>
    );
}

function Rock({ position, scale, dscale }: { position: [number, number, number], scale: [number, number, number], dscale: number }) {
    const colorMap = useTexture('/textures/rock_05_diff_1k.jpg');
    const displacementMap = useTexture('/textures/rock_05_disp_1k.png');
    return (
        <mesh castShadow receiveShadow position={position} scale={scale} rotation={[0, 0, 0]} >
            <icosahedronGeometry args={[20, 20,]} />
            <meshStandardMaterial
                roughness={1.}
                metalness={0.6}
                color={"#686868"}
                map={colorMap}
                displacementMap={displacementMap}
                displacementScale={dscale}
            />
        </mesh>
    );
}

function GaiaRock({ position, scale, dscale }: { position: [number, number, number], scale: [number, number, number], dscale: number }) {
    const colorMap = useTexture('/textures/aerial_rocks_04_diff_1k.jpg');
    const displacementMap = useTexture('/textures/aerial_rocks_04_disp_1k.png');
    return (
        <mesh castShadow receiveShadow position={position} scale={scale} rotation={[0, 0, 0]} >
            <icosahedronGeometry args={[20, 20,]} />
            <meshStandardMaterial
                roughness={1.}
                metalness={0.6}
                color={"#686868"}
                map={colorMap}
                displacementMap={displacementMap}
                displacementScale={dscale}
            />
        </mesh>
    );
}

export function Render() {
    const [canvasKey, setCanvasKey] = useState(0);
  

    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            setCanvasKey((k) => k + 1);
        }
    }, []);
    return (
        <div className="w-full h-[100svh]">
            <Canvas
                key={canvasKey}
                camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 1000 }}
                gl={{ antialias: true }}
                shadows
            >
                <Suspense fallback={null}>
                    <CameraController />
                    <Scene1 />
                    

                    <color attach="background" args={['#000000']} />
                    <Effects />
                </Suspense>
            </Canvas>
        </div>
    );
}

function Scene1() {
  return (
    <>
    <directionalLight color={lightcolor} intensity={0.4}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-far={100}
                        shadow-camera-left={-100}
                        shadow-camera-right={100}
                        shadow-camera-top={100}
                        shadow-camera-bottom={-100}
                        position={sunposition}
                    />
                    <Environment files={"/textures/rogland_clear_night_1k.exr"} environmentIntensity={0.2} />
                    <group position={[0, -5, 0]} >
                        <TerrainGrid gridX={3} gridZ={2} />
                        {/* <TerrainMap /> */}
                        <Rock position={[18, 0, -20]} dscale={10} scale={[0.2, 0.8, 0.2]} />
                        <Rock position={[12, -6, -60]} dscale={20} scale={[3, 0.3, 0.5]} />
                        <Rock position={[-80, -20, -100]} dscale={20} scale={[2.8, 1.8, 0.8]} />
                        <Water />
                    </group>
                    <WindParticles
                        count={2000}
                        area={[100, 30, 100]}
                        speed={10}
                        direction={[-1, 0, 0]}
                        noise={2.0}
                        noiseSpeed={0.5}
                        size={0.1}
                        color={"#9aceff"}
                        opacity={0.4}
                        position={[0, 5, -30]}
                    />
                    <Anomaly />
     
    </>
  );
}

function Scene2() {
  return (
    <>
    <directionalLight color={lightcolor} intensity={0.4}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-far={100}
                        shadow-camera-left={-100}
                        shadow-camera-right={100}
                        shadow-camera-top={100}
                        shadow-camera-bottom={-100}
                        position={sunposition}
                    />
                    <OrbitControls enableZoom={true} enablePan={true} />
                    <Environment background files={"/textures/qwantani_night_2k.hdr"} backgroundIntensity={0.2} backgroundRotation={[0,-1.5,0]} environmentIntensity={0.3} />
                    <group position={[0, -5, 0]} >
                        <GaiaTerrainGrid gridX={3} gridZ={2} />
                    
                       
                       
                        <GaiaRock position={[42, -6, -60]} dscale={20} scale={[3, 0.8, 0.5]} />
                      
                        {/* <Water /> */}
                    </group>
                     <Model rotation={[0,Math.PI,0]} position={[0, 5, -70]} scale={20000} />
         
                  
     
    </>
  );
}