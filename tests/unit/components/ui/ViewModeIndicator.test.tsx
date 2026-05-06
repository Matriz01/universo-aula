/**
 * Tests del componente <ViewModeIndicator>.
 *
 * Verifica comportamiento del HUD en modo global y local.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Mock de react-i18next
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string; defaultValue?: string }) => {
      const name = opts?.name ?? '';
      const map: Record<string, string> = {
        'solar:view_mode.local': `Vista local: ${name}`,
        'solar:view_mode.exit': 'Salir',
        'solar:view_mode.known_events_toggle': 'Mostrar eventos conocidos',
        'solar:earth.name': 'Tierra',
        'solar:mars.name': 'Marte',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { useAppStore } from '@/store/useAppStore';
import { ViewModeIndicator } from '@/components/ui/ViewModeIndicator';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState({
    viewMode: 'global',
    selectedPlanet: null,
    showKnownEvents: false,
  });
  vi.clearAllMocks();
});

describe('<ViewModeIndicator> — modo global', () => {
  it('no renderiza nada en modo global', () => {
    useAppStore.setState({ viewMode: 'global' });
    render(<ViewModeIndicator />);
    expect(screen.queryByTestId('view-mode-indicator')).toBeNull();
  });
});

describe('<ViewModeIndicator> — modo local', () => {
  beforeEach(() => {
    useAppStore.setState({ viewMode: 'local', selectedPlanet: 'earth' });
  });

  it('renderiza el indicador en modo local', () => {
    render(<ViewModeIndicator />);
    expect(screen.getByTestId('view-mode-indicator')).toBeTruthy();
  });

  it('muestra el botón Salir', () => {
    render(<ViewModeIndicator />);
    const btn = screen.getByTestId('exit-local-mode');
    expect(btn).toBeTruthy();
  });

  it('el botón Salir llama a goToBody(null)', () => {
    // Verificamos que al hacer click la acción goToBody lleva a modo global
    render(<ViewModeIndicator />);
    fireEvent.click(screen.getByTestId('exit-local-mode'));
    // Tras hacer click, el store debería estar en modo global
    expect(useAppStore.getState().viewMode).toBe('global');
  });

  it('muestra el toggle de eventos conocidos', () => {
    render(<ViewModeIndicator />);
    expect(screen.getByTestId('known-events-toggle')).toBeTruthy();
  });

  it('el toggle de eventos conocidos alterna showKnownEvents', () => {
    render(<ViewModeIndicator />);
    const toggle = screen.getByTestId('known-events-toggle');
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(useAppStore.getState().showKnownEvents).toBe(true);
  });
});
