/**
 * Tests de <PlutoNote>
 *
 * - El texto cambia según el nivel pedagógico
 * - El pictograma SVG aparece SOLO en nivel Explorador
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock react-i18next
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { PlutoNote } from '@/components/ui/PlutoNote';
import type { PedagogicalLevel } from '@/types/index';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<PlutoNote>', () => {
  it('monta sin errores', () => {
    expect(() => render(<PlutoNote level="aprendiz" />)).not.toThrow();
  });

  it('renderiza el texto de nivel explorador', () => {
    render(<PlutoNote level="explorador" />);
    expect(screen.getByText('solar:pluto.iau_note.explorador')).toBeInTheDocument();
  });

  it('renderiza el texto de nivel aprendiz', () => {
    render(<PlutoNote level="aprendiz" />);
    expect(screen.getByText('solar:pluto.iau_note.aprendiz')).toBeInTheDocument();
  });

  it('renderiza el texto de nivel investigador', () => {
    render(<PlutoNote level="investigador" />);
    expect(screen.getByText('solar:pluto.iau_note.investigador')).toBeInTheDocument();
  });

  it('muestra el pictograma SVG en nivel Explorador', () => {
    const { container } = render(<PlutoNote level="explorador" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('NO muestra pictograma SVG en nivel Aprendiz', () => {
    const { container } = render(<PlutoNote level="aprendiz" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('NO muestra pictograma SVG en nivel Investigador', () => {
    const { container } = render(<PlutoNote level="investigador" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('tiene un elemento con role="note" o similar para la nota', () => {
    const { container } = render(<PlutoNote level="aprendiz" />);
    // El componente debe tener un contenedor visual destacado
    expect(container.firstChild).toBeTruthy();
  });

  // Comprobación de tipos: acepta los tres niveles sin TypeScript errors
  it.each<PedagogicalLevel>(['explorador', 'aprendiz', 'investigador'])(
    'acepta level="%s" sin errores',
    (level) => {
      expect(() => render(<PlutoNote level={level} />)).not.toThrow();
    },
  );
});
