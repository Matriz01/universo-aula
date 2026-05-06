import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore', () => {
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
