# App Shell Specification

## Purpose

Define el contenedor raíz de la aplicación: providers globales, error boundary, manifest PWA y service worker que envuelven cualquier feature posterior.

## Requirements

### Requirement: Providers globales

El sistema DEBE inicializar la app envuelta en los providers de i18n y de gestión de estado antes de renderizar cualquier ruta o escena.

#### Scenario: Arranque correcto

- DADO que la app se monta en el DOM
- CUANDO el árbol de React se renderiza por primera vez
- ENTONCES los hijos disponen de acceso a traducciones y al store sin lanzar excepciones de contexto no encontrado

#### Scenario: Fallo de un provider

- DADO que un provider lanza un error durante la inicialización
- CUANDO el error alcanza el árbol
- ENTONCES un error boundary raíz captura el fallo, registra el error y muestra una pantalla de fallback traducible

### Requirement: Instalabilidad PWA

El sistema DEBE exponer un manifest válido y un service worker registrado que permitan instalar la aplicación como PWA en navegadores compatibles.

#### Scenario: Manifest accesible

- DADO un build de producción servido con headers correctos
- CUANDO un navegador solicita `/manifest.webmanifest`
- ENTONCES recibe un manifest válido con `name`, `short_name`, `icons`, `start_url` y `display`

#### Scenario: Service worker activo

- DADO que el usuario carga la app por primera vez
- CUANDO la página termina de cargar
- ENTONCES el service worker queda registrado y cachea los assets críticos para la siguiente visita offline

### Requirement: Headers de seguridad

El sistema DEBE servir headers de aislamiento (COOP, COEP) y una política CSP estricta en todas las respuestas HTML del entorno productivo.

#### Scenario: Cabeceras presentes

- DADO el deploy productivo
- CUANDO un cliente hace GET a la raíz
- ENTONCES la respuesta incluye `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` y un `Content-Security-Policy` que restringe orígenes
