const STORAGE_KEY = 'o1fc_input_method';

export type InputMethod = 'dial' | 'numpad';

export function getInputMethod(): InputMethod {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'numpad') return 'numpad';
  } catch {}
  return 'dial';
}

export function setInputMethod(method: InputMethod): void {
  try {
    localStorage.setItem(STORAGE_KEY, method);
  } catch {}
}
