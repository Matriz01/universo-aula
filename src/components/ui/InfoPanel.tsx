/**
 * InfoPanel — panel lateral con datos del planeta seleccionado.
 *
 * Tres variantes según nivel pedagógico:
 * - Explorador: descripción corta, fuente grande, sin números.
 * - Aprendiz: datos básicos (distancia, lunas, periodo).
 * - Investigador: tabla científica densa.
 *
 * No se muestra si selectedPlanet === null.
 * Si selectedPlanet === 'pluto', incluye <PlutoNote />.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { PlutoNote } from '@/components/ui/PlutoNote';
import type { PlanetId } from '@/scenes/data/types';
import type { PedagogicalLevel } from '@/types/index';

// Datos básicos estáticos para niveles Aprendiz e Investigador
// (Fuente: NASA Planetary Fact Sheets — Dominio público)
const PLANET_BASIC: Record<PlanetId, { distance_AU: number; moons: number; period_days: number }> =
  {
    mercury: { distance_AU: 0.387, moons: 0, period_days: 88 },
    venus: { distance_AU: 0.723, moons: 0, period_days: 225 },
    earth: { distance_AU: 1.0, moons: 1, period_days: 365 },
    mars: { distance_AU: 1.524, moons: 2, period_days: 687 },
    jupiter: { distance_AU: 5.203, moons: 95, period_days: 4333 },
    saturn: { distance_AU: 9.537, moons: 146, period_days: 10759 },
    uranus: { distance_AU: 19.19, moons: 28, period_days: 30687 },
    neptune: { distance_AU: 30.07, moons: 16, period_days: 60190 },
    pluto: { distance_AU: 39.48, moons: 5, period_days: 90560 },
  };

const PLANET_SCIENTIFIC: Record<
  PlanetId,
  {
    radius_km: number;
    mass_kg: string;
    eccentricity: number;
    inclination_deg: number;
    density_g_cm3: number;
    gravity_m_s2: number;
    mean_temp_k: number;
  }
> = {
  mercury: {
    radius_km: 2440,
    mass_kg: '3.30×10²³',
    eccentricity: 0.206,
    inclination_deg: 7.0,
    density_g_cm3: 5.43,
    gravity_m_s2: 3.7,
    mean_temp_k: 440,
  },
  venus: {
    radius_km: 6052,
    mass_kg: '4.87×10²⁴',
    eccentricity: 0.007,
    inclination_deg: 3.4,
    density_g_cm3: 5.24,
    gravity_m_s2: 8.87,
    mean_temp_k: 737,
  },
  earth: {
    radius_km: 6371,
    mass_kg: '5.97×10²⁴',
    eccentricity: 0.017,
    inclination_deg: 0.0,
    density_g_cm3: 5.51,
    gravity_m_s2: 9.81,
    mean_temp_k: 288,
  },
  mars: {
    radius_km: 3390,
    mass_kg: '6.42×10²³',
    eccentricity: 0.093,
    inclination_deg: 1.85,
    density_g_cm3: 3.93,
    gravity_m_s2: 3.72,
    mean_temp_k: 210,
  },
  jupiter: {
    radius_km: 71492,
    mass_kg: '1.90×10²⁷',
    eccentricity: 0.049,
    inclination_deg: 1.3,
    density_g_cm3: 1.33,
    gravity_m_s2: 24.79,
    mean_temp_k: 165,
  },
  saturn: {
    radius_km: 60268,
    mass_kg: '5.68×10²⁶',
    eccentricity: 0.057,
    inclination_deg: 2.49,
    density_g_cm3: 0.69,
    gravity_m_s2: 10.44,
    mean_temp_k: 134,
  },
  uranus: {
    radius_km: 25559,
    mass_kg: '8.68×10²⁵',
    eccentricity: 0.046,
    inclination_deg: 0.77,
    density_g_cm3: 1.27,
    gravity_m_s2: 8.87,
    mean_temp_k: 76,
  },
  neptune: {
    radius_km: 24764,
    mass_kg: '1.02×10²⁶',
    eccentricity: 0.01,
    inclination_deg: 1.77,
    density_g_cm3: 1.64,
    gravity_m_s2: 11.15,
    mean_temp_k: 72,
  },
  pluto: {
    radius_km: 1188,
    mass_kg: '1.30×10²²',
    eccentricity: 0.249,
    inclination_deg: 17.14,
    density_g_cm3: 1.85,
    gravity_m_s2: 0.62,
    mean_temp_k: 44,
  },
};

// ---------------------------------------------------------------------------
// Variante Explorador
// ---------------------------------------------------------------------------
function ExploradorPanel({ planetId, level }: { planetId: PlanetId; level: PedagogicalLevel }) {
  const { t } = useTranslation('solar');
  return (
    <div className="space-y-3">
      <p className="text-xl leading-relaxed">{t(`solar:${planetId}.${level}.description`)}</p>
      <p className="text-base italic text-amber-300">{t(`solar:${planetId}.curiosity`)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variante Aprendiz
// ---------------------------------------------------------------------------
function AprendizPanel({ planetId, level }: { planetId: PlanetId; level: PedagogicalLevel }) {
  const { t } = useTranslation('solar');
  const data = PLANET_BASIC[planetId];

  return (
    <div className="space-y-3">
      <p className="text-base leading-relaxed">{t(`solar:${planetId}.${level}.description`)}</p>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td className="pr-2 text-white/60">Distancia media</td>
            <td className="font-mono">{data.distance_AU} AU</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/60">Lunas</td>
            <td className="font-mono">{data.moons}</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/60">Periodo orbital</td>
            <td className="font-mono">{data.period_days} días</td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm italic text-amber-300">{t(`solar:${planetId}.curiosity`)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variante Investigador
// ---------------------------------------------------------------------------
function InvestigadorPanel({ planetId, level }: { planetId: PlanetId; level: PedagogicalLevel }) {
  const { t } = useTranslation('solar');
  const basic = PLANET_BASIC[planetId];
  const sci = PLANET_SCIENTIFIC[planetId];

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-white/80">
        {t(`solar:${planetId}.${level}.description`)}
      </p>
      <table className="w-full text-xs">
        <tbody className="[&_td]:py-0.5">
          <tr>
            <td className="pr-2 text-white/50">Radio</td>
            <td className="font-mono">{sci.radius_km.toLocaleString()} km</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Masa</td>
            <td className="font-mono">{sci.mass_kg} kg</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Distancia media</td>
            <td className="font-mono">{basic.distance_AU} AU</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Lunas</td>
            <td className="font-mono">{basic.moons}</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Periodo orbital</td>
            <td className="font-mono">{basic.period_days} días</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Excentricidad</td>
            <td className="font-mono">{sci.eccentricity}</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Inclinación</td>
            <td className="font-mono">{sci.inclination_deg}°</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Densidad</td>
            <td className="font-mono">{sci.density_g_cm3} g/cm³</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Gravedad</td>
            <td className="font-mono">{sci.gravity_m_s2} m/s²</td>
          </tr>
          <tr>
            <td className="pr-2 text-white/50">Temperatura media</td>
            <td className="font-mono">{sci.mean_temp_k} K</td>
          </tr>
        </tbody>
      </table>
      <button
        type="button"
        className="w-full rounded border border-white/20 py-1 text-xs text-white/60 hover:bg-white/5"
        disabled
        title="Próximamente"
      >
        Ver órbitas reales (próximamente)
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel principal
// ---------------------------------------------------------------------------
export const InfoPanel = React.memo(function InfoPanel() {
  const { t } = useTranslation('solar');
  const selectedPlanet = useAppStore((s) => s.selectedPlanet);
  const setSelectedPlanet = useAppStore((s) => s.setSelectedPlanet);
  const level = useAppStore((s) => s.level);

  if (selectedPlanet === null) return null;

  const isExplorador = level === 'explorador';
  const panelClass = isExplorador
    ? 'fixed inset-x-4 top-4 bottom-16 z-30 max-w-lg mx-auto rounded-2xl bg-black/80 p-6 backdrop-blur-md'
    : 'fixed right-4 top-4 bottom-16 z-30 w-80 rounded-2xl bg-black/80 p-4 backdrop-blur-md overflow-y-auto';

  return (
    <div
      data-testid="info-panel"
      className={panelClass}
      role="complementary"
      aria-label={`Información sobre ${t(`solar:${selectedPlanet}.name`)}`}
    >
      {/* Cabecera */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className={isExplorador ? 'text-3xl font-bold' : 'text-xl font-bold'}>
          {t(`solar:${selectedPlanet}.name`)}
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => setSelectedPlanet(null)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Contenido por nivel */}
      {level === 'explorador' && <ExploradorPanel planetId={selectedPlanet} level={level} />}
      {level === 'aprendiz' && <AprendizPanel planetId={selectedPlanet} level={level} />}
      {level === 'investigador' && <InvestigadorPanel planetId={selectedPlanet} level={level} />}

      {/* Nota IAU para Plutón */}
      {selectedPlanet === 'pluto' && <PlutoNote level={level} />}
    </div>
  );
});

InfoPanel.displayName = 'InfoPanel';
