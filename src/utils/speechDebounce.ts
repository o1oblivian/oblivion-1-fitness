let speechTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSpeak(text: string, delay = 120) {
  if (speechTimer) clearTimeout(speechTimer);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  speechTimer = setTimeout(() => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 0.95;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }, delay);
}

export function cancelSpeech() {
  if (speechTimer) { clearTimeout(speechTimer); speechTimer = null; }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
