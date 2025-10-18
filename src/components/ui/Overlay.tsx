"use client";
import ResponsiveTriangle from "./Triangle";
import { useAppStore } from "@/stores/store";
import { useEffect, useRef, useState } from "react";
import { SignalTuner } from "./minigames/SignalTuner";

export function Overlay() {
  const [audioInitialized, setAudioInitialized] = useState(false);

  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const fadeRAFRef = useRef<number | null>(null);

  const playSoundtrack = () => {
    const el = soundtrackRef.current;
    if (!el) return;

    try {
      el.volume = 0;
      el.play().then(() => {
        const DURATION = 1200; // ms
        let start = performance.now();

        const tick = (t: number) => {
          const dt = t - start;
          const p = Math.min(dt / DURATION, 1);
          el.volume = p; // fade da 0 a 1
          if (p < 1) {
            fadeRAFRef.current = requestAnimationFrame(tick);
          }
        };

        if (fadeRAFRef.current) cancelAnimationFrame(fadeRAFRef.current);
        fadeRAFRef.current = requestAnimationFrame(tick);
      }).catch((err) => {
        console.warn("Autoplay soundtrack bloccato:", err);
      });
    } catch (e) {
      console.error("Errore avvio soundtrack:", e);
    }
  };

  useEffect(() => {
    return () => {
      if (fadeRAFRef.current) cancelAnimationFrame(fadeRAFRef.current);
      if (soundtrackRef.current) {
        try {
          soundtrackRef.current.pause();
          soundtrackRef.current.src = "";
        } catch { }
      }
    };
  }, []);

  return (
    <div className="">
      {/* Audio element nascosto per la soundtrack */}
      <audio
        ref={soundtrackRef}
        src="/audio/background.mp3"
        loop
        preload="auto"
        playsInline
      />

      {!audioInitialized && (
        <StartScreen
          onStart={() => {
            // Avvia soundtrack nell’handler del click (user gesture)
            playSoundtrack();
            setAudioInitialized(true);
          }}
        />
      )}

      {audioInitialized && (
        <>
          <Hero />
          <ImplosionPhase />
          <SignalTuner />
        </>
      )}
    </div>
  );
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 w-full h-[100svh] flex items-center justify-center bg-black z-50">
      <div className="flex flex-col items-center text-neutral-50/90">
        <h1 className="text-6xl lg:text-8xl font-thin mb-4">WHYTE DARF</h1>
        <p className="tracking-[20px] lg:tracking-[40px] text-sm lg:text-lg mb-12">ANOMALY</p>

        <button
          onClick={onStart}
          className="relative p-6 px-12 border border-neutral-50/40 hover:bg-neutral-50/10 transition-colors cursor-pointer"
        >
          <span className="text-lg tracking-widest">START</span>
        </button>

        <p className="text-xs text-neutral-50/40 mt-8">Assicurati che l'audio sia attivo</p>
      </div>
    </div>
  );
}

function ImplosionPhase() {
  const currentStep = useAppStore((state) => state.currentStep);
  const setStep = useAppStore((state) => state.setStep);
  const setImplosionProgress = useAppStore((state) => state.setImplosionProgress);
  const setFadeInProgress = useAppStore((state) => state.setFadeInProgress);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const hasStartedRef = useRef(false);
  const sceneChangedRef = useRef(false);

  // Duration of implosion animation in milliseconds
  const IMPLOSION_DURATION = 1000;
  const FADE_IN_DURATION = 1000;

  // Animate implosion progress (audio è gestito dal positional audio in Anomaly)
  useEffect(() => {
    if (currentStep === 0.5) {
      if (!hasStartedRef.current) {
        console.log("Starting implosion phase animation");
        hasStartedRef.current = true;
        sceneChangedRef.current = false;
      }

      lastTimeRef.current = performance.now();
      let currentProgress = 0;
      setImplosionProgress(0);

      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        const increment = deltaTime / IMPLOSION_DURATION;
        currentProgress = Math.min(currentProgress + increment, 1);

        setImplosionProgress(currentProgress);

        // When implosion completes, start fade in
        if (currentProgress >= 1 && !sceneChangedRef.current) {
          console.log("Implosion complete, starting fade in");
          sceneChangedRef.current = true;

          // Start fade in animation
          let fadeProgress = 0;
          setFadeInProgress(0);
          lastTimeRef.current = performance.now();

          const fadeIn = (fadeTime: number) => {
            const fadeDelta = fadeTime - lastTimeRef.current;
            lastTimeRef.current = fadeTime;

            const fadeIncrement = fadeDelta / FADE_IN_DURATION;
            fadeProgress = Math.min(fadeProgress + fadeIncrement, 1);

            setFadeInProgress(fadeProgress);

            // When fade in completes, transition to step 1
            if (fadeProgress >= 1) {
              console.log("Fade in complete, transitioning to step 1");
              setTimeout(() => {
                setStep(1);
                hasStartedRef.current = false;
              }, 100);
              return;
            }

            animationRef.current = requestAnimationFrame(fadeIn);
          };

          animationRef.current = requestAnimationFrame(fadeIn);
          return;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      hasStartedRef.current = false;
      sceneChangedRef.current = false;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentStep, setImplosionProgress, setFadeInProgress, setStep]);

  // This component doesn't render any visible UI
  return null;
}



function Hero() {
  const currentStep = useAppStore((state) => state.currentStep);
  const setStep = useAppStore((state) => state.setStep);
  const exploreProgress = useAppStore((state) => state.exploreProgress);
  const setExploreProgress = useAppStore((state) => state.setExploreProgress);
  const isExplorePressed = useAppStore((state) => state.isExplorePressed);
  const setExplorePressed = useAppStore((state) => state.setExplorePressed);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Progress increment speed (reaches 1.0 in ~3 seconds)
  const PROGRESS_DURATION = 3000; // milliseconds

  // Initialize audio on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Resume audio context if suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Create gain node
        const gainNode = audioContext.createGain();
        gainNodeRef.current = gainNode;
        gainNode.connect(audioContext.destination);

        // Load audio file
        const response = await fetch('/audio/wind.mp3');

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        // Start playing
        playAudio(1.0); // Start with normal playback rate

      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (e) { }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Function to play audio with specific playback rate
  const playAudio = (playbackRate: number) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioContext || !audioBuffer || !gainNode) return;

    // Stop previous source if exists
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    }

    // Create new buffer source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    source.playbackRate.value = playbackRate;

    // Connect source to gain
    source.connect(gainNode);

    // Start playing
    source.start(0, pauseTimeRef.current % audioBuffer.duration);
    startTimeRef.current = audioContext.currentTime - pauseTimeRef.current;

    sourceNodeRef.current = source;
  };

  // Handle pitch shifting based on explore progress
  useEffect(() => {
    if (!sourceNodeRef.current || !audioContextRef.current) return;

    // Pitch up based on progress (1.0 to 2.5 playback rate)
    const pitchFactor = 1.0 + (exploreProgress * 1.5); // From 1.0x to 2.5x speed

    // Update playback rate smoothly
    const source = sourceNodeRef.current;
    const audioContext = audioContextRef.current;

    // Use linearRampToValueAtTime for smooth pitch changes
    source.playbackRate.cancelScheduledValues(audioContext.currentTime);
    source.playbackRate.setValueAtTime(
      source.playbackRate.value,
      audioContext.currentTime
    );
    source.playbackRate.linearRampToValueAtTime(
      pitchFactor,
      audioContext.currentTime + 0.1
    );

  }, [exploreProgress]);

  // Handle fade out when progress reaches 1
  useEffect(() => {
    const gainNode = gainNodeRef.current;
    const audioContext = audioContextRef.current;

    if (!gainNode || !audioContext) return;

    if (exploreProgress >= 0.8) {
      // Start fading out in the last 20% of progress
      const fadeProgress = (exploreProgress - 0.8) / 0.2; // 0 to 1
      const volume = 1.0 - fadeProgress;

      // Smooth volume transition
      gainNode.gain.cancelScheduledValues(audioContext.currentTime);
      gainNode.gain.setValueAtTime(
        gainNode.gain.value,
        audioContext.currentTime
      );
      gainNode.gain.linearRampToValueAtTime(
        Math.max(0, volume),
        audioContext.currentTime + 0.05
      );
    } else {
      // Keep volume at full
      gainNode.gain.cancelScheduledValues(audioContext.currentTime);
      gainNode.gain.setValueAtTime(
        gainNode.gain.value,
        audioContext.currentTime
      );
      gainNode.gain.linearRampToValueAtTime(
        1.0,
        audioContext.currentTime + 0.05
      );
    }
  }, [exploreProgress]);

  const handleMouseDown = () => {
    setExplorePressed(true);
  };

  const handleMouseUp = () => {
    setExplorePressed(false);
    // Reset progress if not completed using functional form
    setExploreProgress((prev) => {
      if (prev < 1) {
        return 0;
      }
      return prev;
    });
  };

  // Handle progress increment with requestAnimationFrame
  useEffect(() => {
    if (isExplorePressed && currentStep === 0) {
      lastTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        setExploreProgress((prev) => {
          const increment = deltaTime / PROGRESS_DURATION;
          const newProgress = Math.min(prev + increment, 1);

          // When progress reaches 1, transition to implosion phase (step 0.5)
          if (newProgress >= 1 && prev < 1) {
            setTimeout(() => {
              setStep(0.5); // Trigger implosion phase
            }, 300);
          }

          return newProgress;
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isExplorePressed, currentStep, setExploreProgress, setStep]);

  // Only show step 0 UI
  if (currentStep !== 0) {
    return null;
  }

  return (
    <div className="w-full pointer-events-none text-neutral-50/70 fixed h-[100svh] flex flex-col font-sans bg-white/00 justify-center items-center">
      <ResponsiveTriangle
        topOffset="56px"
        leftMargin="0px"
        rightMargin="0px"
        height="100svh"
        fill="rgba(250, 250, 250, 0.01)"
        borderColor="rgba(255, 255, 255, 0.45)"
        borderWidth={1}
      />

      <div className="flex h-1/3"></div>
      <div className="flex h-1/4"></div>
      <div className="flex flex-col items-center h-1/3">
        <h1 className="text-5xl lg:text-8xl font-thin mb-2">WHYTE DARF</h1>
        <p className="tracking-[20px] lg:tracking-[40px] text-sm lg:text-lg">ANOMALY</p>

        {/* Explore Button */}
        <button
          className="relative p-4 border border-neutral-50/20 mt-12 pointer-events-auto cursor-pointer overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          {/* Fill background */}
          <div
            className="absolute inset-0 bg-neutral-50/20 transition-transform origin-left"
            style={{
              transform: `scaleX(${exploreProgress})`,
              transitionDuration: "0ms",
            }}
          />

          {/* Text */}
          <span className="relative z-10">EXPLORE</span>
        </button>

        {exploreProgress > 0 && exploreProgress < 1 && (
          <p className="text-xs mt-4 opacity-60">Hold to continue...</p>
        )}
      </div>
    </div>
  );
}