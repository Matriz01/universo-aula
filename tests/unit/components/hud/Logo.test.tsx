/**
 * Tests del componente <Logo> (T3.1)
 *
 * Verifica:
 * - Renderiza un elemento con role="img" y aria-label="Universo Aula"
 * - El wrapper tiene clase pointer-events-none
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Logo } from '@/components/hud/Logo';

describe('<Logo>', () => {
  it('T3.1: renderiza un elemento con role="img"', () => {
    const { getByRole } = render(<Logo />);
    const img = getByRole('img');
    expect(img).toBeDefined();
  });

  it('T3.1: tiene aria-label="Universo Aula"', () => {
    const { getByRole } = render(<Logo />);
    const img = getByRole('img', { name: 'Universo Aula' });
    expect(img).toBeDefined();
  });

  it('T3.1: el contenedor tiene clase pointer-events-none', () => {
    const { container } = render(<Logo />);
    // El elemento raíz o un wrapper debe tener pointer-events-none
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('pointer-events-none');
  });
});
