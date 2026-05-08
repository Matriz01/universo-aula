/**
 * Tests de <InfoPanel>
 *
 * - No se muestra si selectedPlanet === null
 * - Muestra el nombre del planeta
 * - Muestra la descripción según el nivel
 * - Incluye <PlutoNote> cuando selectedPlanet === 'pluto'
 * - Cada variante de nivel renderiza su contenido específico
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockSelectedPlanet: string | null = null;
let mockLevel = 'aprendiz';
const mockGoToBody = vi.fn();

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      selectedPlanet: mockSelectedPlanet,
      selectedBody: mockSelectedPlanet, // alias — en los tests existentes selectedPlanet es PlanetId
      goToBody: mockGoToBody,
      level: mockLevel,
    };
    return selector ? selector(state) : state;
  }),
  useSelectedBody: () => mockSelectedPlanet,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock PlutoNote para verificar que se renderiza
vi.mock('@/components/ui/PlutoNote', () => ({
  PlutoNote: ({ level }: { level: string }) => (
    <div data-testid="pluto-note" data-level={level}>
      pluto-note
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { InfoPanel } from '@/components/ui/InfoPanel';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedPlanet = null;
  mockLevel = 'aprendiz';
});

describe('<InfoPanel>', () => {
  it('no renderiza nada cuando selectedPlanet es null', () => {
    mockSelectedPlanet = null;
    const { container } = render(<InfoPanel />);
    // El panel principal no debe mostrarse
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="info-panel"]')).toBeNull();
  });

  it('renderiza el panel cuando hay un planeta seleccionado', () => {
    mockSelectedPlanet = 'earth';
    render(<InfoPanel />);
    expect(screen.getByTestId('info-panel')).toBeInTheDocument();
  });

  it('muestra el nombre del planeta en el título', () => {
    mockSelectedPlanet = 'mars';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    // t('solar:mars.name') => 'solar:mars.name'
    expect(screen.getByText('solar:mars.name')).toBeInTheDocument();
  });

  it('muestra la descripción según el nivel del planeta', () => {
    mockSelectedPlanet = 'jupiter';
    mockLevel = 'investigador';
    render(<InfoPanel />);
    expect(screen.getByText('solar:jupiter.investigador.description')).toBeInTheDocument();
  });

  it('nivel explorador muestra descripción explorador', () => {
    mockSelectedPlanet = 'saturn';
    mockLevel = 'explorador';
    render(<InfoPanel />);
    expect(screen.getByText('solar:saturn.explorador.description')).toBeInTheDocument();
  });

  it('nivel aprendiz muestra descripción aprendiz', () => {
    mockSelectedPlanet = 'venus';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    expect(screen.getByText('solar:venus.aprendiz.description')).toBeInTheDocument();
  });

  it('muestra curiosidad en nivel explorador', () => {
    mockSelectedPlanet = 'mercury';
    mockLevel = 'explorador';
    render(<InfoPanel />);
    expect(screen.getByText('solar:mercury.curiosity')).toBeInTheDocument();
  });

  it('muestra curiosidad en nivel aprendiz', () => {
    mockSelectedPlanet = 'earth';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    expect(screen.getByText('solar:earth.curiosity')).toBeInTheDocument();
  });

  it('NO muestra curiosity en nivel investigador', () => {
    mockSelectedPlanet = 'neptune';
    mockLevel = 'investigador';
    render(<InfoPanel />);
    expect(screen.queryByText('solar:neptune.curiosity')).not.toBeInTheDocument();
  });

  it('incluye PlutoNote cuando selectedPlanet es "pluto"', () => {
    mockSelectedPlanet = 'pluto';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    expect(screen.getByTestId('pluto-note')).toBeInTheDocument();
  });

  it('PlutoNote recibe el nivel correcto', () => {
    mockSelectedPlanet = 'pluto';
    mockLevel = 'investigador';
    render(<InfoPanel />);
    const plutoNote = screen.getByTestId('pluto-note');
    expect(plutoNote).toHaveAttribute('data-level', 'investigador');
  });

  it('NO muestra PlutoNote para planetas que no son Plutón', () => {
    mockSelectedPlanet = 'earth';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    expect(screen.queryByTestId('pluto-note')).not.toBeInTheDocument();
  });

  it('el botón de cerrar llama goToBody(null) para volver al modo global', () => {
    mockSelectedPlanet = 'mars';
    mockLevel = 'aprendiz';
    render(<InfoPanel />);
    const closeButton = screen.getByRole('button', { name: /cerrar|close/i });
    fireEvent.click(closeButton);
    expect(mockGoToBody).toHaveBeenCalledWith(null);
  });

  it('nivel investigador renderiza sin errores', () => {
    mockSelectedPlanet = 'uranus';
    mockLevel = 'investigador';
    expect(() => render(<InfoPanel />)).not.toThrow();
  });
});
