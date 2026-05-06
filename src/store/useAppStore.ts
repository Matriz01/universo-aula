import { create } from 'zustand';
import type { PedagogicalLevel } from '@/types';
import type { PlanetId } from '@/scenes/data/types';

export type CameraMode = 'overview' | 'focus' | 'tour';
export type TextureQuality = '1k' | '2k' | '4k';
export type SunShaderVariant = 'full' | 'lite' | 'texture';
export type ViewMode = 'global' | 'local';

interface AppState {
  // — Campos originales —
  level: PedagogicalLevel;
  locale: string;
  setLevel: (level: PedagogicalLevel) => void;
  setLocale: (locale: string) => void;

  // — Nuevos campos (solar-system-mvp) —

  /** Planeta actualmente seleccionado por el usuario. null = ninguno. */
  selectedPlanet: PlanetId | null;
  setSelectedPlanet: (planet: PlanetId | null) => void;

  /** Modo de cámara activo. */
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  /** Calidad de texturas seleccionada (adaptada por GPU o manualmente). */
  textureQuality: TextureQuality;
  setTextureQuality: (quality: TextureQuality) => void;

  /** True cuando el tour automático está en ejecución. */
  tourActive: boolean;
  setTourActive: (active: boolean) => void;

  /** Planeta activo durante el tour (para sincronia con HUD). */
  tourCurrentPlanet: PlanetId | null;
  setTourCurrentPlanet: (planet: PlanetId | null) => void;

  /** Respeta prefers-reduced-motion del usuario (tweens cortos, avance manual). */
  prefersReducedMotion: boolean;
  setPrefersReducedMotion: (value: boolean) => void;

  /** Variante del shader del Sol según capacidad GPU detectada. */
  sunShaderVariant: SunShaderVariant;
  setSunShaderVariant: (variant: SunShaderVariant) => void;

  /** Flag de emergencia: si true, renderiza EmptyScene en lugar de SolarSystemScene. */
  legacyFlag: boolean;

  // — Modo local —

  /** Modo de visualización: global (sistema completo) o local (planeta enfocado). */
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  /** Mostrar eventos conocidos (cometas, etc.) en modo local. */
  showKnownEvents: boolean;
  setShowKnownEvents: (show: boolean) => void;

  /**
   * Acción unificada de navegación.
   * null  → vuelve a modo global (selectedPlanet=null, viewMode='global', cameraMode='overview')
   * PlanetId → entra en modo local (selectedPlanet=id, viewMode='local', cameraMode='focus')
   */
  goToBody: (id: PlanetId | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  // Campos originales
  level: 'aprendiz',
  locale: 'es',
  setLevel: (level) => set({ level }),
  setLocale: (locale) => set({ locale }),

  // Nuevos campos
  selectedPlanet: null,
  setSelectedPlanet: (selectedPlanet) => set({ selectedPlanet }),

  cameraMode: 'overview',
  setCameraMode: (cameraMode) => set({ cameraMode }),

  textureQuality: '2k',
  setTextureQuality: (textureQuality) => set({ textureQuality }),

  tourActive: false,
  setTourActive: (tourActive) => set({ tourActive }),

  tourCurrentPlanet: null,
  setTourCurrentPlanet: (tourCurrentPlanet) => set({ tourCurrentPlanet }),

  prefersReducedMotion: false,
  setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),

  sunShaderVariant: 'full',
  setSunShaderVariant: (sunShaderVariant) => set({ sunShaderVariant }),

  legacyFlag: false,

  // Modo local
  viewMode: 'global',
  setViewMode: (viewMode) => set({ viewMode }),

  showKnownEvents: false,
  setShowKnownEvents: (showKnownEvents) => set({ showKnownEvents }),

  goToBody: (id) => {
    if (id === null) {
      set({ selectedPlanet: null, viewMode: 'global', cameraMode: 'overview' });
    } else {
      set({ selectedPlanet: id, viewMode: 'local', cameraMode: 'focus' });
    }
  },
}));

// ---------------------------------------------------------------------------
// Selectores — hooks para suscripción a sub-estado
// ---------------------------------------------------------------------------

export const useLevel = () => useAppStore((s) => s.level);
export const useLocale = () => useAppStore((s) => s.locale);
export const useSelectedPlanet = () => useAppStore((s) => s.selectedPlanet);
export const useCameraMode = () => useAppStore((s) => s.cameraMode);
export const useTextureQuality = () => useAppStore((s) => s.textureQuality);
export const useTourActive = () => useAppStore((s) => s.tourActive);
export const useTourCurrentPlanet = () => useAppStore((s) => s.tourCurrentPlanet);
export const usePrefersReducedMotion = () => useAppStore((s) => s.prefersReducedMotion);
export const useSunShaderVariant = () => useAppStore((s) => s.sunShaderVariant);
export const useViewMode = () => useAppStore((s) => s.viewMode);
export const useShowKnownEvents = () => useAppStore((s) => s.showKnownEvents);
