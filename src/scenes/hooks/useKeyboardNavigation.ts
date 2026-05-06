/**
 * useKeyboardNavigation — navegación del Sistema Solar por teclado.
 *
 * Teclas:
 * - Tab           → siguiente cuerpo en orden Sol→...→Plutón
 * - Shift+Tab     → cuerpo anterior
 * - Enter / Space → aplicar focus al cuerpo navegado (setSelectedPlanet)
 * - Escape        → suelta focus (setSelectedPlanet(null))
 * - T / t         → alterna tourActive
 */

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CELESTIAL_ORDER } from '@/scenes/data/types';

export function useKeyboardNavigation(): void {
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const setSelectedPlanet = useAppStore((s) => s.setSelectedPlanet);
  const tourActive = useAppStore((s) => s.tourActive);
  const setTourActive = useAppStore((s) => s.setTourActive);

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
        setSelectedPlanet(null);
        return;
      }

      if (key === 't' || key === 'T') {
        setTourActive(!tourActive);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPlanet, setSelectedPlanet, tourActive, setTourActive]);
}
