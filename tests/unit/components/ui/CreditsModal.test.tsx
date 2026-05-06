/**
 * Tests de <CreditsModal>
 *
 * - Se abre al hacer click en el botón trigger
 * - Se cierra con el botón de cerrar
 * - Se cierra con Escape
 * - Tiene los atributos de accesibilidad correctos (role, aria-modal, aria-labelledby)
 * - Contiene la información de créditos (texturas, datos, licencias)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

import { CreditsModal } from '@/components/ui/CreditsModal';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('<CreditsModal>', () => {
  it('monta sin errores', () => {
    expect(() => render(<CreditsModal />)).not.toThrow();
  });

  it('el modal está cerrado inicialmente (no visible)', () => {
    render(<CreditsModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el botón trigger está siempre visible', () => {
    render(<CreditsModal />);
    // Botón de información "i" o similar
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it('click en el botón trigger abre el modal', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('el modal tiene aria-modal="true"', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('el modal tiene aria-labelledby apuntando al título', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl).toBeInTheDocument();
  });

  it('click en el botón cerrar cierra el modal', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /cerrar|close/i });
    fireEvent.click(closeButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape cierra el modal', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el modal contiene enlace a Solar System Scope', () => {
    render(<CreditsModal />);
    const trigger = screen.getByRole('button', {
      name: /créditos|credits|información|information/i,
    });
    fireEvent.click(trigger);

    const link = screen.getByRole('link', { name: /solar system scope/i });
    expect(link).toHaveAttribute('href', 'https://www.solarsystemscope.com/textures/');
  });

  it('el modal menciona la licencia CC BY 4.0', () => {
    render(<CreditsModal />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /créditos|credits|información|information/i,
      }),
    );
    expect(screen.getByText(/CC BY 4\.0/i)).toBeInTheDocument();
  });

  it('el modal menciona NASA', () => {
    render(<CreditsModal />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /créditos|credits|información|information/i,
      }),
    );
    const nasaItems = screen.getAllByText(/NASA/i);
    expect(nasaItems.length).toBeGreaterThan(0);
  });

  it('el modal menciona la resolución IAU 2006', () => {
    render(<CreditsModal />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /créditos|credits|información|information/i,
      }),
    );
    const iauItems = screen.getAllByText(/IAU.*2006|2006.*IAU/i);
    expect(iauItems.length).toBeGreaterThan(0);
  });

  it('el modal menciona AGPL-3.0', () => {
    render(<CreditsModal />);
    fireEvent.click(
      screen.getByRole('button', {
        name: /créditos|credits|información|information/i,
      }),
    );
    expect(screen.getByText(/AGPL-3\.0/i)).toBeInTheDocument();
  });
});
