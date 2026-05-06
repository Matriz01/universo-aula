/**
 * FpsCounter — contador de FPS no intrusivo en bottom-right.
 * Actualiza el display cada 250ms para minimizar re-renders.
 */

import { useState, useEffect, useRef } from 'react';

export function FpsCounter() {
  const [fps, setFps] = useState(0);
  const frameTimes = useRef<number[]>([]);
  const lastUpdate = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      frameTimes.current.push(now);
      // Mantener solo el último segundo de frames
      const oneSecondAgo = now - 1000;
      while (frameTimes.current.length && frameTimes.current[0] < oneSecondAgo) {
        frameTimes.current.shift();
      }
      // Actualizar el display cada 250ms para no causar re-render storm
      if (now - lastUpdate.current >= 250) {
        setFps(frameTimes.current.length);
        lastUpdate.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-20 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white/80 backdrop-blur-sm"
      aria-live="off"
    >
      {fps} FPS
    </div>
  );
}
