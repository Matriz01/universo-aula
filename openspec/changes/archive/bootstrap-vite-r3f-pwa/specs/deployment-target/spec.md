# Deployment Target Specification

## Purpose

Definir el pipeline de integración continua y el entorno de despliegue público de la app, garantizando que cada push a la rama principal llegue a producción sólo si pasa todas las verificaciones.

## Requirements

### Requirement: Pipeline de CI

El sistema DEBE ejecutar, en cada pull request y push a la rama principal, las fases de instalación, verificación de tipos, lint, tests y build.

#### Scenario: PR con todo verde

- DADO un PR con cambios válidos
- CUANDO el pipeline corre
- ENTONCES todas las fases terminan en verde y el PR queda mergeable

#### Scenario: PR con build roto

- DADO un PR cuya build falla
- CUANDO el pipeline corre
- ENTONCES la fase de build falla, el pipeline se marca rojo y el PR queda bloqueado

### Requirement: Despliegue automático

El sistema DEBERÁ desplegar automáticamente a producción tras un push exitoso a la rama principal.

#### Scenario: Push a main exitoso

- DADO un commit que entra a la rama principal con CI verde
- CUANDO el deploy se dispara
- ENTONCES la nueva versión queda accesible en la URL pública sin intervención manual

#### Scenario: Push con CI roja

- DADO un commit en la rama principal cuya CI no ha pasado
- CUANDO el sistema evalúa si desplegar
- ENTONCES el deploy NO se ejecuta y la versión anterior permanece servida

### Requirement: Headers en producción

El sistema DEBE servir en el entorno productivo los headers de seguridad COOP, COEP y CSP definidos por el dominio app-shell.

#### Scenario: Verificación post-deploy

- DADO un deploy productivo recién publicado
- CUANDO se hace una petición HEAD a la raíz
- ENTONCES los headers COOP, COEP y CSP están presentes con los valores esperados
