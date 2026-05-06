/**
 * LoadingScreen — pantalla de carga con barra de progreso.
 *
 * Usa useProgress de @react-three/drei.
 * Mensaje: t('solar:ui.loading').
 * Si tarda >5s, muestra un tip educativo aleatorio.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '@react-three/drei';

const TIPS_KEYS = ['solar:ui.loading_tips.0', 'solar:ui.loading_tips.1', 'solar:ui.loading_tips.2'];

export const LoadingScreen = React.memo(function LoadingScreen() {
  const { t } = useTranslation('solar');
  const { progress } = useProgress();
  const [showTip, setShowTip] = useState(false);
  const [tipKey] = useState(() => TIPS_KEYS[Math.floor(Math.random() * TIPS_KEYS.length)]);

  // Mostrar tip si carga tarda más de 5s
  useEffect(() => {
    if (progress >= 100) return;
    const timer = setTimeout(() => setShowTip(true), 5000);
    return () => clearTimeout(timer);
  }, [progress]);

  const progressRounded = Math.round(progress);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[#0b0b14] text-white">
      {/* Mensaje de carga */}
      <p data-testid="loading-message" className="text-lg font-medium tracking-wide">
        {t('solar:ui.loading', 'Cargando el cosmos...')}
      </p>

      {/* Barra de progreso */}
      <div className="w-64 overflow-hidden rounded-full bg-white/10">
        <div
          role="progressbar"
          aria-valuenow={progressRounded}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de carga"
          className="h-2 rounded-full bg-white/80 transition-all duration-300"
          style={{ width: `${progressRounded}%` }}
        />
      </div>

      {/* Porcentaje */}
      <p className="text-sm tabular-nums text-white/50">{progressRounded}%</p>

      {/* Tip educativo (después de 5s) */}
      {showTip && (
        <p
          data-testid="loading-tip"
          className="max-w-xs text-center text-sm italic text-amber-300/80"
        >
          {t(tipKey, '¿Sabías que el Sistema Solar tiene más de 4500 millones de años?')}
        </p>
      )}
    </div>
  );
});

LoadingScreen.displayName = 'LoadingScreen';
