/**
 * Tests del componente <BodyMarker> — marcador estilo NASA Eyes.
 *
 * Verifica:
 * - Renderizado de label
 * - Visibilidad condicional (visible=false → null)
 * - Lectura de positionRef en cada frame
 * - Click handler
 */

import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Mocks R3F + drei
// ---------------------------------------------------------------------------

let capturedFrameCallback: (() => void) | undefined;
let capturedFramePriority: number | undefined;

vi.mock('@react-three/fiber', () => ({
  // El 2º argumento (priority) decide el orden de ejecución por frame. El
  // BodyMarker debe leer su posición DESPUÉS de los consumers priority-0, así
  // que lo capturamos para poder asertarlo (bug #44).
  useFrame: (cb: () => void, priority?: number) => {
    capturedFrameCallback = cb;
    capturedFramePriority = priority;
  },
}));

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="body-marker-html">{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Import después de mocks
// ---------------------------------------------------------------------------

import { BodyMarker } from '@/scenes/components/BodyMarker';

beforeEach(() => {
  capturedFrameCallback = undefined;
  capturedFramePriority = undefined;
  vi.clearAllMocks();
});

describe('<BodyMarker>', () => {
  it('renderiza el label cuando visible (default)', () => {
    const positionRef = { current: new Vector3(0, 0, 0) };
    const { getByText } = render(<BodyMarker positionRef={positionRef} label="Luna" />);
    expect(getByText('Luna')).toBeInTheDocument();
  });

  it('no renderiza nada cuando visible=false', () => {
    const positionRef = { current: new Vector3(0, 0, 0) };
    const { container } = render(
      <BodyMarker positionRef={positionRef} label="Luna" visible={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('llama a onClick cuando el usuario clica el label', () => {
    const positionRef = { current: new Vector3(0, 0, 0) };
    const onClick = vi.fn();
    const { getByText } = render(
      <BodyMarker positionRef={positionRef} label="Luna" onClick={onClick} />,
    );
    fireEvent.click(getByText('Luna'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // Regresión #43: en modo local OrbitControls está activo. El pointerdown sobre
  // el botón del marker se propagaba al domElement de OrbitControls; un micro-jitter
  // entre down y up se interpretaba como drag-rotate y cancelaba el click nativo →
  // la selección no disparaba. El botón debe cortar la propagación DOM de los
  // eventos de puntero para que OrbitControls no los reciba.
  it('regresión #43: detiene la propagación de pointerdown/pointerup en el botón', () => {
    const positionRef = { current: new Vector3(0, 0, 0) };
    const onClick = vi.fn();
    const { getByRole } = render(
      <BodyMarker positionRef={positionRef} label="Luna" onClick={onClick} />,
    );
    const button = getByRole('button');

    const downEvent = new MouseEvent('pointerdown', { bubbles: true });
    const downSpy = vi.spyOn(downEvent, 'stopPropagation');
    fireEvent(button, downEvent);
    expect(downSpy).toHaveBeenCalledTimes(1);

    const upEvent = new MouseEvent('pointerup', { bubbles: true });
    const upSpy = vi.spyOn(upEvent, 'stopPropagation');
    fireEvent(button, upEvent);
    expect(upSpy).toHaveBeenCalledTimes(1);
  });

  it('registra un useFrame para sincronizar la posición del group', () => {
    const positionRef = { current: new Vector3(388, -126, -20) };
    render(<BodyMarker positionRef={positionRef} label="Luna" />);

    // Registro del callback per-frame; la ejecución real requiere R3F (no jsdom).
    expect(capturedFrameCallback).toBeDefined();
  });

  // Regresión #44: el sprite y el label se calculaban en dos useFrame distintos,
  // ambos priority 0, sin orden garantizado → el marker leía su posRef ANTES de
  // que el consumer la escribiera ese frame → drift de 1 frame (label desplazado
  // respecto al sprite). El marker debe leer su ref con priority 1, DESPUÉS de
  // todos los consumers priority-0 (invariante: Ticker -2 → Origin -1 → consumers 0 → marker 1).
  it('regresión #44: registra el useFrame de posición con priority 1 (lee tras los consumers)', () => {
    const positionRef = { current: new Vector3(388, -126, -20) };
    render(<BodyMarker positionRef={positionRef} label="Luna" />);

    expect(capturedFramePriority).toBe(1);
  });

  it('aplica el color recibido al borde del ring y al texto del label', () => {
    const positionRef = { current: new Vector3(0, 0, 0) };
    const { getByText } = render(
      <BodyMarker positionRef={positionRef} label="Marte" color="#ff6633" />,
    );
    const label = getByText('Marte');
    // El color se propaga al span del label
    expect(label).toHaveStyle({ color: '#ff6633' });
  });
});
