/**
 * Oort cloud layer — barrel re-exports.
 *
 * Exports TYPES ONLY. The OortCloudLayer component is NOT re-exported here
 * to keep the React.lazy() import path stable (must point directly at
 * OortCloudLayer.tsx — ADR-006).
 */

export type { OortCloudGeometryOptions, OortCloudGeometryResult } from './geometry';
export type { OortLevelParams } from './levelParams';
export { OORT_LEVEL_PARAMS, getOortParamsForLevel } from './levelParams';
