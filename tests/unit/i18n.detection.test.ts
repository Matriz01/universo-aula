/**
 * i18n privacy tests — language detector must NOT use cookies.
 *
 * Privacy/RGPD: the project promises "no cookies". The i18next language
 * detector defaults to writing a `i18next` cookie + `localStorage` entry.
 * Our config restricts persistence to localStorage only (key `ua_lang`)
 * and removes `cookie` from both `order` and `caches`.
 *
 * These tests guard that contract: changing the language persists to
 * localStorage under `ua_lang` and never writes a cookie.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '@/i18n/index';

describe('i18n language detector privacy', () => {
  beforeEach(() => {
    // Clear any persisted state before each assertion.
    localStorage.clear();
    // Expire every cookie currently set on the document.
    for (const pair of document.cookie.split(';')) {
      const name = pair.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    }
  });

  it('does not write any cookie when the language changes', async () => {
    await i18n.changeLanguage('en');
    await i18n.changeLanguage('es');

    expect(document.cookie).not.toContain('i18next');
    expect(document.cookie).toBe('');
  });

  it('persists the chosen locale in localStorage under "ua_lang"', async () => {
    await i18n.changeLanguage('en');

    expect(localStorage.getItem('ua_lang')).toBe('en');
    // The legacy default key must NOT be used.
    expect(localStorage.getItem('i18nextLng')).toBeNull();
  });
});
