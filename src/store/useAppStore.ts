import { create } from 'zustand';
import type { PedagogicalLevel } from '@/types';

interface AppState {
  level: PedagogicalLevel;
  locale: string;
  setLevel: (level: PedagogicalLevel) => void;
  setLocale: (locale: string) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  level: 'aprendiz',
  locale: 'es',
  setLevel: (level) => set({ level }),
  setLocale: (locale) => set({ locale }),
}));

// Selectors
export const useLevel = () => useAppStore((s) => s.level);
export const useLocale = () => useAppStore((s) => s.locale);
