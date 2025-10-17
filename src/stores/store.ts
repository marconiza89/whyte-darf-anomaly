import { create } from 'zustand';

interface AppState {
  // Gestione degli step
  // 0 = Hero/EXPLORE
  // 0.5 = Implosion phase
  // 1 = SignalTuner minigame
  // 2 = Next phase...
  currentStep: number;
  setStep: (step: number) => void;
  
  // Progresso del bottone EXPLORE (0-1)
  exploreProgress: number;
  setExploreProgress: (progress: number | ((prev: number) => number)) => void;
  
  // Progresso dell'implosione (0-1)
  implosionProgress: number;
  setImplosionProgress: (progress: number) => void;
  
  // Camera target position
  cameraTarget: { x: number; y: number; z: number };
  setCameraTarget: (target: { x: number; y: number; z: number }) => void;
  
  // Flag per sapere se il bottone è premuto
  isExplorePressed: boolean;
  setExplorePressed: (pressed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentStep: 0,
  setStep: (step) => set({ currentStep: step }),
  
  exploreProgress: 0,
  setExploreProgress: (progress) => set((state) => ({
    exploreProgress: typeof progress === 'function' ? progress(state.exploreProgress) : progress
  })),
  
  implosionProgress: 0,
  setImplosionProgress: (progress) => set({ implosionProgress: progress }),
  
  cameraTarget: { x: 0, y: 0, z: 10 },
  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  isExplorePressed: false,
  setExplorePressed: (pressed) => set({ isExplorePressed: pressed }),
}));