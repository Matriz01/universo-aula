/**
 * speakName — Web Speech TTS. Función pura, ~10 líneas.
 * Cancela utterance previa, no-op si speechSynthesis no existe.
 */
export function speakName(name: string, lang: string): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}
