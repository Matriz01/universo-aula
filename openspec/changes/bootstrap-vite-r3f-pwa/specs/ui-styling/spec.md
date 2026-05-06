# UI Styling Specification

## Purpose

Definir el sistema de estilos base: reset, design tokens y utilidades de accesibilidad disponibles para todos los componentes desde el primer día.

## Requirements

### Requirement: Reset y tokens

El sistema DEBE aplicar un reset CSS consistente y exponer un conjunto de design tokens (colores, espaciados, tipografía, radios) reutilizables en toda la app.

#### Scenario: Reset aplicado globalmente

- DADO un componente nuevo sin estilos propios
- CUANDO se renderiza
- ENTONCES los márgenes, paddings y estilos por defecto del navegador no introducen diferencias entre Chrome, Firefox y Safari

#### Scenario: Tokens consumibles

- DADO un componente que necesita un color primario
- CUANDO se aplica el estilo
- ENTONCES referencia el token semántico, no un valor literal hardcodeado

### Requirement: Accesibilidad base

El sistema DEBERÁ proveer utilidades para foco visible, contraste mínimo AA y soporte de `prefers-reduced-motion`.

#### Scenario: Foco visible por teclado

- DADO un usuario navegando con teclado
- CUANDO tabula a un elemento interactivo
- ENTONCES el elemento muestra un indicador de foco claramente visible y con contraste suficiente

#### Scenario: Movimiento reducido

- DADO un usuario con `prefers-reduced-motion: reduce` activo
- CUANDO la app aplica animaciones decorativas
- ENTONCES las animaciones se desactivan o se reducen a transiciones mínimas
