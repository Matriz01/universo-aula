# Testing Foundation Specification

## Purpose

Establecer las dos capas de testing del proyecto: tests unitarios rápidos y tests end-to-end sobre el build real, con ejemplos verdes desde el primer commit.

## Requirements

### Requirement: Tests unitarios

El sistema DEBE proveer una infraestructura de tests unitarios capaz de ejecutar componentes React aislados y lógica pura, con al menos un test verde de referencia.

#### Scenario: Suite unitaria pasa

- DADO el repo recién clonado tras `pnpm install`
- CUANDO se ejecuta la suite unitaria
- ENTONCES termina con todos los tests en verde y reporta cobertura del archivo de ejemplo

#### Scenario: Test que falla bloquea CI

- DADO un test que verifica una invariante rota
- CUANDO la suite se ejecuta en CI
- ENTONCES el job falla con código de salida distinto de cero

### Requirement: Tests end-to-end

El sistema DEBERÁ proveer una suite E2E que ejecute al menos un escenario sobre el build de producción, con un test verde de referencia.

#### Scenario: E2E sobre build real

- DADO un build de producción servido localmente
- CUANDO la suite E2E navega a la home
- ENTONCES verifica que el documento renderiza el texto traducido y termina en verde

#### Scenario: Captura de fallo

- DADO un test E2E que falla
- CUANDO el runner termina
- ENTONCES adjunta artefactos (captura, traza) que permiten diagnosticar el fallo
