/**
 * useKeyboardNavigation — navegación del Sistema Solar por teclado.
 *
 * Teclas:
 * - Tab           → siguiente cuerpo en orden Sol→...→Plutón
 * - Shift+Tab     → cuerpo anterior
 * - Enter / Space → aplicar focus al cuerpo navegado (setSelectedPlanet)
 * - Escape        → si viewMode='local', vuelve a global (goToBody(null)); si global, libera foco
 * - T / t         → alterna tourActive
 * - K / k         → cuando modo local, alterna showKnownEvents
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CELESTIAL_ORDER } from '@/scenes/data/types';

export function useKeyboardNavigation(): void {
  const selectedBody = useAppStore((s) => s.selectedBody);
  // La navegación Tab solo cicla por PlanetId (CELESTIAL_ORDER no incluye 'moon')
  const selectedPlanet = selectedBody !== 'moon' ? selectedBody : null;
  const setSelectedPlanet = useAppStore((s) => s.setSelectedPlanet);
  const tourActive = useAppStore((s) => s.tourActive);
  const setTourActive = useAppStore((s) => s.setTourActive);
  const viewMode = useAppStore((s) => s.viewMode);
  const goToBody = useAppStore((s) => s.goToBody);
  const showKnownEvents = useAppStore((s) => s.showKnownEvents);
  const setShowKnownEvents = useAppStore((s) => s.setShowKnownEvents);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { key, shiftKey } = event;

      if (key === 'Tab') {
        event.preventDefault();
        const currentIndex = CELESTIAL_ORDER.indexOf(selectedPlanet);
        const total = CELESTIAL_ORDER.length;

        if (shiftKey) {
          // Anterior (wraps around)
          const prevIndex = currentIndex <= 0 ? total - 1 : currentIndex - 1;
          setSelectedPlanet(CELESTIAL_ORDER[prevIndex] ?? null);
        } else {
          // Siguiente (wraps around)
          const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % total;
          setSelectedPlanet(CELESTIAL_ORDER[nextIndex] ?? null);
        }
        return;
      }

      if (key === 'Escape') {
        if (viewMode === 'local') {
          // En modo local: volver a vista global
          goToBody(null);
        } else {
          // En modo global: comportamiento previo (libera foco)
          setSelectedPlanet(null);
        }
        return;
      }

      if (key === 't' || key === 'T') {
        setTourActive(!tourActive);
        return;
      }

      if ((key === 'k' || key === 'K') && viewMode === 'local') {
        setShowKnownEvents(!showKnownEvents);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedBody,
    setSelectedPlanet,
    tourActive,
    setTourActive,
    viewMode,
    goToBody,
    showKnownEvents,
    setShowKnownEvents,
  ]);
}
