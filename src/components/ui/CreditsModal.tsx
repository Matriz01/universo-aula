/**
 * CreditsModal — modal accesible con información de créditos y licencias.
 *
 * Abierto desde un botón "i" en el HUD.
 * role="dialog", aria-modal="true", aria-labelledby.
 * Cerrable con: Escape, click fuera, botón cerrar.
 */

import React, { useState, useEffect, useId, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const CreditsModal = React.memo(function CreditsModal() {
  const { t } = useTranslation('solar');
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Botón trigger — siempre visible */}
      <button
        type="button"
        onClick={open}
        aria-label={t('solar:ui.credits_button', 'Créditos e información')}
        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs text-white/70 backdrop-blur hover:bg-white/10 hover:text-white"
        title={t('solar:ui.credits_button', 'Créditos e información')}
      >
        i
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop — click fuera para cerrar */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={close}
          />

          {/* Diálogo */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed left-1/2 top-1/2 z-50 max-h-[80vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-[#0d0d1a] p-6 text-white shadow-2xl ring-1 ring-white/10"
          >
            {/* Cabecera */}
            <div className="mb-5 flex items-center justify-between">
              <h2 id={titleId} className="text-xl font-bold tracking-tight">
                {t('solar:ui.credits_title', 'Créditos y licencias')}
              </h2>
              <button
                type="button"
                aria-label={t('solar:ui.close', 'Cerrar')}
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-5 text-sm text-white/80">
              {/* Texturas */}
              <section>
                <h3 className="mb-1.5 font-semibold text-white">Texturas</h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.solarsystemscope.com/textures/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Solar System Scope"
                      className="text-blue-300 hover:underline"
                    >
                      Solar System Scope
                    </a>{' '}
                    — CC BY 4.0
                  </li>
                </ul>
              </section>

              {/* Datos */}
              <section>
                <h3 className="mb-1.5 font-semibold text-white">Datos planetarios</h3>
                <ul className="space-y-1">
                  <li>NASA JPL Horizons — dominio público</li>
                  <li>NASA Planetary Fact Sheets — dominio público</li>
                </ul>
              </section>

              {/* IAU */}
              <section>
                <h3 className="mb-1.5 font-semibold text-white">Resolución IAU 2006 (Plutón)</h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://www.iau.org/static/resolutions/Resolution_GA26-5-6.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:underline"
                    >
                      IAU 2006 — Resoluciones 5A y 6A
                    </a>
                  </li>
                </ul>
              </section>

              {/* Licencias del proyecto */}
              <section>
                <h3 className="mb-1.5 font-semibold text-white">Licencia del proyecto</h3>
                <ul className="space-y-1">
                  <li>
                    Código fuente:{' '}
                    <a href="/LICENSE" className="text-blue-300 hover:underline">
                      AGPL-3.0
                    </a>
                  </li>
                  <li>Contenido educativo: CC BY-SA 4.0</li>
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
});

CreditsModal.displayName = 'CreditsModal';
