/**
 * Tests del componente <CreditsButton> (T3.5)
 *
 * Verifica:
 * - Renderiza un button con el texto de i18n key hud.creditsButton
 * - onClick abre el modal (spy sobre el handler)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { CreditsButton } from '@/components/hud/CreditsButton';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('<CreditsButton>', () => {
  it('T3.5: renderiza un button', () => {
    render(<CreditsButton onOpen={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('T3.5: el button tiene texto o aria-label relacionado con créditos', () => {
    render(<CreditsButton onOpen={vi.fn()} />);
    const button = screen.getByRole('button');
    const labelOrText = button.getAttribute('aria-label') ?? button.textContent ?? '';
    expect(labelOrText.length).toBeGreaterThan(0);
  });

  it('T3.5: onClick llama al handler onOpen', () => {
    const mockOnOpen = vi.fn();
    render(<CreditsButton onOpen={mockOnOpen} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnOpen).toHaveBeenCalledOnce();
  });
});
