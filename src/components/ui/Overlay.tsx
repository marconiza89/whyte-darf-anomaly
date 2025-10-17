"use client";
import ResponsiveTriangle from "./Triangle";
import { useAppStore } from "@/stores/store";
import { useEffect, useRef, useState } from "react";
import { SignalTuner } from "./minigames/SignalTuner";

export function Overlay() {
  return (
    <div className="">
      <Hero />
      <SignalTuner />
    </div>
  );
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

  // Progress increment speed (reaches 1.0 in ~3 seconds)
  const PROGRESS_DURATION = 3000; // milliseconds

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
          
          // When progress reaches 1, transition to step 1
          if (newProgress >= 1 && prev < 1) {
            setTimeout(() => {
              setStep(1);
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