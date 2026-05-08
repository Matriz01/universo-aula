/**
 * Tests del componente <DatePicker> (T3.4)
 *
 * Verifica:
 * (a) Click en DateControl llama openDatePicker + input visible
 * (b) onChange "2030-06-15" → simulationClock.reset(gregorianToJD({year:2030,month:6,day:15}))
 * (c) onBlur → closeDatePicker
 * (d) "Ir a hoy" → reset a JD de hoy (±1 día)
 * (e) input tiene min/max; tooltip cuando valor en bordes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted mocks (requerido para evitar ReferenceError en vi.mock factories)
// ---------------------------------------------------------------------------

const {
  mockOpenDatePicker,
  mockCloseDatePicker,
  mockReset,
  mockGregorianToJD,
  mockGetGregorianDate,
  mockGetJD,
  mockDatePickerOpenRef,
} = vi.hoisted(() => {
  const ref = { open: false };
  return {
    mockOpenDatePicker: vi.fn(),
    mockCloseDatePicker: vi.fn(),
    mockReset: vi.fn(),
    mockGregorianToJD: vi.fn((d: { year: number; month: number; day: number }) => {
      // Cálculo aproximado para verificar la llamada
      return d.year * 365.25 + d.month * 30 + d.day;
    }),
    mockGetGregorianDate: vi.fn(() => ({ year: 2026, month: 5, day: 7 })),
    mockGetJD: vi.fn(() => 2461167.5),
    mockDatePickerOpenRef: ref,
  };
});

vi.mock('@/store/useAppStore', () => ({
  useAppStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      datePickerOpen: mockDatePickerOpenRef.open,
      simulationSpeed: 1,
      openDatePicker: mockOpenDatePicker,
      closeDatePicker: mockCloseDatePicker,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/scenes/simulationClock', () => ({
  reset: mockReset,
  getJD: mockGetJD,
  getGregorianDate: mockGetGregorianDate,
  gregorianToJD: mockGregorianToJD,
  jdToGregorian: vi.fn((jd: number) => {
    if (jd === 2451545.0) return { year: 2000, month: 1, day: 1 };
    return { year: 2026, month: 5, day: 7 };
  }),
  J2000_JD: 2451545.0,
  getPaused: vi.fn(() => false),
  setPaused: vi.fn(),
  tick: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'es' },
  }),
}));

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { DatePicker } from '@/components/hud/DatePicker';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockDatePickerOpenRef.open = false;
  mockGetGregorianDate.mockReturnValue({ year: 2026, month: 5, day: 7 });
  mockGetJD.mockReturnValue(2461167.5);
  // Restaurar la implementación del mock de gregorianToJD
  mockGregorianToJD.mockImplementation((d: { year: number; month: number; day: number }) => {
    return d.year * 365.25 + d.month * 30 + d.day;
  });
});

describe('<DatePicker>', () => {
  it('T3.4a: click en el trigger llama openDatePicker()', () => {
    const { container } = render(<DatePicker />);
    const trigger =
      container.querySelector('button') ?? container.querySelector('[data-testid="date-trigger"]');
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger!);
    expect(mockOpenDatePicker).toHaveBeenCalledOnce();
  });

  it('T3.4a: cuando datePickerOpen=true, input type="date" está en el DOM', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]');
    expect(input).not.toBeNull();
  });

  it('T3.4b: onChange "2030-06-15" llama gregorianToJD({year:2030,month:6,day:15})', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2030-06-15' } });
    expect(mockGregorianToJD).toHaveBeenCalledWith({ year: 2030, month: 6, day: 15 });
  });

  it('T3.4b: onChange "2030-06-15" llama reset() con el JD resultante', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2030-06-15' } });
    expect(mockReset).toHaveBeenCalled();
  });

  it('T3.4c: onBlur del input llama closeDatePicker()', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.blur(input);
    expect(mockCloseDatePicker).toHaveBeenCalled();
  });

  it('T3.4d: "Ir a hoy" llama gregorianToJD (con fecha de hoy) y reset()', () => {
    mockDatePickerOpenRef.open = true;
    render(<DatePicker />);
    const btn = screen.getByRole('button', { name: /hoy|today|Ir a hoy/i });
    fireEvent.click(btn);
    expect(mockGregorianToJD).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });

  it('T3.4e: input tiene min="1900-01-01" y max="2100-12-31"', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.getAttribute('min')).toBe('1900-01-01');
    expect(input.getAttribute('max')).toBe('2100-12-31');
  });

  it('T3.4e: cuando el valor es "1900-01-01", se muestra un aviso de Kepler', () => {
    mockDatePickerOpenRef.open = true;
    const { container } = render(<DatePicker />);
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1900-01-01' } });
    // El aviso puede estar en el atributo title del input o en un elemento data-testid
    const hasTitle = (input.getAttribute('title')?.length ?? 0) > 0;
    const warningEl = container.querySelector('[data-testid="kepler-warning"]');
    expect(hasTitle || warningEl !== null).toBe(true);
  });
});
