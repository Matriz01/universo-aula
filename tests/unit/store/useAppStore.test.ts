/**
 * 1.13 — TEST: useAppStore extendido con 6 nuevos campos.
 * Extiende los tests existentes en store.test.ts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore — campos originales', () => {
  beforeEach(() => {
    useAppStore.setState({ locale: 'es', level: 'aprendiz' });
  });

  it('estado inicial tiene locale es y level aprendiz', () => {
    const state = useAppStore.getState();
    expect(state.locale).toBe('es');
    expect(state.level).toBe('aprendiz');
  });

  it('setLocale actualiza el locale', () => {
    useAppStore.getState().setLocale('en');
    expect(useAppStore.getState().locale).toBe('en');
  });

  it('setLevel actualiza el nivel', () => {
    useAppStore.getState().setLevel('investigador');
    expect(useAppStore.getState().level).toBe('investigador');
  });
});

describe('useAppStore — selectedPlanet', () => {
  beforeEach(() => {
    useAppStore.setState({ selectedPlanet: null });
  });

  it('valor inicial es null', () => {
    expect(useAppStore.getState().selectedPlanet).toBeNull();
  });

  it('setSelectedPlanet actualiza el planeta seleccionado', () => {
    useAppStore.getState().setSelectedPlanet('mars');
    expect(useAppStore.getState().selectedPlanet).toBe('mars');
  });

  it('setSelectedPlanet acepta null', () => {
    useAppStore.getState().setSelectedPlanet('earth');
    useAppStore.getState().setSelectedPlanet(null);
    expect(useAppStore.getState().selectedPlanet).toBeNull();
  });
});

describe('useAppStore — cameraMode', () => {
  beforeEach(() => {
    useAppStore.setState({ cameraMode: 'overview' });
  });

  it('valor inicial es overview', () => {
    expect(useAppStore.getState().cameraMode).toBe('overview');
  });

  it('setCameraMode cambia a focus', () => {
    useAppStore.getState().setCameraMode('focus');
    expect(useAppStore.getState().cameraMode).toBe('focus');
  });

  it('setCameraMode cambia a tour', () => {
    useAppStore.getState().setCameraMode('tour');
    expect(useAppStore.getState().cameraMode).toBe('tour');
  });
});

describe('useAppStore — textureQuality', () => {
  beforeEach(() => {
    useAppStore.setState({ textureQuality: '2k' });
  });

  it('valor inicial es 2k', () => {
    expect(useAppStore.getState().textureQuality).toBe('2k');
  });

  it('setTextureQuality cambia a 4k', () => {
    useAppStore.getState().setTextureQuality('4k');
    expect(useAppStore.getState().textureQuality).toBe('4k');
  });

  it('setTextureQuality cambia a 1k', () => {
    useAppStore.getState().setTextureQuality('1k');
    expect(useAppStore.getState().textureQuality).toBe('1k');
  });
});

describe('useAppStore — tourActive', () => {
  beforeEach(() => {
    useAppStore.setState({ tourActive: false });
  });

  it('valor inicial es false', () => {
    expect(useAppStore.getState().tourActive).toBe(false);
  });

  it('setTourActive activa el tour', () => {
    useAppStore.getState().setTourActive(true);
    expect(useAppStore.getState().tourActive).toBe(true);
  });

  it('setTourActive desactiva el tour', () => {
    useAppStore.getState().setTourActive(true);
    useAppStore.getState().setTourActive(false);
    expect(useAppStore.getState().tourActive).toBe(false);
  });
});

describe('useAppStore — prefersReducedMotion', () => {
  beforeEach(() => {
    useAppStore.setState({ prefersReducedMotion: false });
  });

  it('valor inicial es false', () => {
    expect(useAppStore.getState().prefersReducedMotion).toBe(false);
  });

  it('setPrefersReducedMotion actualiza el valor', () => {
    useAppStore.getState().setPrefersReducedMotion(true);
    expect(useAppStore.getState().prefersReducedMotion).toBe(true);
  });
});

describe('useAppStore — sunShaderVariant', () => {
  beforeEach(() => {
    useAppStore.setState({ sunShaderVariant: 'full' });
  });

  it('valor inicial es full', () => {
    expect(useAppStore.getState().sunShaderVariant).toBe('full');
  });

  it('setSunShaderVariant cambia a lite', () => {
    useAppStore.getState().setSunShaderVariant('lite');
    expect(useAppStore.getState().sunShaderVariant).toBe('lite');
  });

  it('setSunShaderVariant cambia a texture', () => {
    useAppStore.getState().setSunShaderVariant('texture');
    expect(useAppStore.getState().sunShaderVariant).toBe('texture');
  });
});

describe('selectores exportados', () => {
  it('useSelectedPlanet, useCameraMode, useTourActive existen como exports', async () => {
    const module = await import('@/store/useAppStore');
    expect(typeof module.useSelectedPlanet).toBe('function');
    expect(typeof module.useCameraMode).toBe('function');
    expect(typeof module.useTourActive).toBe('function');
  });
});
