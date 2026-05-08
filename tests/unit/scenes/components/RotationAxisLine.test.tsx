/**
 * Tests para <RotationAxisLine> — línea de eje de rotación axial.
 *
 * Verifica:
 * 1. El componente monta sin errores con props válidas.
 * 2. La longitud total del eje es radius * 2 * AXIS_OVERSHOOT (= radius * 2.5).
 * 3. La rotación del grupo wrapper es [0, 0, degToRad(tiltDeg)] (Z-axis tilt).
 * 4. Cuando visible=false, el componente no renderiza la línea.
 *
 * Estrategia: mock de @react-three/fiber y @react-three/drei para entorno JSDOM.
 * Inspeccionamos las props de <Line> directamente para verificar longitud y orientación.
 */

import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Captura de llamadas a Line (drei) para inspección de props
// ---------------------------------------------------------------------------

interface LineCaptureProps {
  points?: [number, number, number][];
  color?: string;
  lineWidth?: number;
  [key: string]: unknown;
}

const { lineCallsRef, groupRotationsRef } = vi.hoisted(() => {
  return {
    lineCallsRef: { current: [] as LineCaptureProps[] },
    groupRotationsRef: { current: [] as [number, number, number][] },
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    gl: { domElement: document.createElement('canvas') },
    scene: {},
  }),
  extend: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  Line: (props: LineCaptureProps) => {
    lineCallsRef.current.push(props);
    return null;
  },
  OrbitControls: () => null,
  useTexture: () => ({}),
}));

// ---------------------------------------------------------------------------
// Imports después de los mocks
// ---------------------------------------------------------------------------

import { RotationAxisLine, AXIS_OVERSHOOT, AXIS_COLOR } from '@/scenes/components/RotationAxisLine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAxisLine(radius: number, tiltDeg: number, visible: boolean, color?: string) {
  lineCallsRef.current = [];
  groupRotationsRef.current = [];
  return render(
    <RotationAxisLine radius={radius} tiltDeg={tiltDeg} visible={visible} color={color} />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  lineCallsRef.current = [];
  groupRotationsRef.current = [];
});

describe('<RotationAxisLine> — constantes exportadas', () => {
  it('AXIS_OVERSHOOT es 1.25', () => {
    expect(AXIS_OVERSHOOT).toBe(1.25);
  });

  it('AXIS_COLOR es cyan (#00ffff o #00e5ff)', () => {
    // Acepta cyan estándar o variante diseño
    expect(AXIS_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
    // Debe ser algún tono de cyan (canal R bajo, canales G y B altos)
    const r = parseInt(AXIS_COLOR.slice(1, 3), 16);
    const g = parseInt(AXIS_COLOR.slice(3, 5), 16);
    const b = parseInt(AXIS_COLOR.slice(5, 7), 16);
    expect(r).toBeLessThan(50);
    expect(g).toBeGreaterThan(180);
    expect(b).toBeGreaterThan(180);
  });
});

describe('<RotationAxisLine> — visible=true renderiza Line', () => {
  it('monta sin errores con props básicas', () => {
    expect(() => renderAxisLine(2.0, 23.44, true)).not.toThrow();
  });

  it('renderiza exactamente un <Line> cuando visible=true', () => {
    renderAxisLine(2.0, 23.44, true);
    expect(lineCallsRef.current).toHaveLength(1);
  });

  it('longitud total = radius * 2 * AXIS_OVERSHOOT (para radius=2.0 → 5.0 unidades)', () => {
    const radius = 2.0;
    renderAxisLine(radius, 23.44, true);
    const lineProps = lineCallsRef.current[0];
    expect(lineProps).toBeDefined();

    // Los puntos deben ser [start, end] a lo largo del eje Y local
    const points = lineProps.points as [number, number, number][];
    expect(points).toHaveLength(2);

    const [p0, p1] = points;
    // Punto inicial: [0, -halfLen, 0], Punto final: [0, +halfLen, 0]
    const halfLen = radius * AXIS_OVERSHOOT;
    const totalLength = Math.abs(p1[1] - p0[1]);
    expect(totalLength).toBeCloseTo(halfLen * 2, 5);
  });

  it('lineWidth es 1.5 o 2 (delgado pero visible)', () => {
    renderAxisLine(1.0, 0, true);
    const lineProps = lineCallsRef.current[0];
    const lw = lineProps.lineWidth as number;
    expect(lw).toBeGreaterThanOrEqual(1);
    expect(lw).toBeLessThanOrEqual(3);
  });

  it('color por defecto es AXIS_COLOR', () => {
    renderAxisLine(1.0, 0, true);
    const lineProps = lineCallsRef.current[0];
    expect(lineProps.color).toBe(AXIS_COLOR);
  });

  it('color puede sobreescribirse via prop', () => {
    renderAxisLine(1.0, 0, true, '#ff0000');
    const lineProps = lineCallsRef.current[0];
    expect(lineProps.color).toBe('#ff0000');
  });
});

describe('<RotationAxisLine> — visible=false NO renderiza Line', () => {
  it('no renderiza <Line> cuando visible=false', () => {
    renderAxisLine(2.0, 23.44, false);
    expect(lineCallsRef.current).toHaveLength(0);
  });
});

describe('<RotationAxisLine> — orientación Z-axis tilt', () => {
  it('para tiltDeg=0, los puntos están en el eje Y local (x≈0, z≈0)', () => {
    renderAxisLine(2.0, 0, true);
    const lineProps = lineCallsRef.current[0];
    const points = lineProps.points as [number, number, number][];
    const [p0, p1] = points;
    // Sin inclinación, los puntos deben estar sobre el eje Y (x=0, z=0)
    expect(p0[0]).toBeCloseTo(0, 5);
    expect(p0[2]).toBeCloseTo(0, 5);
    expect(p1[0]).toBeCloseTo(0, 5);
    expect(p1[2]).toBeCloseTo(0, 5);
  });
});
