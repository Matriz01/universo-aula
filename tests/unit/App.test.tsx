import { render, screen, fireEvent } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { App } from '@/app/App';
import { useAppStore } from '@/store/useAppStore';

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
});

// ---------------------------------------------------------------------------
// REQ-AXIS-VIS-5 — HUD toggle de ejes de rotación axial (REQ-I18N-3 incluido)
// ---------------------------------------------------------------------------

describe('App — botón HUD de ejes de rotación axial (REQ-AXIS-VIS-5)', () => {
  beforeEach(() => {
    // Resetear el store al estado inicial antes de cada test
    useAppStore.setState({ showRotationAxes: false });
  });

  it('el botón "Mostrar ejes" está presente en el HUD (showRotationAxes=false)', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    // El botón tiene aria-label = t('hud.showAxes') cuando los ejes están ocultos.
    // react-i18next en tests usa la key por defecto, pero Providers incluye i18n real.
    // Buscamos por el texto renderizado O por aria-label parcial.
    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    expect(button).toBeInTheDocument();
  });

  it('un click en el botón activa showRotationAxes en el store', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(useAppStore.getState().showRotationAxes).toBe(false);

    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    fireEvent.click(button);

    expect(useAppStore.getState().showRotationAxes).toBe(true);
  });

  it('dos clicks alternan showRotationAxes false → true → false', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(useAppStore.getState().showRotationAxes).toBe(false);

    // Primer click: false → true
    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    fireEvent.click(button);
    expect(useAppStore.getState().showRotationAxes).toBe(true);

    // Segundo click: true → false.
    // El botón ahora tiene aria-label "Ocultar ejes" — buscamos de nuevo.
    const hideButton = screen.getByRole('button', { name: /ocultar ejes|hide axes/i });
    fireEvent.click(hideButton);
    expect(useAppStore.getState().showRotationAxes).toBe(false);
  });

  it('cuando showRotationAxes=false el botón usa t("hud.showAxes") como aria-label', () => {
    useAppStore.setState({ showRotationAxes: false });
    render(
      <Providers>
        <App />
      </Providers>,
    );
    // El aria-label debe ser la traducción de hud.showAxes, no un literal hardcodeado.
    // En ES (locale por defecto) = "Mostrar ejes".
    const button = screen.getByRole('button', { name: /mostrar ejes/i });
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/mostrar ejes/i);
  });

  it('cuando showRotationAxes=true el botón usa t("hud.hideAxes") como aria-label', () => {
    useAppStore.setState({ showRotationAxes: true });
    render(
      <Providers>
        <App />
      </Providers>,
    );
    const button = screen.getByRole('button', { name: /ocultar ejes/i });
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/ocultar ejes/i);
  });
});
