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
  // El 2º argumento (priority) decide el orden de ejecución por frame Y la
  // semántica de render: en R3F cualquier suscripción con priority > 0 activa
  // el "render takeover" (R3F deja de llamar gl.render automáticamente). Lo
  // capturamos para asertar que el BodyMarker NUNCA usa priority > 0 (C1).
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

  // Regresión C1 (render takeover): el fix original de #44 puso este useFrame en
  // priority 1, pero en @react-three/fiber CUALQUIER suscripción con priority > 0
  // tiene semántica de render takeover — R3F incrementa internal.priority y deja
  // de llamar gl.render automáticamente (ver fiber: `internal.priority =
  // internal.priority + (priority > 0 ? 1 : 0)` y `if (!state.internal.priority &&
  // state.gl.render) state.gl.render(...)`). El único renderizador manual del
  // proyecto es el EffectComposer de postprocessing, que solo se monta con
  // gpu === 'high' → en GPU mid/low el canvas quedaba CONGELADO (0 draw calls)
  // al entrar en modo local. El fix de #44 se conserva moviendo los ESCRITORES
  // de posición a priority -0.5; el marker vuelve a ser lector en priority 0.
  // Invariante: Ticker (-2) → Origin (-1) → writers (-0.5) → readers (0) → composer (1).
  it('regresión C1: el useFrame de posición NO usa priority > 0 (evita render takeover)', () => {
    const positionRef = { current: new Vector3(388, -126, -20) };
    render(<BodyMarker positionRef={positionRef} label="Luna" />);

    // priority 0 explícito o undefined (default 0) — nunca > 0
    expect(capturedFramePriority ?? 0).toBe(0);
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
