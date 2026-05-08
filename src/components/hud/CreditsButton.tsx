/**
 * CreditsButton — botón para abrir el modal de créditos.
 *
 * Extrae el botón trigger del CreditsModal para colocarlo independientemente
 * en el HUD (bottom-right según diseño §2 de hud-overhaul-2026-05).
 * El modal en sí sigue siendo CreditsModal — este componente solo dispara el open.
 *
 * Props:
 *   onOpen — callback que abre el modal (lo gestiona el padre)
 *
 * A11y: button con aria-label desde i18n key hud.creditsButton.
 * pointer-events-auto: elemento interactivo sobre el canvas.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface CreditsButtonProps {
  /** Callback invocado al hacer click — el padre gestiona la apertura del modal. */
  onOpen: () => void;
}

/**
 * Botón para abrir el modal de créditos.
 */
export const CreditsButton = React.memo(function CreditsButton({ onOpen }: CreditsButtonProps) {
  const { t } = useTranslation('solar');

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('solar:hud.creditsButton', 'Créditos')}
      title={t('solar:hud.creditsButton', 'Créditos')}
      className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs text-white/70 backdrop-blur hover:bg-white/10 hover:text-white"
    >
      i
    </button>
  );
});

CreditsButton.displayName = 'CreditsButton';
