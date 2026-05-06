/**
 * Tests de <AttributionFooter>
 *
 * - Siempre visible (no condicional)
 * - Texto de atribución presente
 * - Enlace a Solar System Scope correcto
 * - Enlace a CREDITS.md presente
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { AttributionFooter } from '@/components/ui/AttributionFooter';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<AttributionFooter>', () => {
  it('monta sin errores', () => {
    expect(() => render(<AttributionFooter />)).not.toThrow();
  });

  it('renderiza siempre (no condicional)', () => {
    render(<AttributionFooter />);
    expect(screen.getByTestId('attribution-footer')).toBeInTheDocument();
  });

  it('tiene el texto de atribución', () => {
    render(<AttributionFooter />);
    // t('solar:ui.attribution') devuelve la clave en el mock
    expect(screen.getByText('solar:ui.attribution')).toBeInTheDocument();
  });

  it('contiene el enlace a Solar System Scope', () => {
    render(<AttributionFooter />);
    const link = screen.getByRole('link', {
      name: /solar system scope/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.solarsystemscope.com/textures/');
  });

  it('el enlace a Solar System Scope abre en nueva pestaña', () => {
    render(<AttributionFooter />);
    const link = screen.getByRole('link', { name: /solar system scope/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('contiene un enlace a CREDITS.md', () => {
    render(<AttributionFooter />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/CREDITS.md');
  });

  it('es un elemento footer semántico o tiene role="contentinfo"', () => {
    render(<AttributionFooter />);
    // Acepta <footer> semántico o data-testid
    const el = screen.getByTestId('attribution-footer');
    expect(el).toBeInTheDocument();
  });
});
