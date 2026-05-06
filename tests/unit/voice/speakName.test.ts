/**
 * Tests de speakName
 *
 * Estrategia: mock de window.speechSynthesis.
 * Verifica utterance creado, speak invocado, cancel antes de speak,
 * y no-op cuando speechSynthesis no existe.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Setup de mock speechSynthesis
// ---------------------------------------------------------------------------

const mockCancel = vi.fn();
const mockSpeak = vi.fn();
const mockGetVoices = vi.fn(() => []);

function setupSpeechSynthesis() {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      cancel: mockCancel,
      speak: mockSpeak,
      getVoices: mockGetVoices,
    },
  });
}

function removeSpeechSynthesis() {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: undefined,
  });
}

// Mock SpeechSynthesisUtterance
const utteranceInstances: Array<{ text: string; lang: string }> = [];

class MockSpeechSynthesisUtterance {
  text: string;
  lang: string;
  constructor(text: string) {
    this.text = text;
    this.lang = '';
    utteranceInstances.push(this);
  }
}

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  configurable: true,
  value: MockSpeechSynthesisUtterance,
});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { speakName } from '@/voice/speakName';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  utteranceInstances.length = 0;
  setupSpeechSynthesis();
});

describe('speakName', () => {
  it('invoca speak con el texto correcto', () => {
    speakName('Marte', 'es-ES');
    expect(mockSpeak).toHaveBeenCalledOnce();
    const utterance = utteranceInstances[0];
    expect(utterance.text).toBe('Marte');
  });

  it('asigna el lang correcto al utterance', () => {
    speakName('Mars', 'en-US');
    const utterance = utteranceInstances[0];
    expect(utterance.lang).toBe('en-US');
  });

  it('llama a cancel() antes de speak()', () => {
    speakName('Sol', 'es-ES');
    const cancelOrder = mockCancel.mock.invocationCallOrder[0];
    const speakOrder = mockSpeak.mock.invocationCallOrder[0];
    expect(cancelOrder).toBeLessThan(speakOrder);
  });

  it('una segunda llamada también invoca cancel primero', () => {
    speakName('Mercurio', 'es-ES');
    speakName('Venus', 'es-ES');
    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(mockSpeak).toHaveBeenCalledTimes(2);
  });

  it('no lanza excepción cuando speechSynthesis no existe', () => {
    removeSpeechSynthesis();
    expect(() => speakName('Saturno', 'es-ES')).not.toThrow();
  });

  it('no invoca speak cuando speechSynthesis no existe', () => {
    removeSpeechSynthesis();
    speakName('Urano', 'es-ES');
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
