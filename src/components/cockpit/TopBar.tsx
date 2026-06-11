/**
 * TopBar — barra superior del cockpit (~48 px, crece con flex-wrap).
 *
 * Compone widgets HUD que leen el store directamente.
 * Mueve (no reescribe) los widgets existentes de App.tsx:
 *   Logo, HomeButton, SpeedControl (sin su wrapper fixed), DatePicker,
 *   LanguageSelector, LevelDropdown, RotationAxesToggle.
 *
 * Estructura de 3 zonas:
 *   izquierda: Logo + HomeButton
 *   centro:    SpeedControl (mx-auto)
 *   derecha:   DatePicker, LanguageSelector, LevelDropdown, RotationAxesToggle
 *
 * ADR-E: flex-wrap — la fila crece (minmax(48px,auto)) si los controles
 * no caben en una sola línea; cero solapamiento por construcción.
 *
 * REQs: REQ-TOPBAR-1, REQ-TOPBAR-2, REQ-TOPBAR-3
 */

import { Logo } from '@/components/hud/Logo';
import { HomeButton } from '@/components/hud/HomeButton';
import { SpeedControl } from '@/components/ui/SpeedControl';
import { DatePicker } from '@/components/hud/DatePicker';
import { LanguageSelector } from '@/components/hud/LanguageSelector';
import { LevelDropdown } from '@/components/hud/LevelDropdown';
import { RotationAxesToggle } from '@/components/hud/RotationAxesToggle';

export function TopBar(): React.JSX.Element {
  return (
    <div className="flex h-full flex-wrap items-center gap-2 px-3 py-1.5 bg-black/50 border-b border-white/10">
      {/* Zona izquierda — Logo + Home */}
      <div className="flex items-center gap-2">
        <Logo />
        <HomeButton />
      </div>

      {/* Zona centro — SpeedControl (mx-auto lo empuja al centro) */}
      <div className="mx-auto">
        <SpeedControl />
      </div>

      {/* Zona derecha — controles de configuración + toggle ejes */}
      <div className="flex items-center gap-2">
        <DatePicker />
        <LanguageSelector />
        <LevelDropdown />
        <RotationAxesToggle />
      </div>
    </div>
  );
}

TopBar.displayName = 'TopBar';
