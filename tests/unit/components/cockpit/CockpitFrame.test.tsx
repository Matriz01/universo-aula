/**
 * CockpitFrame — tests unitarios
 *
 * REQs cubiertos: REQ-GRID-1, REQ-GRID-3, REQ-GRID-4, REQ-INV-2, REQ-INV-5
 *
 * Nota: jsdom no calcula layout, por lo que aseveramos la ESTRUCTURA que
 * garantiza el comportamiento correcto en el navegador:
 *   - Clases de grid correctas en el contenedor raíz
 *   - Celda canvas con las clases de stacking-context obligatorias (ADR-B)
 *   - Orden DOM correcto (topbar antes que canvas)
 *   - Sin pointer-events filtrados sobre children
 *   - Sin nodos con clase "fixed" dentro del frame
 */

import { render, screen, within } from '@testing-library/react';
import { CockpitFrame } from '@/components/cockpit/CockpitFrame';

describe('CockpitFrame — grid structure and stacking context (REQ-GRID-1, REQ-GRID-3, REQ-GRID-4, REQ-INV-2)', () => {
  function renderFrame() {
    return render(
      <CockpitFrame topBar={<div data-testid="slot-topbar">TopBar</div>}>
        <div data-testid="slot-canvas">Canvas</div>
      </CockpitFrame>,
    );
  }

  // REQ-GRID-1 — el contenedor raíz lleva clase grid
  it('el contenedor raíz tiene data-testid="cockpit-frame" y clase grid', () => {
    renderFrame();
    const frame = screen.getByTestId('cockpit-frame');
    expect(frame).toBeInTheDocument();
    expect(frame.className).toMatch(/\bgrid\b/);
  });

  // REQ-GRID-1 — grid-rows con al menos 2 filas (PR1: top-bar + canvas)
  it('el contenedor raíz tiene grid-rows con 2 filas para PR1', () => {
    renderFrame();
    const frame = screen.getByTestId('cockpit-frame');
    // PR1 usa grid-rows-[minmax(48px,auto)_minmax(0,1fr)]
    expect(frame.className).toContain('minmax(48px,auto)');
    expect(frame.className).toContain('minmax(0,1fr)');
  });

  // Celda topbar — data-testid correcto
  it('existe la celda data-testid="cockpit-topbar-cell"', () => {
    renderFrame();
    expect(screen.getByTestId('cockpit-topbar-cell')).toBeInTheDocument();
  });

  // El slot topBar se renderiza dentro de cockpit-topbar-cell
  it('el slot topBar se renderiza dentro de cockpit-topbar-cell', () => {
    renderFrame();
    const topbarCell = screen.getByTestId('cockpit-topbar-cell');
    expect(within(topbarCell).getByTestId('slot-topbar')).toBeInTheDocument();
  });

  // ADR-B — celda canvas con las 5 clases de stacking context obligatorias
  it('la celda canvas tiene las clases de stacking context obligatorias (ADR-B)', () => {
    renderFrame();
    const canvasCell = screen.getByTestId('cockpit-canvas-cell');
    const cls = canvasCell.className;
    expect(cls).toMatch(/\brelative\b/);
    expect(cls).toMatch(/\bisolate\b/);
    expect(cls).toMatch(/\bz-0\b/);
    expect(cls).toMatch(/\bmin-h-0\b/);
    expect(cls).toMatch(/\bmin-w-0\b/);
  });

  // Celda canvas también lleva overflow-hidden
  it('la celda canvas lleva overflow-hidden', () => {
    renderFrame();
    const canvasCell = screen.getByTestId('cockpit-canvas-cell');
    expect(canvasCell.className).toMatch(/\boverflow-hidden\b/);
  });

  // El slot children se renderiza dentro de cockpit-canvas-cell
  it('los children se renderizan dentro de cockpit-canvas-cell', () => {
    renderFrame();
    const canvasCell = screen.getByTestId('cockpit-canvas-cell');
    expect(within(canvasCell).getByTestId('slot-canvas')).toBeInTheDocument();
  });

  // REQ-GRID-1 — orden DOM: topbar-cell PRECEDE a canvas-cell (tab order + accesibilidad)
  it('topbar-cell precede a canvas-cell en el orden DOM', () => {
    renderFrame();
    const frame = screen.getByTestId('cockpit-frame');
    const cells = Array.from(frame.children);
    const topbarIdx = cells.findIndex(
      (el) => el.getAttribute('data-testid') === 'cockpit-topbar-cell',
    );
    const canvasIdx = cells.findIndex(
      (el) => el.getAttribute('data-testid') === 'cockpit-canvas-cell',
    );
    expect(topbarIdx).toBeGreaterThanOrEqual(0);
    expect(canvasIdx).toBeGreaterThanOrEqual(0);
    expect(topbarIdx).toBeLessThan(canvasIdx);
  });

  // REQ-GRID-4 — ningún ancestro de children lleva pointer-events-none
  // (la celda canvas NO debe bloquear eventos)
  it('la celda canvas no tiene pointer-events-none', () => {
    renderFrame();
    const canvasCell = screen.getByTestId('cockpit-canvas-cell');
    expect(canvasCell.className).not.toMatch(/\bpointer-events-none\b/);
  });

  // REQ-INV-2 / REQ-INV-5 — 0 nodos con clase "fixed" dentro del frame
  it('ningún nodo dentro del frame tiene clase fixed', () => {
    const { container } = renderFrame();
    const fixedNodes = container.querySelectorAll('[class*="fixed"]');
    expect(fixedNodes.length).toBe(0);
  });
});
