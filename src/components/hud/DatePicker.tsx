/**
 * DatePicker — control interactivo de fecha para el HUD.
 *
 * Cuando cerrado: muestra la fecha actual como botón clickable.
 * Cuando abierto: muestra <input type="date"> nativo con min/max.
 *
 * Interacción:
 * - Click en botón → openDatePicker() + focus al input
 * - onChange → simulationClock.reset(gregorianToJD(parsed)) (live preview)
 * - onBlur → closeDatePicker() (confirma cambio)
 * - Escape → closeDatePicker (sin restoreJD en esta versión básica)
 * - Botón "Ir a hoy" → reset a JD de hoy (no cierra el picker)
 * - min/max edges → title tooltip con aviso de Kepler
 *
 * A11y: pointer-events-auto, aria-label en castellano peninsular.
 * REQ-DATE-2, REQ-DATE-3, REQ-DATE-4, REQ-DATE-5.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { getGregorianDate, gregorianToJD, reset } from '@/scenes/simulationClock';

const DATE_MIN = '1900-01-01';
const DATE_MAX = '2100-12-31';

/** Formateador singleton para el botón cerrado — igual que DateControl */
const FMT_LONG = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });

/** Formatea { year, month, day } a cadena es-ES larga */
function formatDateLong(d: { year: number; month: number; day: number }): string {
  return FMT_LONG.format(new Date(Date.UTC(d.year, d.month - 1, d.day)));
}

/** Convierte { year, month, day } a string YYYY-MM-DD para <input type="date"> */
function toDateString(d: { year: number; month: number; day: number }): string {
  const mm = String(d.month).padStart(2, '0');
  const dd = String(d.day).padStart(2, '0');
  return `${d.year}-${mm}-${dd}`;
}

/** Parsea string YYYY-MM-DD a { year, month, day } */
function parseDateString(s: string): { year: number; month: number; day: number } | null {
  const parts = s.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/** Determina si una fecha string está en los bordes del rango válido */
function isNearEdge(value: string): boolean {
  return value === DATE_MIN || value === DATE_MAX;
}

/**
 * Control interactivo de fecha — abre native date picker al hacer click.
 */
export const DatePicker = React.memo(function DatePicker() {
  const { t } = useTranslation('solar');
  const datePickerOpen = useAppStore((s) => (s as { datePickerOpen: boolean }).datePickerOpen);
  const openDatePicker = useAppStore((s) => s.openDatePicker);
  const closeDatePicker = useAppStore((s) => s.closeDatePicker);

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState<string>(() => toDateString(getGregorianDate()));
  const [showWarning, setShowWarning] = useState(false);

  // Etiqueta de fecha en modo cerrado: sondeo cada 1 s para reflejar el avance del reloj
  const [closedLabel, setClosedLabel] = useState<string>(() => formatDateLong(getGregorianDate()));

  // Sondeo activo solo cuando el picker está cerrado (no consume ciclos mientras está abierto)
  const updateClosedLabel = useCallback(() => {
    const next = formatDateLong(getGregorianDate());
    setClosedLabel((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (datePickerOpen) return; // no necesario mientras está abierto
    const id = setInterval(updateClosedLabel, 1000);
    return () => clearInterval(id);
  }, [datePickerOpen, updateClosedLabel]);

  // Foco automático al abrir
  useEffect(() => {
    if (datePickerOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [datePickerOpen]);

  // Actualizar inputValue cuando el picker se abre
  useEffect(() => {
    if (datePickerOpen) {
      setInputValue(toDateString(getGregorianDate()));
      setShowWarning(false);
    }
  }, [datePickerOpen]);

  function handleButtonClick() {
    openDatePicker();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    const parsed = parseDateString(value);
    if (parsed) {
      const jd = gregorianToJD(parsed);
      reset(jd);
    }
    setShowWarning(isNearEdge(value));

    // Actualizar título del input como tooltip cuando está en el borde
    if (inputRef.current) {
      if (isNearEdge(value)) {
        inputRef.current.title = t(
          'solar:hud.keplerDriftWarning',
          'Fuera del rango óptimo (1900-2100): la aproximación de Kepler deriva.',
        );
      } else {
        inputRef.current.title = '';
      }
    }
  }

  function handleInputBlur() {
    closeDatePicker();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      closeDatePicker();
    }
  }

  function handleGoToToday() {
    const today = new Date();
    const todayDate = {
      year: today.getUTCFullYear(),
      month: today.getUTCMonth() + 1,
      day: today.getUTCDate(),
    };
    const jd = gregorianToJD(todayDate);
    reset(jd);
    setInputValue(toDateString(todayDate));
    setShowWarning(false);
    if (inputRef.current) {
      inputRef.current.title = '';
    }
  }

  if (!datePickerOpen) {
    return (
      <button
        type="button"
        data-testid="date-trigger"
        onClick={handleButtonClick}
        className="pointer-events-auto rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white/80 backdrop-blur hover:bg-white/10 hover:text-white"
        aria-label={t('solar:hud.date', 'Fecha')}
        title={t('solar:hud.date', 'Fecha')}
      >
        {closedLabel}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="date"
          value={inputValue}
          min={DATE_MIN}
          max={DATE_MAX}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-label={t('solar:hud.date', 'Fecha')}
          className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur focus:outline-none focus:ring-1 focus:ring-white/40"
        />
        <button
          type="button"
          onClick={handleGoToToday}
          className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white/80 backdrop-blur hover:bg-white/10 hover:text-white"
          aria-label={t('solar:hud.goToToday', 'Ir a hoy')}
        >
          {t('solar:hud.goToToday', 'Ir a hoy')}
        </button>
      </div>
      {showWarning && (
        <span data-testid="kepler-warning" className="text-xs text-yellow-300/80">
          {t(
            'solar:hud.keplerDriftWarning',
            'Fuera del rango óptimo (1900-2100): la aproximación de Kepler deriva.',
          )}
        </span>
      )}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';
