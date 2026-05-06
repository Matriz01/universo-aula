# i18n Foundation Specification

## Purpose

Establecer las bases de internacionalización para que toda la app consuma textos traducidos desde el primer commit, con `es` y `en` como locales iniciales y arquitectura preparada para 28 locales futuros.

## Requirements

### Requirement: Locales iniciales y namespaces

El sistema DEBE proveer al menos los locales `es` y `en` organizados en namespaces, siendo `common` el namespace por defecto.

#### Scenario: Carga del locale por defecto

- DADO un usuario que abre la app por primera vez
- CUANDO no existe preferencia previa de idioma
- ENTONCES la app detecta el idioma del navegador y carga `es` o `en`; si ninguno coincide, recurre al idioma por defecto definido

#### Scenario: Cambio de idioma en runtime

- DADO un usuario con la app cargada en `es`
- CUANDO solicita cambiar a `en`
- ENTONCES todos los textos visibles se actualizan a `en` sin recargar la página

### Requirement: Fallback chain

El sistema DEBERÁ resolver claves de traducción con una cadena de fallback: locale solicitado → idioma base → idioma por defecto, garantizando que nunca se muestre la clave cruda al usuario final.

#### Scenario: Clave existente en locale solicitado

- DADO un locale activo `es`
- CUANDO se solicita la clave `common.welcome`
- ENTONCES devuelve la traducción en español

#### Scenario: Clave ausente en locale solicitado

- DADO un locale activo `pt` (futuro) sin la clave `common.welcome`
- CUANDO se solicita esa clave
- ENTONCES devuelve la traducción del locale por defecto, no la clave literal
