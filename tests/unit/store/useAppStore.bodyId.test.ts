/**
 * T B.2 — TEST: Store — selectedBody acepta 'moon'
 *
 * Verifica:
 * 1. goToBody('moon') → selectedBody === 'moon' && viewMode === 'local'
 * 2. goToBody('earth') → selectedBody === 'earth' && viewMode === 'local'
 * 3. toggleRotationAxes() false→true, true→false
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore — selectedBody + goToBody con BodyId', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedBody: null,
      viewMode: 'global',
      cameraMode: 'overview',
    });
  });

  it("goToBody('moon') → selectedBody === 'moon' && viewMode === 'local'", () => {
    useAppStore.getState().goToBody('moon');
    const state = useAppStore.getState();
    expect(state.selectedBody).toBe('moon');
    expect(state.viewMode).toBe('local');
  });

  it("goToBody('earth') → selectedBody === 'earth' && viewMode === 'local'", () => {
    useAppStore.getState().goToBody('earth');
    const state = useAppStore.getState();
    expect(state.selectedBody).toBe('earth');
    expect(state.viewMode).toBe('local');
  });

  it('goToBody(null) → selectedBody === null && viewMode === global', () => {
    useAppStore.getState().goToBody('earth');
    useAppStore.getState().goToBody(null);
    const state = useAppStore.getState();
    expect(state.selectedBody).toBeNull();
    expect(state.viewMode).toBe('global');
  });

  it("goToBody('moon') pone cameraMode en 'focus'", () => {
    useAppStore.getState().goToBody('moon');
    expect(useAppStore.getState().cameraMode).toBe('focus');
  });

  it("goToBody('moon') deja selectedPlanet en null (la Luna no es un planeta)", () => {
    useAppStore.getState().goToBody('moon');
    expect(useAppStore.getState().selectedPlanet).toBeNull();
  });
});

describe('useAppStore — showRotationAxes + toggleRotationAxes', () => {
  beforeEach(() => {
    useAppStore.setState({
      showRotationAxes: false,
    });
  });

  it('showRotationAxes valor inicial es false', () => {
    expect(useAppStore.getState().showRotationAxes).toBe(false);
  });

  it('toggleRotationAxes() cambia de false a true', () => {
    useAppStore.getState().toggleRotationAxes();
    expect(useAppStore.getState().showRotationAxes).toBe(true);
  });

  it('toggleRotationAxes() cambia de true a false', () => {
    useAppStore.getState().toggleRotationAxes();
    useAppStore.getState().toggleRotationAxes();
    expect(useAppStore.getState().showRotationAxes).toBe(false);
  });
});
