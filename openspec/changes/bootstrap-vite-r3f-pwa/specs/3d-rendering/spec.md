# 3D Rendering Specification

## Purpose

Definir el wrapper de renderizado 3D base: un canvas declarativo con cámara y luz iniciales sobre el que se montarán las futuras escenas pedagógicas.

## Requirements

### Requirement: Canvas base

El sistema DEBE exponer un componente Canvas declarativo que monte una escena 3D con cámara orbital y al menos una fuente de luz ambiental.

#### Scenario: Render inicial sin contenido

- DADO un Canvas montado sin hijos
- CUANDO la app se carga
- ENTONCES la escena se renderiza sin errores en consola y muestra un fondo limpio

#### Scenario: Cámara responde a interacción

- DADO un Canvas con cámara orbital
- CUANDO el usuario arrastra o usa pinch en el lienzo
- ENTONCES la cámara orbita o hace zoom respetando límites configurados

### Requirement: Resiliencia ante WebGL no disponible

El sistema DEBERÁ detectar la ausencia de soporte WebGL y mostrar un mensaje accesible en lugar de fallar en blanco.

#### Scenario: Navegador sin WebGL

- DADO un navegador con WebGL deshabilitado
- CUANDO la app intenta montar el Canvas
- ENTONCES se muestra un mensaje traducido explicando el requisito y la app no queda en pantalla negra
