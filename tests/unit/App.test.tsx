import { render, screen } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { App } from '@/app/App';

// R3F no puede renderizarse en jsdom — mockeamos Canvas para que pase children
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
}));

// OrbitControls no renderiza nada relevante — noop
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
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

  it('monta el canvas 3D', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    );
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
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
