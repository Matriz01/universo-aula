/**
 * CockpitFrame — marco estructural CSS Grid para el cockpit de Universo Aula.
 *
 * PR1: grid de 2 filas × 1 columna (top-bar + canvas).
 * PR2 añadirá fila status-bar y columna side-rail.
 * PR3 añadirá columna info-dock dinámica vía style inline.
 *
 * Componente PRESENTACIONAL puro — no lee el store.
 * Todos los slots son ReactNode; App es el único composition root.
 *
 * ADR-B: celda canvas marcada con `relative isolate z-0 min-h-0 min-w-0 overflow-hidden`
 * para confinar el zIndexRange de drei Html (BodyMarkers no saltan sobre el chrome).
 *
 * REQs: REQ-GRID-1, REQ-GRID-3, REQ-GRID-4, REQ-INV-2
 */

import React from 'react';

interface CockpitFrameProps {
  topBar: React.ReactNode;
  sideRail?: React.ReactNode; // PR2
  statusBar?: React.ReactNode; // PR2
  infoDock?: React.ReactNode; // PR3
  dockOpen?: boolean; // PR3 — App lo computa con useInfoDockOpen()
  children: React.ReactNode; // contenido de la celda canvas
}

export function CockpitFrame({ topBar, children }: CockpitFrameProps): React.JSX.Element {
  return (
    <div
      data-testid="cockpit-frame"
      className="grid h-screen w-screen overflow-hidden bg-[#0b0b14] text-white
        grid-rows-[minmax(48px,auto)_minmax(0,1fr)]"
    >
      {/* Celda top-bar — row 1, col 1 */}
      <div data-testid="cockpit-topbar-cell" className="row-start-1 col-start-1">
        {topBar}
      </div>

      {/* Celda canvas — row 2, col 1
          ADR-B: isolate crea el stacking context que confina tres Html.
          min-h-0 / min-w-0 son OBLIGATORIOS: sin ellos el canvas bloquea
          el shrink del grid (min-size implícita de flex/grid es auto).
      */}
      <div
        data-testid="cockpit-canvas-cell"
        className="relative isolate z-0 min-h-0 min-w-0 overflow-hidden row-start-2 col-start-1"
      >
        {children}
      </div>
    </div>
  );
}

CockpitFrame.displayName = 'CockpitFrame';
