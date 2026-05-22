/**
 * OORT_COPY_KEYS — stable i18n key constants for the Oort cloud info-panel copy.
 *
 * Centralises key strings so components reference this module rather than
 * scattering literal key strings. Per ADR-008: namespace is `solar`, keys
 * follow the `layers.oort.{role}.{level}` pattern.
 *
 * Usage:
 *   import { OORT_COPY_KEYS } from './content/copy';
 *   t(OORT_COPY_KEYS.title.explorador)  // → 'Nube de cometas' (es) | 'Comet Cloud' (en)
 */
export const OORT_COPY_KEYS = {
  title: {
    explorador: 'layers.oort.title.explorador',
    aprendiz: 'layers.oort.title.aprendiz',
    investigador: 'layers.oort.title.investigador',
  },
  body: {
    explorador: 'layers.oort.body.explorador',
    aprendiz: 'layers.oort.body.aprendiz',
    investigador: 'layers.oort.body.investigador',
  },
} as const;

export type OortCopyRole = keyof typeof OORT_COPY_KEYS;
