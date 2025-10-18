"use client";
import { useAppStore } from "@/stores/store";

export function SignalTuner() {
  const currentStep = useAppStore((state) => state.currentStep);
  const tunerValue = useAppStore((state) => state.tunerValue);
  const setTunerValue = useAppStore((state) => state.setTunerValue);

  // Target range
  const TARGET_MIN = 74;
  const TARGET_MAX = 75;
  const TARGET_CENTER = 74.5;
  
  // Calcola proximity al target (0-1)
  const distanceFromTarget = Math.abs(tunerValue - TARGET_CENTER);
  const proximity = Math.max(0, 1 - (distanceFromTarget / 50));
  const isInRange = tunerValue >= TARGET_MIN && tunerValue <= TARGET_MAX;

  if (currentStep !== 1) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-[100svh] flex flex-col items-center justify-center text-neutral-50/90 pointer-events-auto">
      {/* Background overlay */}
      <div className="absolute inset-0 " />
      
      {/* Main container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="text-xs tracking-[0.4em] text-neutral-400 mb-3">
            SINTONIZZATORE SEGNALE
          </div>
          <h2 className="text-3xl lg:text-5xl font-extralight mb-6 text-neutral-100">
            ANOMALIA WD-2214
          </h2>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Sintonizza sul range <span className="text-neutral-200 font-medium">74.0 - 75.0 Hz</span> per stabilizzare il segnale
          </p>
        </div>

        {/* Tuner display */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`text-2xl lg:text-3xl font-thin tabular-nums transition-colors ${
              isInRange ? 'text-red-400' : 'text-neutral-200'
            }`}>
              {tunerValue.toFixed(1)}
            </div>
            <div className="text-2xl text-neutral-500 ml-2 mt-8">
              Hz
            </div>
          </div>
          
          {/* Visual indicator bars */}
          <div className="flex justify-center gap-1 mb-8">
            {Array.from({ length: 20 }).map((_, i) => {
              const barValue = (i / 19) * 100;
              const isActive = Math.abs(barValue - tunerValue) < 10;
              
              // Evidenzia target range
              const isTargetRange = barValue >= TARGET_MIN - 2 && barValue <= TARGET_MAX + 2;
              
              const height = isActive ? 'h-12' : 'h-6';
              const opacity = isActive ? 'opacity-100' : 'opacity-30';
              const color = isTargetRange ? 'bg-neutral-50' : 'bg-neutral-400';
              
              return (
                <div
                  key={i}
                  className={`w-2 ${height} ${color} ${opacity} transition-all duration-200`}
                />
              );
            })}
          </div>
          
          {/* Proximity indicator */}
          {/* <div className="flex justify-center mb-4">
            <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neutral-600 via-green-500 to-green-400 transition-all duration-200"
                style={{ width: `${proximity * 100}%` }}
              />
            </div>
          </div> */}
          
          {/* Status message */}
          <div className="text-center text-sm">
            {isInRange ? (
              <span className="text-neutral-50 animate-pulse">● SEGNALE STABILIZZATO</span>
            ) : proximity > 0.8 ? (
              <span className="text-neutral-400">○ AVVICINAMENTO AL TARGET</span>
            ) : (
              <span className="text-neutral-500">○ FUORI RANGE</span>
            )}
          </div>
        </div>

        {/* Slider */}
        <div className="w-full mb-6">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={tunerValue}
            onChange={(e) => setTunerValue(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-neutral-200
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-neutral-800
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-neutral-200
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-neutral-800
                     [&::-moz-range-thumb]:shadow-lg"
          />
          
          {/* Range markers */}
          <div className="flex justify-between mt-2 text-xs text-neutral-600">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span >75</span>
            <span>100</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-1 gap-6 text-center mt-8">
          {/* <div className="border border-neutral-700 p-4">
            <div className="text-xs text-neutral-500 mb-2 tracking-wider">DISTORSIONE</div>
            <div className="text-2xl font-light text-neutral-200">
              {tunerValue.toFixed(0)}%
            </div>
          </div>
          
          <div className="border border-neutral-700 p-4">
            <div className="text-xs text-neutral-500 mb-2 tracking-wider">PITCH</div>
            <div className="text-2xl font-light text-neutral-200">
              {(0.5 + (tunerValue / 100) * 1.5).toFixed(2)}x
            </div>
          </div> */}
          
          <div className="border border-neutral-700 p-4">
            <div className="text-xs text-neutral-500 mb-2 tracking-wider">PROXIMITY</div>
            <div className={`text-2xl font-light transition-colors ${
              isInRange ? 'text-neutral-50' : 'text-neutral-400'
            }`}>
              {(proximity * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-xs text-red-400 text-center">
          {isInRange 
            ? "Connection"
            : "No Signal"
          }
        </div>
      </div>
    </div>
  );
}