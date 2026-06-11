/**
 * TopBar — tests unitarios
 *
 * REQs cubiertos: REQ-TOPBAR-1, REQ-TOPBAR-2, REQ-TOPBAR-3, REQ-INV-5
 *
 * TopBar compone widgets que leen el store, por lo que necesita Providers.
 * No toca src/scenes → no necesita mocks R3F.
 */

import { render, screen } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { TopBar } from '@/components/cockpit/TopBar';

// Mock mínimo para SolarSystemScene (usado transitivamente por algunos widgets)
// y para las dependencias de hud que usan hooks de scenes
vi.mock('@/scenes/SolarSystemScene', () => ({
  SolarSystemScene: () => <div data-testid="solar-system-scene" />,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  useProgress: () => ({ progress: 100 }),
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

function renderTopBar() {
  return render(
    <Providers>
      <TopBar />
    </Providers>,
  );
}

describe('TopBar — widget presence, flex-wrap, no fixed positioning (REQ-TOPBAR-1, REQ-TOPBAR-2, REQ-TOPBAR-3)', () => {
  // REQ-TOPBAR-1 — widgets presentes en la top-bar
  it('renderiza el Logo (svg role=img aria-label="Universo Aula")', () => {
    renderTopBar();
    expect(screen.getByRole('img', { name: 'Universo Aula' })).toBeInTheDocument();
  });

  it('renderiza el SpeedControl (botones de velocidad)', () => {
    renderTopBar();
    expect(screen.getByRole('button', { name: /pausar|reanudar/i })).toBeInTheDocument();
  });

  it('renderiza el DatePicker (botón data-testid="date-trigger")', () => {
    renderTopBar();
    // DatePicker cerrado muestra un botón con aria-label="Fecha" y data-testid="date-trigger"
    expect(screen.getByTestId('date-trigger')).toBeInTheDocument();
  });

  it('renderiza el LanguageSelector (select aria-label="Idioma")', () => {
    renderTopBar();
    expect(screen.getByRole('combobox', { name: /idioma/i })).toBeInTheDocument();
  });

  it('renderiza el LevelDropdown (select aria-label="Nivel pedagógico")', () => {
    renderTopBar();
    expect(screen.getByRole('combobox', { name: /nivel pedagógico/i })).toBeInTheDocument();
  });

  it('renderiza el RotationAxesToggle (botón mostrar/ocultar ejes)', () => {
    renderTopBar();
    expect(
      screen.getByRole('button', { name: /mostrar ejes|show axes|ocultar ejes|hide axes/i }),
    ).toBeInTheDocument();
  });

  // REQ-TOPBAR-3 — el contenedor tiene flex-wrap (ADR-E)
  it('el contenedor de la TopBar tiene clase flex-wrap', () => {
    const { container } = renderTopBar();
    // El div raíz de TopBar debe tener flex-wrap
    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper!.className).toMatch(/\bflex-wrap\b/);
  });

  // REQ-TOPBAR-2 — SpeedControl no tiene clase fixed en ningún nodo que renderice
  it('ningún nodo de la TopBar tiene clase fixed (REQ-TOPBAR-2)', () => {
    const { container } = renderTopBar();
    const fixedNodes = container.querySelectorAll('[class*="fixed"]');
    expect(fixedNodes.length).toBe(0);
  });

  // REQ-INV-5 — date-trigger es único en la TopBar
  it('date-trigger aparece exactamente una vez en el DOM de la TopBar', () => {
    renderTopBar();
    const triggers = screen.getAllByTestId('date-trigger');
    expect(triggers.length).toBe(1);
  });
});
