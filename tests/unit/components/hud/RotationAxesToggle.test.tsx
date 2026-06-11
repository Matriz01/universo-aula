/**
 * RotationAxesToggle — tests unitarios
 *
 * REQs cubiertos: REQ-TOPBAR-1 (extracción de App inline JSX)
 * Tests extraídos del describe "App — botón HUD de ejes de rotación axial"
 * de App.test.tsx (REQ-AXIS-VIS-5).
 *
 * Render directo del componente, sin necesidad de montar toda la App.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Providers } from '@/app/providers';
import { RotationAxesToggle } from '@/components/hud/RotationAxesToggle';
import { useAppStore } from '@/store/useAppStore';

function renderToggle() {
  return render(
    <Providers>
      <RotationAxesToggle />
    </Providers>,
  );
}

// REQ-AXIS-VIS-5 — describe movido de App.test.tsx
describe('RotationAxesToggle — botón HUD de ejes de rotación axial (REQ-AXIS-VIS-5)', () => {
  beforeEach(() => {
    useAppStore.setState({ showRotationAxes: false });
  });

  it('el botón "Mostrar ejes" está presente (showRotationAxes=false)', () => {
    renderToggle();
    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    expect(button).toBeInTheDocument();
  });

  it('un click en el botón activa showRotationAxes en el store', () => {
    renderToggle();
    expect(useAppStore.getState().showRotationAxes).toBe(false);

    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    fireEvent.click(button);

    expect(useAppStore.getState().showRotationAxes).toBe(true);
  });

  it('dos clicks alternan showRotationAxes false → true → false', () => {
    renderToggle();
    expect(useAppStore.getState().showRotationAxes).toBe(false);

    const button = screen.getByRole('button', { name: /mostrar ejes|show axes/i });
    fireEvent.click(button);
    expect(useAppStore.getState().showRotationAxes).toBe(true);

    const hideButton = screen.getByRole('button', { name: /ocultar ejes|hide axes/i });
    fireEvent.click(hideButton);
    expect(useAppStore.getState().showRotationAxes).toBe(false);
  });

  it('cuando showRotationAxes=false el botón usa t("hud.showAxes") como aria-label', () => {
    useAppStore.setState({ showRotationAxes: false });
    renderToggle();
    const button = screen.getByRole('button', { name: /mostrar ejes/i });
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/mostrar ejes/i);
  });

  it('cuando showRotationAxes=true el botón usa t("hud.hideAxes") como aria-label', () => {
    useAppStore.setState({ showRotationAxes: true });
    renderToggle();
    const button = screen.getByRole('button', { name: /ocultar ejes/i });
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/ocultar ejes/i);
  });
});
