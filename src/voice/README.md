# Módulo de Voz

Este directorio contendrá la capa de interacción por voz de Universo Aula.

## Alcance previsto

- **STT (Speech-to-Text)**: Reconocimiento de voz mediante la API Whisper de OpenAI o equivalente local,
  capturando preguntas del alumnado en tiempo real.
- **Detección de intención**: Análisis ligero del texto transcrito para extraer la intención educativa
  (consulta sobre un planeta, solicitud de zoom, cambio de escena, etc.).
- **Matching con la base de conocimiento**: Resolución de la intención contra el módulo `src/kb`,
  devolviendo el fragmento de contenido más relevante.
- **TTS (Text-to-Speech)**: Síntesis de voz mediante la Web Speech API del navegador (`SpeechSynthesis`)
  para leer la respuesta en voz alta, sin dependencias externas.

## Arquitectura tentativa

```
VoiceController
  ├── SpeechRecognizer   (wraps SpeechRecognition API o Whisper)
  ├── IntentParser       (reglas + embeddings ligeros)
  └── SpeechSynthesizer  (wraps SpeechSynthesis API)
```

## Estado

Placeholder. Implementación prevista en una fase posterior.
