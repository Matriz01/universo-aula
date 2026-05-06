/**
 * PlutoNote — nota IAU 2006 sobre la reclasificación de Plutón.
 *
 * Texto adaptado por nivel pedagógico.
 * En nivel Explorador, muestra un pictograma SVG inline "antes/ahora".
 * Estilo destacado pero no agresivo.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PedagogicalLevel } from '@/types/index';

interface PlutoNoteProps {
  level: PedagogicalLevel;
}

/** Pictograma SVG: planeta tachado (antes) → planeta enano (ahora) */
function PlutoPictogram() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 32"
      width="80"
      height="32"
      aria-hidden="true"
      focusable="false"
      className="inline-block"
    >
      {/* Planeta "antes" — círculo grande tachado */}
      <circle cx="14" cy="16" r="10" fill="#a78bfa" opacity="0.7" />
      <line
        x1="4"
        y1="6"
        x2="24"
        y2="26"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Flecha */}
      <line x1="28" y1="16" x2="46" y2="16" stroke="#9ca3af" strokeWidth="1.5" />
      <polyline
        points="43,13 46,16 43,19"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Planeta enano "ahora" — círculo pequeño */}
      <circle cx="64" cy="16" r="6" fill="#a78bfa" opacity="0.9" />
      {/* Anillo indicando planeta enano */}
      <ellipse
        cx="64"
        cy="16"
        rx="10"
        ry="3"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1.2"
        opacity="0.8"
      />
    </svg>
  );
}

export const PlutoNote = React.memo(function PlutoNote({ level }: PlutoNoteProps) {
  const { t } = useTranslation('solar');

  return (
    <aside
      data-testid="pluto-note"
      className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-200"
      aria-label="Nota IAU sobre Plutón"
    >
      {level === 'explorador' && (
        <div className="mb-2 flex justify-center">
          <PlutoPictogram />
        </div>
      )}
      <p>{t(`solar:pluto.iau_note.${level}`)}</p>
    </aside>
  );
});

PlutoNote.displayName = 'PlutoNote';
