import { render, screen } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { App } from '@/app/App';

// R3F no puede renderizarse en jsdom — mockeamos Canvas para que pase children
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

// Mock de Drei — incluye todos los exports que se usan en App + hijos
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stars: () => null,
  useProgress: () => ({ progress: 100 }),
  useTexture: vi.fn().mockReturnValue({}),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
}));

// Mock de SolarSystemScene para evitar cargar Three.js completo en tests de App
vi.mock('@/scenes/SolarSystemScene', () => ({
  SolarSystemScene: () => <div data-testid="solar-system-scene" />,
}));

// Mocks adicionales que SolarSystemScene usa internamente
vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: () => ({ data: null, loading: true, error: null }),
}));

vi.mock('@/scenes/hooks/useGpuCapability', () => ({
  useGpuCapability: () => 'high',
}));

describe('App', () => {
  it('monta el componente raíz sin errores', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(document.body).toBeTruthy();
  });

  it('monta la escena 3D (SolarSystemScene)', async () => {
    const { findByTestId } = render(
      <Providers>
        <App />
      </Providers>,
    );
    // SolarSystemScene está lazy-loaded — esperamos el testid del mock
    const scene = await findByTestId('solar-system-scene');
    expect(scene).toBeInTheDocument();
  });

  it('muestra el footer con los enlaces legales', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/LICENSE');
    expect(hrefs).toContain('/CREDITS.md');
  });

  // T4.1 — Structural layout tests (RED → GREEN en T4.2)
  describe('layout HUD', () => {
    it('renderiza el Logo en el árbol DOM', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      // Logo renderiza un SVG con role="img" y aria-label="Universo Aula"
      expect(screen.getByRole('img', { name: 'Universo Aula' })).toBeInTheDocument();
    });

    it('renderiza el LanguageSelector (select aria-label="Idioma")', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      expect(screen.getByRole('combobox', { name: /idioma/i })).toBeInTheDocument();
    });

    it('renderiza el LevelDropdown (select aria-label="Nivel pedagógico")', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      expect(screen.getByRole('combobox', { name: /nivel pedagógico/i })).toBeInTheDocument();
    });

    it('renderiza el DatePicker (botón de fecha)', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      // DatePicker en modo cerrado muestra un botón con aria-label="Fecha"
      expect(screen.getByRole('button', { name: /fecha/i })).toBeInTheDocument();
    });

    it('renderiza el CreditsButton', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      // CreditsButton tiene aria-label="Créditos"
      expect(screen.getByRole('button', { name: /créditos/i })).toBeInTheDocument();
    });

    it('NO hay h1 con tagline en el nuevo layout', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    it('NO hay LevelSelector (3 botones de nivel) en el nuevo layout', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      // LevelSelector usaba data-testid="level-selector"
      expect(screen.queryByTestId('level-selector')).not.toBeInTheDocument();
    });

    it('NO hay DateControl en bottom-left (reemplazado por DatePicker)', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      // DateControl mostraba data-testid="date-control" o similar; ya no debe estar
      expect(screen.queryByTestId('date-control')).not.toBeInTheDocument();
    });
  });

  // CockpitFrame PR1 — asserts estructurales de integración
  // (REQ-GRID-1, REQ-TOPBAR-1, REQ-INV-5)
  describe('CockpitFrame PR1 — integración estructural', () => {
    it('el frame cockpit-frame está montado', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      expect(screen.getByTestId('cockpit-frame')).toBeInTheDocument();
    });

    it('existe la celda cockpit-topbar-cell', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      expect(screen.getByTestId('cockpit-topbar-cell')).toBeInTheDocument();
    });

    it('la celda canvas tiene aislamiento de stacking context (ADR-B)', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      const canvasCell = screen.getByTestId('cockpit-canvas-cell');
      expect(canvasCell.className).toMatch(/\bisolate\b/);
      expect(canvasCell.className).toMatch(/\brelative\b/);
      expect(canvasCell.className).toMatch(/\bz-0\b/);
    });

    it('LanguageSelector es descendiente de cockpit-topbar-cell', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      const topbarCell = screen.getByTestId('cockpit-topbar-cell');
      const langSelect = screen.getByRole('combobox', { name: /idioma/i });
      expect(topbarCell.contains(langSelect)).toBe(true);
    });

    it('LevelDropdown es descendiente de cockpit-topbar-cell', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      const topbarCell = screen.getByTestId('cockpit-topbar-cell');
      const levelSelect = screen.getByRole('combobox', { name: /nivel pedagógico/i });
      expect(topbarCell.contains(levelSelect)).toBe(true);
    });

    it('DatePicker es descendiente de cockpit-topbar-cell', () => {
      render(
        <Providers>
          <App />
        </Providers>,
      );
      const topbarCell = screen.getByTestId('cockpit-topbar-cell');
      const dateTrigger = screen.getByTestId('date-trigger');
      expect(topbarCell.contains(dateTrigger)).toBe(true);
    });
  });
});
