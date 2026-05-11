/**
 * Hook usePlanetMaterial — gestiona el swap toon/standard de material
 * según el nivel pedagógico, con higiene de dispose y ref-count del gradient.
 *
 * Asigna imperativamente el material al mesh (`meshRef.current.material = next`)
 * sin re-montar la malla, preservando geometría y posición orbital.
 *
 * Spec: REQ-TOON-2 (swap), REQ-DISP-1 (dispose en swap), REQ-DISP-2 (gradient ref-count)
 * Design: §1 usePlanetMaterial hook, ADR-7
 */

import { useEffect, useRef } from 'react';
import { Color, MeshToonMaterial, MeshStandardMaterial } from 'three';
import type { Material, Mesh, Texture } from 'three';
import type { PedagogicalLevel } from '@/scenes/hooks/usePlanetPosition';
import { acquireToonGradientTexture, releaseToonGradientTexture } from '@/scenes/data/toonGradient';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UsePlanetMaterialArgs {
  /** Ref al mesh cuyo material será gestionado. React 19 devuelve RefObject<T | null>. */
  meshRef: React.RefObject<Mesh | null>;
  /** Nivel pedagógico activo. */
  level: PedagogicalLevel;
  /** Color hexadecimal del planeta (usado cuando no hay textura). */
  colorHex: string;
  /** Textura a aplicar en MeshStandardMaterial (null para color sólido). */
  texture: Texture | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlanetMaterial({
  meshRef,
  level,
  colorHex,
  texture,
}: UsePlanetMaterialArgs): void {
  // Referencia al material actual para poder disponer en cleanup de unmount
  const currentMaterialRef = useRef<Material | null>(null);
  // Referencia al nivel actual para el cleanup de unmount
  const currentLevelRef = useRef<PedagogicalLevel>(level);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // 1. Guardar referencia al material anterior
    const old = mesh.material as Material | null | undefined;

    // 2. Construir nuevo material
    let next: Material;
    if (level === 'explorador') {
      const gradientMap = acquireToonGradientTexture();
      next = new MeshToonMaterial({
        color: new Color(colorHex),
        gradientMap,
      });
    } else {
      next = new MeshStandardMaterial({
        ...(texture ? { map: texture } : { color: new Color(colorHex) }),
      });
    }

    // 3. Asignar nuevo material al mesh
    mesh.material = next;
    currentMaterialRef.current = next;
    currentLevelRef.current = level;

    // 4. Dispose del material anterior (dentro del effect, no en cleanup)
    if (old && old !== next) {
      if (old instanceof MeshToonMaterial) {
        releaseToonGradientTexture();
      }
      old.dispose();
    }
  }, [level, colorHex, texture]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup en unmount: dispose del material actual
  useEffect(() => {
    return () => {
      const mat = currentMaterialRef.current;
      if (mat) {
        if (mat instanceof MeshToonMaterial) {
          releaseToonGradientTexture();
        }
        mat.dispose();
      }
    };
  }, []);
}
