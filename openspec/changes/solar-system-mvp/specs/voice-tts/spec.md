# Spec: voice-tts

**Cambio:** solar-system-mvp
**Capability:** voice-tts
**Estado:** Especificado

## Resumen

Pronunciación por voz del nombre del planeta mediante Web Speech API (SpeechSynthesis), activada automáticamente al hacer click sobre un planeta en nivel Explorador. Soporta idioma español (ES) e inglés (EN) según el locale activo de i18next. Sin dependencias de bundle adicionales.

## Requisitos

### REQ-001: TTS activo al hacer click en nivel Explorador

**Prioridad:** MUST

Al hacer click sobre cualquier planeta en nivel Explorador, `speakName` MUST invocar `window.speechSynthesis.speak()` con el nombre del planeta en el idioma activo (ES o EN). En niveles Aprendiz e Investigador, `speakName` SHALL NOT invocarse.

#### Escenario: Click en Marte en nivel Explorador con locale ES

**Given** el nivel activo es Explorador y el locale activo es `es`  
**When** el usuario hace click sobre Marte  
**Then** `window.speechSynthesis.speak` es invocado con un `SpeechSynthesisUtterance` cuyo `text` es "Marte" y `lang` es `'es-ES'`

#### Escenario: Click en Mars en nivel Explorador con locale EN

**Given** el nivel activo es Explorador y el locale activo es `en`  
**When** el usuario hace click sobre Marte  
**Then** `window.speechSynthesis.speak` es invocado con `text = 'Mars'` y `lang = 'en-US'`

#### Escenario: Click en planeta en nivel Aprendiz — sin TTS

**Given** el nivel activo es Aprendiz  
**When** el usuario hace click sobre Júpiter  
**Then** `window.speechSynthesis.speak` NO es invocado

---

### REQ-002: Cancelación de utterance anterior

**Prioridad:** MUST

Si el usuario hace click en un segundo planeta mientras el TTS está pronunciando el primero, `speakName` MUST cancelar el utterance en curso (`speechSynthesis.cancel()`) antes de iniciar el nuevo.

#### Escenario: Click rápido en dos planetas consecutivos

**Given** el TTS está pronunciando "Mercurio"  
**When** el usuario hace click sobre Venus antes de que termine  
**Then** `speechSynthesis.cancel()` es invocado  
**And** `speechSynthesis.speak` es invocado con `text = 'Venus'`

---

### REQ-003: Cero bytes de bundle adicional

**Prioridad:** MUST

La función `speakName` MUST implementarse usando exclusivamente la Web Speech API nativa del navegador. NO SHALL importar ninguna librería de TTS externa. El tamaño del fichero `speakName.ts` SHALL ser ≤15 líneas de código.

#### Escenario: Sin dependencias de bundle

**Given** el fichero `src/voice/speakName.ts` existe  
**When** se analizan sus imports  
**Then** no hay ningún import de librería externa (sólo imports de tipos TypeScript si aplica)

---

### REQ-004: Graceful degradation cuando TTS no está disponible

**Prioridad:** MUST

Si `window.speechSynthesis` es `undefined` (navegador sin soporte), `speakName` MUST no lanzar excepciones y continuar silenciosamente.

#### Escenario: TTS no disponible en el navegador

**Given** `window.speechSynthesis` es `undefined`  
**When** se llama a `speakName('Sol', 'es-ES')`  
**Then** no se lanza ninguna excepción  
**And** la consola no registra ningún error

#### Escenario: Testabilidad con mock de speechSynthesis

**Given** `window.speechSynthesis` está mockeado en Vitest  
**When** se llama a `speakName('Tierra', 'es-ES')`  
**Then** el mock registra exactamente una llamada a `speak` con el texto correcto

---

### REQ-005: Pronunciación correcta del nombre del Sol

**Prioridad:** SHOULD

El Sol SHALL pronunciarse con `lang = 'es-ES'` en locale español para garantizar la pronunciación correcta de la "o" abierta española, no latinoamericana.

#### Escenario: Pronunciación del Sol en locale ES

**Given** el nivel activo es Explorador y el locale es `es`  
**When** el usuario hace click sobre el Sol  
**Then** el utterance tiene `text = 'Sol'` y `lang = 'es-ES'`
