# State Management Specification

## Purpose

Definir las convenciones de gestión de estado global de la aplicación: nomenclatura de stores, uso de selectores y separación entre estado de UI y estado de dominio.

## Requirements

### Requirement: Convención de nomenclatura

El sistema DEBE exponer cada store mediante un hook con prefijo `use` y un nombre que describa su dominio (por ejemplo `useUiStore`, `useSceneStore`).

#### Scenario: Hook con prefijo correcto

- DADO un store de UI nuevo
- CUANDO se expone para consumo
- ENTONCES el hook exportado se llama `useUiStore` y no `uiStore` ni `getUiStore`

#### Scenario: Selector tipado

- DADO un componente que necesita una porción del store
- CUANDO consume el hook
- ENTONCES lo hace mediante un selector que devuelve sólo los campos que necesita, evitando re-renders innecesarios

### Requirement: Separación de dominios

El sistema DEBERÁ separar el estado de UI (preferencias, modales, idioma) del estado de dominio (escena, progreso pedagógico) en stores distintos.

#### Scenario: Store de UI aislado

- DADO un cambio en el estado de la escena 3D
- CUANDO el estado se actualiza
- ENTONCES los componentes que sólo dependen del store de UI no se re-renderizan
