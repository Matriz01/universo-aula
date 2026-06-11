/**
 * Regresión A1 — restauración del idioma guardado (localStorage['ua_lang']).
 *
 * Bug: el init pasaba `lng: 'es'`, lo que (a) impedía que i18next ejecutara el
 * LanguageDetector (solo detecta cuando NO se pasa `lng`) y (b) hacía que el
 * changeLanguage('es') del arranque ejecutara cacheUserLanguage('es'),
 * machacando la elección guardada del usuario en cada carga. El bloque
 * `detection` era código muerto al arranque.
 *
 * Estrategia: instancias FRESCAS de i18next (createInstance) inicializadas con
 * la MISMA config exportada por src/i18n (i18nInitOptions) — así cada test
 * reproduce un "arranque de la app" con el estado de localStorage que fije.
 *
 * Nota jsdom: sin `lng`, el detector corre también aquí. El order es
 * ['querystring', 'localStorage', 'htmlTag'] (sin 'navigator' — el default no
 * debe depender del idioma del SO). En jsdom `document.documentElement.lang`
 * está vacío por defecto → sin detección → fallbackLng. En la app real el
 * <html lang="es"> de index.html aporta el default 'es'; aquí lo simulamos
 * fijando documentElement.lang explícitamente.
 *
 * Categorías: happy path (restauración), boundary (sin estado guardado),
 * input inválido (omitido: supportedLngs filtra códigos no soportados — cubierto
 * por la config, no por lógica propia), determinismo (mismo estado → mismo idioma,
 * implícito en cada assert sobre instancias frescas).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInstance } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18nInitOptions } from '@/i18n/index';

/** Crea e inicializa una instancia fresca con la misma config que la app. */
async function initFreshInstance() {
  const instance = createInstance();
  await instance.use(LanguageDetector).init(i18nInitOptions);
  return instance;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
});

describe('i18n — restauración del idioma guardado (A1)', () => {
  it("restaura 'en' cuando localStorage['ua_lang']='en' existe ANTES del arranque", async () => {
    localStorage.setItem('ua_lang', 'en');
    document.documentElement.lang = 'es'; // como index.html

    const instance = await initFreshInstance();

    // localStorage va ANTES que htmlTag en el order → gana la elección guardada
    expect(instance.language).toBe('en');
  });

  it("arranca en 'es' (htmlTag) cuando no hay nada guardado en localStorage", async () => {
    document.documentElement.lang = 'es'; // como index.html

    const instance = await initFreshInstance();

    expect(instance.language).toBe('es');
  });

  it('sin localStorage y sin htmlTag (jsdom puro): resuelve castellano vía fallbackLng', async () => {
    // Boundary: ningún detector encuentra idioma → i18next traduce usando la
    // cadena de fallbackLng (['es','en']) → las cadenas salen en castellano.
    // Este es exactamente el comportamiento que ven los tests jsdom existentes
    // que usan el singleton (sin <html lang>): UI en castellano.
    const instance = await initFreshInstance();

    expect(instance.t('common:tagline')).toBe('Explora el cosmos desde el aula');
  });

  it("el arranque NO machaca la elección guardada: ua_lang sigue siendo 'en'", async () => {
    localStorage.setItem('ua_lang', 'en');
    document.documentElement.lang = 'es';

    await initFreshInstance();

    // Antes del fix, el changeLanguage('es') del init ejecutaba
    // cacheUserLanguage('es') y sobreescribía la elección del usuario.
    expect(localStorage.getItem('ua_lang')).toBe('en');
  });

  it('los enlaces ?lng= siguen funcionando: querystring gana a localStorage', async () => {
    localStorage.setItem('ua_lang', 'es');
    document.documentElement.lang = 'es';
    window.history.pushState({}, '', '/?lng=en');

    try {
      const instance = await initFreshInstance();
      expect(instance.language).toBe('en');
    } finally {
      window.history.pushState({}, '', '/');
    }
  });
});
