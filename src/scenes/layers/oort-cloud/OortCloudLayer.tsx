/**
 * OortCloudLayer — R3F point cloud for the Oort cloud shell.
 *
 * Default export required for React.lazy() (ADR-006).
 *
 * Renders nothing when viewMode !== 'global' (REQ-LEVEL-1).
 * No useFrame import — the geometry is static, computed once on mount (REQ-LEVEL-5).
 * No simulationClock import (REQ-INV-1).
 *
 * Material: PointsMaterial with sizeAttenuation + transparent + depthWrite=false
 * so the cloud does not occlude planets (ADR-004).
 * frustumCulled=false because camera is inside the shell by design (ADR-007).
 */

import React, { useMemo } from 'react';
import { Float32BufferAttribute, BufferGeometry } from 'three';
import { useAppStore } from '@/store/useAppStore';
import { generateOortCloudGeometry } from './geometry';
import { getOortParamsForLevel } from './levelParams';

/**
 * Renders a static Oort cloud point cloud.
 * - Returns null when viewMode !== 'global' (REQ-LEVEL-1).
 * - Geometry is memo-ised by level — recomputed only when level changes.
 * - Material props (size, opacity, color) are driven by the active level (REQ-LEVEL-3).
 */
export default function OortCloudLayer(): React.JSX.Element | null {
  const viewMode = useAppStore((s) => s.viewMode);
  const level = useAppStore((s) => s.level);

  // Bail out early in local mode — no geometry, no draw calls (REQ-LEVEL-1)
  if (viewMode !== 'global') return null;

  return <OortCloudLayerGlobal level={level} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — only mounts in global mode, safe to call hooks unconditionally
// ─────────────────────────────────────────────────────────────────────────────

interface OortCloudLayerGlobalProps {
  level: Parameters<typeof getOortParamsForLevel>[0];
}

function OortCloudLayerGlobal({ level }: OortCloudLayerGlobalProps) {
  const params = getOortParamsForLevel(level);

  // Geometry is computed once per level change; memoised for stability (REQ-LEVEL-3)
  const geometry = useMemo(() => {
    const { positions } = generateOortCloudGeometry({
      count: params.count,
      innerRadius: params.innerVisual,
      outerRadius: params.outerVisual,
      seed: params.seed,
    });
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return (
    // frustumCulled=false: camera is inside the shell — culling would hide it (ADR-007, REQ-LEVEL-4)
    <points frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        sizeAttenuation
        transparent
        depthWrite={false}
        size={params.size}
        opacity={params.opacity}
        color={params.color}
      />
    </points>
  );
}
