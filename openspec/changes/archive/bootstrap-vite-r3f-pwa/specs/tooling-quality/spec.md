# Tooling and Quality Specification

## Purpose

Garantizar calidad de código consistente mediante linting, formateo, tipado estricto y validación de mensajes de commit, aplicados de forma automática antes de cada commit.

## Requirements

### Requirement: Tipado estricto

El sistema DEBE usar TypeScript en modo estricto, con `strict: true` y verificación de tipos como parte de la build.

#### Scenario: Build con tipo inválido

- DADO un cambio que introduce un tipo incorrecto
- CUANDO se ejecuta la verificación de tipos
- ENTONCES la build falla y reporta el archivo y línea del error

### Requirement: Linting y formateo automatizados

El sistema DEBERÁ ejecutar lint y formateo sobre los archivos modificados antes de permitir un commit.

#### Scenario: Commit con código mal formateado

- DADO un cambio con violaciones de lint o formato
- CUANDO el desarrollador intenta hacer commit
- ENTONCES el hook pre-commit corrige automáticamente lo formateable y aborta el commit si quedan errores no auto-corregibles

#### Scenario: Commit limpio

- DADO un cambio sin violaciones
- CUANDO el desarrollador hace commit
- ENTONCES el commit se completa sin intervención

### Requirement: Conventional commits

El sistema DEBE rechazar mensajes de commit que no sigan la convención Conventional Commits.

#### Scenario: Mensaje no conforme

- DADO un mensaje de commit como `arreglo bug`
- CUANDO se intenta crear el commit
- ENTONCES el hook lo rechaza y muestra el formato esperado

#### Scenario: Mensaje conforme

- DADO un mensaje `fix(scene): corregir cámara inicial`
- CUANDO se intenta crear el commit
- ENTONCES el commit se acepta
