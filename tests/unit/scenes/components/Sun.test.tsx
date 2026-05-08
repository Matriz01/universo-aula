/**
 * Tests del componente <Sun> — verifica el comportamiento según
 * gpuCapability y prefersReducedMotion.
 *
 * Estrategia: mock de @react-three/fiber (Canvas, useFrame, useThree)
 * igual que en App.test.tsx. Montamos el componente y verificamos las props
 * del material resultante mediante mocks tipados de ShaderMaterial.
 *
 * Los mocks de three usan vi.hoisted para evitar el problema de temporal
 * dead zone (vi.mock se hoistea antes que const/let declarations).
 */

import { render } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Tipos para los mocks de materiales
// ---------------------------------------------------------------------------

interface MockUniform<T = unknown> {
  value: T;
}

interface MockShaderMaterialInstance {
  type: 'ShaderMaterial';
  uniforms: Record<string, MockUniform>;
  vertexShader: string;
  fragmentShader: string;
}

interface MockMeshStandardMaterialInstance {
  type: 'MeshStandardMaterial';
}

type MockMaterialInstance = MockShaderMaterialInstance | MockMeshStandardMaterialInstance;

interface MockMaterialRef {
  current: MockMaterialInstance | null;
}

// ---------------------------------------------------------------------------
// Hoisted mocks — deben declararse ANTES de vi.mock (vi.hoisted se hoistea junto a vi.mock)
// ---------------------------------------------------------------------------

const { mockShaderMaterialRef, shaderMaterialSpy, meshStandardMaterialSpy } = vi.hoisted(() => {
  const ref: MockMaterialRef = { current: null };

  const shaderSpy = vi.fn().mockImplementation(function (
    this: MockShaderMaterialInstance,
    opts?: {
      uniforms?: Record<string, MockUniform>;
      vertexShader?: string;
      fragmentShader?: string;
    },
  ) {
    this.type = 'ShaderMaterial';
    this.uniforms = opts?.uniforms ?? {};
    this.vertexShader = opts?.vertexShader ?? '';
    this.fragmentShader = opts?.fragmentShader ?? '';
    ref.current = this;
  });

  const meshStdSpy = vi.fn().mockImplementation(function (this: MockMeshStandardMaterialInstance) {
    this.type = 'MeshStandardMaterial';
    ref.current = this;
  });

  return {
    mockShaderMaterialRef: ref,
    shaderMaterialSpy: shaderSpy,
    meshStandardMaterialSpy: meshStdSpy,
  };
});

// ---------------------------------------------------------------------------
// Mock de @react-three/fiber — patrón establecido en App.test.tsx
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

// ---------------------------------------------------------------------------
// Mock de @react-three/drei
// ---------------------------------------------------------------------------

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  useTexture: () => ({}),
}));

// ---------------------------------------------------------------------------
// Mock de los shaders (importados con ?raw en el componente)
// ---------------------------------------------------------------------------

vi.mock('@/scenes/hooks/usePlanetsData', () => ({
  usePlanetsData: vi.fn(() => ({ data: null })),
}));

vi.mock('@/scenes/shaders/sun.vert?raw', () => ({
  default: '// vertex shader mock',
}));

vi.mock('@/scenes/shaders/sun.frag?raw', () => ({
  default: '// fragment shader mock full',
}));

vi.mock('@/scenes/shaders/sun.lite.frag?raw', () => ({
  default: '// fragment shader mock lite',
}));

// ---------------------------------------------------------------------------
// Mock de three — ShaderMaterial y MeshStandardMaterial para inspección
// ---------------------------------------------------------------------------

vi.mock('three', async (importOriginal) => {
  type ThreeModule = {
    ShaderMaterial: unknown;
    MeshStandardMaterial: unknown;
    [k: string]: unknown;
  };
  const actual = await importOriginal<ThreeModule>();
  return {
    ...actual,
    ShaderMaterial: shaderMaterialSpy,
    MeshStandardMaterial: meshStandardMaterialSpy,
  };
});

// ---------------------------------------------------------------------------
// Import del componente DESPUÉS de los mocks
// ---------------------------------------------------------------------------

import { Sun } from '@/scenes/components/Sun';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getShaderMat(): MockShaderMaterialInstance {
  const mat = mockShaderMaterialRef.current;
  if (!mat || mat.type !== 'ShaderMaterial') {
    throw new Error('Expected ShaderMaterial but got: ' + String(mat?.type));
  }
  return mat;
}

function getMeshStdMat(): MockMeshStandardMaterialInstance {
  const mat = mockShaderMaterialRef.current;
  if (!mat || mat.type !== 'MeshStandardMaterial') {
    throw new Error('Expected MeshStandardMaterial but got: ' + String(mat?.type));
  }
  return mat;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockShaderMaterialRef.current = null;
});

describe('<Sun> — variante según gpuCapability', () => {
  it('con capability="high" monta con ShaderMaterial y sunspots habilitados', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="high" reducedMotion={false} />
      </div>,
    );
    expect(shaderMaterialSpy).toHaveBeenCalled();
    const mat = getShaderMat();
    expect(mat.type).toBe('ShaderMaterial');
    expect(mat.uniforms['uSunspotsEnabled']?.value).toBe(true);
  });

  it('con capability="mid" monta con ShaderMaterial sin sunspots', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    expect(shaderMaterialSpy).toHaveBeenCalled();
    const mat = getShaderMat();
    expect(mat.type).toBe('ShaderMaterial');
    expect(mat.uniforms['uSunspotsEnabled']?.value).toBe(false);
  });

  it('con capability="low" monta con ShaderMaterial lite (fragmentShader contiene "lite")', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="low" reducedMotion={false} />
      </div>,
    );
    expect(shaderMaterialSpy).toHaveBeenCalled();
    const mat = getShaderMat();
    expect(mat.type).toBe('ShaderMaterial');
    expect(mat.fragmentShader).toContain('lite');
  });

  it('con capability="fallback" monta con MeshStandardMaterial (textura procedural)', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="fallback" reducedMotion={false} />
      </div>,
    );
    expect(meshStandardMaterialSpy).toHaveBeenCalled();
    const mat = getMeshStdMat();
    expect(mat.type).toBe('MeshStandardMaterial');
  });
});

describe('<Sun> — reducedMotion reduce uFlowSpeed', () => {
  it('con reducedMotion=false, uFlowSpeed es el valor nominal (0.20)', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="high" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    const flowSpeed = mat.uniforms['uFlowSpeed']?.value as number;
    expect(flowSpeed).toBeCloseTo(0.2, 5);
  });

  it('con reducedMotion=true, uFlowSpeed es ≤20% del nominal (≤0.04)', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="high" reducedMotion={true} />
      </div>,
    );
    const mat = getShaderMat();
    const flowSpeed = mat.uniforms['uFlowSpeed']?.value as number;
    // reducedMotion reduce un 80% → 20% del nominal → 0.20 * 0.20 = 0.04
    expect(flowSpeed).toBeLessThanOrEqual(0.04 + 0.001);
  });
});

describe('<Sun> — uniforms correctos', () => {
  it('uColorCore existe como uniform', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    expect(mat.uniforms['uColorCore']).toBeDefined();
  });

  it('uColorEdge existe como uniform', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    expect(mat.uniforms['uColorEdge']).toBeDefined();
  });

  it('uTime existe con valor inicial 0', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    expect(mat.uniforms['uTime']?.value).toBe(0);
  });

  it('uGranulationScale existe como uniform', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    expect(mat.uniforms['uGranulationScale']).toBeDefined();
  });

  it('uPerspectiveFactor existe con valor inicial 1.0', () => {
    render(
      <div data-testid="canvas">
        <Sun capability="mid" reducedMotion={false} />
      </div>,
    );
    const mat = getShaderMat();
    expect(mat.uniforms['uPerspectiveFactor']?.value).toBe(1.0);
  });
});
