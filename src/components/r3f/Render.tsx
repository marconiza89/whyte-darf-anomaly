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


export const lightcolor = "#a4c9ff";
export const sunposition: [number, number, number] = [0, 50, -100];

// Componente per la luce dinamica che cambia colore durante implosion
function DynamicLight() {
    const lightRef = useRef<THREE.DirectionalLight>(null!);
    const implosionProgress = useAppStore((state) => state.implosionProgress);

    
    
    const blueColor = new THREE.Color("#a4c9ff");
    const redColor = new THREE.Color("#895858");
    
    
    useFrame(() => {
        if (!lightRef.current) return;
        
        // Lerp tra blu e rosso in base a implosionProgress
        const currentColor = blueColor.clone().lerp(redColor, implosionProgress);
        lightRef.current.color.copy(currentColor);
    });
    
    return (
        <directionalLight 
            ref={lightRef}
            color={lightcolor} 
            intensity={0.4}
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
    );
}

function CameraController() {
    const { camera } = useThree();
    const exploreProgress = useAppStore((state) => state.exploreProgress);
    const currentStep = useAppStore((state) => state.currentStep);
    
    // Target range per il tuner
    const TARGET_MIN = 74;
    const TARGET_MAX = 75;
    const TARGET_CENTER = 74.5;

    useFrame((_, delta) => {
        // Smooth camera transition based on explore button progress
        const targetZ = THREE.MathUtils.lerp(10, 5, exploreProgress);
        camera.position.z = THREE.MathUtils.lerp(
            camera.position.z,
            targetZ,
            delta * 2
        );

        // Camera shake durante la fase del tuner
        if (currentStep === 1) {
            const { tunerValue } = useAppStore.getState();
            
            // Calcola distanza dal target center
            const distanceFromTarget = Math.abs(tunerValue - TARGET_CENTER);
            
            // Inverti: più vicino = più shake (max shake a distanza 0)
            // Normalizza: distanza 0-50 → intensità 1-0
            const proximity = Math.max(0, 1 - (distanceFromTarget / 50));
            
            // Intensità shake basata sulla vicinanza (0 = no shake, 1 = max shake)
            const shakeIntensity = proximity * 0.055; // Max 0.15 unità di shake
            
            // Genera shake random
            if (shakeIntensity > 0) {
                const shakeX = (Math.random() - 0.5) * shakeIntensity;
                const shakeY = (Math.random() - 0.5) * shakeIntensity;
                const shakeZ = (Math.random() - 0.5) * shakeIntensity * 0.5; // Meno shake su Z
                
                camera.position.x += shakeX;
                camera.position.y += shakeY;
                camera.position.z += shakeZ;
            }
        }

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
    const meshRef = useRef<THREE.Mesh>(null);
    const implosionAudioRef = useRef<THREE.PositionalAudio | null>(null);
    const noiseAudioRef = useRef<THREE.PositionalAudio | null>(null);
    const currentStep = useAppStore((state) => state.currentStep);
    const { camera } = useThree();
    
    // Setup audio listener e positional audio
    useEffect(() => {
        if (!camera || !meshRef.current) return;
        
        // Aggiungi listener alla camera se non presente
        if (!camera.children.find(child => child instanceof THREE.AudioListener)) {
            const listener = new THREE.AudioListener();
            camera.add(listener);
            
            // Crea positional audio per implosion
            const implosionSound = new THREE.PositionalAudio(listener);
            const audioLoader1 = new THREE.AudioLoader();
            audioLoader1.load('/audio/implosion.mp3', (buffer) => {
                implosionSound.setBuffer(buffer);
                implosionSound.setRefDistance(20);
                implosionSound.setVolume(1.0);
                implosionSound.setLoop(false);
            });
            meshRef.current?.add(implosionSound);
            implosionAudioRef.current = implosionSound;
            
            // Crea positional audio per noise
            const noiseSound = new THREE.PositionalAudio(listener);
            const audioLoader2 = new THREE.AudioLoader();
            audioLoader2.load('/audio/noise.mp3', (buffer) => {
                noiseSound.setBuffer(buffer);
                noiseSound.setRefDistance(20);
                noiseSound.setVolume(0.8);
                noiseSound.setLoop(true);
            });
            meshRef.current?.add(noiseSound);
            noiseAudioRef.current = noiseSound;
        }
        
        return () => {
            if (implosionAudioRef.current) {
                implosionAudioRef.current.disconnect();
            }
            if (noiseAudioRef.current) {
                noiseAudioRef.current.disconnect();
            }
        };
    }, [camera]);
    
    // Trigger audio quando inizia l'implosione
    useEffect(() => {
        if (currentStep === 0.5 && implosionAudioRef.current && !implosionAudioRef.current.isPlaying) {
            console.log("Playing implosion positional audio");
            implosionAudioRef.current.play();
        }
    }, [currentStep]);
    
    // Trigger noise dopo implosione
    useEffect(() => {
        if (currentStep >= 1 && noiseAudioRef.current && !noiseAudioRef.current.isPlaying) {
            console.log("Playing noise positional audio");
            noiseAudioRef.current.play();
        }
        
        // Stop noise se si torna indietro
        if (currentStep < 1 && noiseAudioRef.current && noiseAudioRef.current.isPlaying) {
            noiseAudioRef.current.stop();
        }
    }, [currentStep]);
    
    // Aggiorna distorsione e pitch in base a tunerValue
    useFrame(() => {
        if (!meshRef.current) return;
        
        const { tunerValue } = useAppStore.getState();
        
        // Converti tunerValue (0-100) in distort (0-1)
        const distortAmount = tunerValue / 100;
        
        // Aggiorna distorsione del materiale
        const material = meshRef.current.material as any;
        if (material && material.distort !== undefined) {
            material.distort = distortAmount;
        }
        
        // Aggiorna pitch del noise audio
        if (noiseAudioRef.current && noiseAudioRef.current.isPlaying) {
            // Converti tunerValue (0-100) in playbackRate (0.5-2.0)
            const pitchRate = 0.5 + (tunerValue / 100) * 1.5;
            
            noiseAudioRef.current.setPlaybackRate(pitchRate);
        }
    });
    
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[1.5, 64, 64]} />
            <MeshDistortMaterial
                roughness={0.}
                color={"#000000"}
                distort={0.4}
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
                roughness={0.109}
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
    <DynamicLight />
                    <Environment files={"/textures/rogland_clear_night_1k.exr"} blur={0.8} environmentIntensity={0.2} />
                    <group position={[0, -5, 0]} >
                        <group  position={[0.7,0,-2]} >
                            <TerrainGrid gridX={3} gridZ={2} />
                        </group>
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
                        color={"#ff0000"}
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
    <DynamicLight />
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