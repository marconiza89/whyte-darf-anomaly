"use client";
import { useAppStore } from "@/stores/store";
import { useEffect, useRef, useState } from "react";

export function SignalTuner() {
  const currentStep = useAppStore((state) => state.currentStep);
  const setStep = useAppStore((state) => state.setStep);
  
  const [frequency, setFrequency] = useState(50); // 0-100
  const [isLocked, setIsLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Target frequency (around 75 for example)
  const TARGET_FREQUENCY = 73.5;
  const LOCK_THRESHOLD = 2.5; // How close you need to be to lock
  
  // Calculate how close we are to target (0-1, where 1 is perfect)
  const proximity = Math.max(0, 1 - Math.abs(frequency - TARGET_FREQUENCY) / 50);
  const isInLockRange = Math.abs(frequency - TARGET_FREQUENCY) < LOCK_THRESHOLD;

  // Handle frequency change
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLocked) {
      setFrequency(parseFloat(e.target.value));
    }
  };

  // Lock signal when in range for 1 second
  useEffect(() => {
    if (isInLockRange && !isLocked) {
      const timeout = setTimeout(() => {
        setIsLocked(true);
        setShowSuccess(true);
        
        // Transition to next step after showing success message
        setTimeout(() => {
          setStep(2);
        }, 3000);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isInLockRange, isLocked, setStep]);

  // Canvas visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    
    let time = 0;
    
    const draw = () => {
      time += 0.016;
      
      // Clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, w, h);
      
      // Draw frequency spectrum
      const barCount = 100;
      const barWidth = w / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const freq = (i / barCount) * 100;
        const distFromTarget = Math.abs(freq - TARGET_FREQUENCY);
        const distFromCurrent = Math.abs(freq - frequency);
        
        // Base noise height
        let noiseHeight = Math.random() * 20 * (1 - proximity);
        
        // Signal peak at target frequency
        if (distFromTarget < 5) {
          const peakStrength = 1 - (distFromTarget / 5);
          noiseHeight += peakStrength * 60 * proximity;
          
          // Add harmonic pattern when close
          if (proximity > 0.5) {
            noiseHeight += Math.sin(time * 3 + i * 0.2) * 20 * proximity;
          }
        }
        
        // Current frequency indicator
        if (distFromCurrent < 2) {
          noiseHeight += 30;
        }
        
        const barHeight = Math.max(2, noiseHeight);
        
        // Color based on proximity and position
        const hue = 200 + (proximity * 60); // Blue to cyan
        const alpha = distFromTarget < 5 ? 0.3 + proximity * 0.7 : 0.3;
        
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
        ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
      }
      
      // Draw geometric patterns when locked
      if (isLocked) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        
        // Draw rotating hexagon
        const sides = 6;
        const radius = 40 + Math.sin(time * 2) * 10;
        ctx.strokeStyle = `rgba(154, 206, 255, ${0.5 + Math.sin(time * 3) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + time;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.restore();
      }
      
      // Draw signal pattern when in range
      if (proximity > 0.7) {
        ctx.strokeStyle = `rgba(154, 206, 255, ${proximity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < w; x += 2) {
          const freq = (x / w) * 100;
          const distFromTarget = Math.abs(freq - TARGET_FREQUENCY);
          
          if (distFromTarget < 10) {
            const y = h / 2 + Math.sin(x * 0.1 + time * 5) * 30 * proximity;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequency, proximity, isLocked]);

  if (currentStep !== 1) {
    return null;
  }


  return (
    <div className="fixed inset-0 w-full h-[100svh] flex flex-col items-center justify-center text-neutral-50/90 pointer-events-auto">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/0 " />
      
      {/* Main container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-6">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-xs tracking-[0.3em] text-neutral-50/40 mb-2">
            OSSERVATORIO DI ARECIBO / 12.03.2087
          </div>
          <h2 className="text-2xl lg:text-4xl font-thin mb-4">
            SEGNALE ORIGINARIO
          </h2>
          <p className="text-sm lg:text-base text-neutral-50/60 max-w-2xl mx-auto leading-relaxed">
            Captato segnale a banda stretta dalla nana bianca WD-2214.
            Pattern matematici complessi rilevati. Sintonizzare per l'analisi.
          </p>
        </div>

        {/* Spectrum visualizer */}
        <div className="w-full mb-6 border border-neutral-50/20 bg-black/40 relative overflow-hidden">
          <canvas 
            ref={canvasRef}
            className="w-full h-48 lg:h-64"
            style={{ display: 'block' }}
          />
          
          {/* Frequency marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-neutral-50/60"
            style={{ left: `${frequency}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
              {frequency.toFixed(1)} MHz
            </div>
          </div>
        </div>

        {/* Frequency slider */}
        <div className="w-full mb-4">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={frequency}
            onChange={handleFrequencyChange}
            disabled={isLocked}
            className="w-full h-2 bg-neutral-50/10 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-neutral-50
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-neutral-50/40
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-neutral-50
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-neutral-50/40
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Status indicators */}
        <div className="flex gap-6 text-xs text-center">
          <div>
            <div className="text-neutral-50/40 mb-1">SEGNALE</div>
            <div className={`font-mono transition-colors ${
              proximity > 0.8 ? 'text-green-400' : 
              proximity > 0.5 ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {(proximity * 100).toFixed(0)}%
            </div>
          </div>
          
          <div>
            <div className="text-neutral-50/40 mb-1">RUMORE</div>
            <div className="font-mono text-neutral-50/70">
              {((1 - proximity) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div>
            <div className="text-neutral-50/40 mb-1">STATO</div>
            <div className={`font-mono transition-colors ${
              isLocked ? 'text-green-400' : 
              isInLockRange ? 'text-yellow-400 animate-pulse' : 
              'text-neutral-50/70'
            }`}>
              {isLocked ? 'LOCKED' : isInLockRange ? 'LOCKING...' : 'SCANNING'}
            </div>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 animate-in fade-in duration-500">
            <div className="text-center">
              <div className="text-green-400 text-sm tracking-[0.3em] mb-2">
                ✓ SEGNALE STABILIZZATO
              </div>
              <h3 className="text-2xl lg:text-3xl font-thin mb-4">
                Struttura Matematica Riconosciuta
              </h3>
              <div className="text-neutral-50/60 text-sm">
                Analisi in corso...
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isLocked && proximity < 0.5 && (
          <div className="fixed bottom-24 text-xs text-neutral-50/40 text-center">
            Regola la frequenza per ridurre il rumore
          </div>
        )}
        
        {isInLockRange && !isLocked && (
          <div className=" fixed bottom-24 text-xs text-yellow-400/80 text-center animate-pulse">
            Mantieni la posizione per bloccare il segnale...
          </div>
        )}
      </div>
    </div>
  );
}