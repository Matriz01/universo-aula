# Base de Conocimiento (KB)

Este directorio contendrá los datos educativos curados de Universo Aula.

## Alcance previsto

- **Contenido curado**: Información astronómica verificada y adaptada a niveles pedagógicos
  (primaria, secundaria, bachillerato, divulgación).
- **Esquema de datos**: JSON o YAML con campos normalizados por entidad (planeta, estrella, galaxia,
  fenómeno, misión espacial…). El esquema definitivo se definirá al inicio de esta fase.
- **Fuentes**: NASA Open Data, ESA, IAU, Solar System Scope y otras fuentes abiertas con licencia
  compatible (CC BY o dominio público). Todas las fuentes se documentarán en `CREDITS.md`.
- **Localización**: Cada entrada incluirá versiones en `es` y `en`, extensibles a otros idiomas.
- **Indexación ligera**: Búsqueda por palabras clave para el módulo de voz (`src/voice`), sin
  servidor — todo en cliente.

## Estructura tentativa

```
src/kb/
  schema/          # Definición de tipos TypeScript
  entries/         # Archivos JSON por categoría (planetas, estrellas, etc.)
  index.ts         # Punto de entrada que expone la KB al resto de la app
```

## Estado

Placeholder. Implementación prevista en una fase posterior.
