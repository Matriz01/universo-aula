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

  it('muestra el título principal de la aplicación', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('muestra el selector de idioma', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
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
});
