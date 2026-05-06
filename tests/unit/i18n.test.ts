import { describe, it, expect } from 'vitest';
import { fallbackChain } from '@/i18n/index';

describe('fallbackChain', () => {
  it('para ca-ES-valencia devuelve [ca, es, en]', () => {
    expect(fallbackChain('ca-ES-valencia')).toEqual(['ca', 'es', 'en']);
  });

  it('para es-ES devuelve [es, en]', () => {
    expect(fallbackChain('es-ES')).toEqual(['es', 'en']);
  });

  it('para en devuelve [en]', () => {
    expect(fallbackChain('en')).toEqual(['en']);
  });

  it('para fr-FR devuelve [fr, es, en]', () => {
    expect(fallbackChain('fr-FR')).toEqual(['fr', 'es', 'en']);
  });
});
