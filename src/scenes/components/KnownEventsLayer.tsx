/**
 * <KnownEventsLayer> — carga known-events.json y renderiza un <KnownEvent>
 * por cada evento. Solo se monta cuando showKnownEvents === true.
 *
 * La carga del JSON se hace mediante fetch estándar con React.use() no,
 * sino con un efecto en el cliente dado que estamos dentro del Canvas R3F.
 * Usamos Suspense-friendly usePlanetsData como referencia de patrón.
 */

import { useState, useEffect } from 'react';
import { KnownEvent } from '@/scenes/components/KnownEvent';
import type {
  KnownEventsDataset,
  KnownEvent as KnownEventData,
} from '@/scenes/data/known-events.types';

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KnownEventsLayer() {
  const [events, setEvents] = useState<readonly KnownEventData[]>([]);

  useEffect(() => {
    void fetch('/data/known-events.json')
      .then((r) => r.json() as Promise<KnownEventsDataset>)
      .then((data) => setEvents(data.events))
      .catch(() => {
        // Si el fetch falla, simplemente no renderizamos eventos
      });
  }, []);

  return (
    <>
      {events.map((event) => (
        <KnownEvent key={event.id} event={event} />
      ))}
    </>
  );
}

KnownEventsLayer.displayName = 'KnownEventsLayer';
