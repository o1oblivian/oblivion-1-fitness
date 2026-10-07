import { safeStorage } from './safeStorage';

const FLAG_KEY = 'o1fc_remember_me';
const EMAIL_KEY = 'o1fc_remember_email';
const SECRET_KEY = 'o1fc_remember_secret';

export interface RememberedCredentials {
  rememberMe: boolean;
  email: string;
  password: string;
}

function encodeSecret(plain: string): string {
  try {
    return btoa(unescape(encodeURIComponent(plain)));
  } catch {
    return plain;
  }
}

function decodeSecret(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
}

export function loadRememberedCredentials(): RememberedCredentials {
  const flag = String(safeStorage.getItem(FLAG_KEY, '') || '');
  const rememberMe = flag === 'true' || flag === '1';
  const email = String(safeStorage.getItem(EMAIL_KEY, '') || '');
  const secret = String(safeStorage.getItem(SECRET_KEY, '') || '');
  return {
    rememberMe,
    email: rememberMe ? email : '',
    password: rememberMe && secret ? decodeSecret(secret) : '',
  };
}

export function persistRememberedCredentials(email: string, password: string): void {
  const clean = email.trim().toLowerCase();
  safeStorage.setItem(FLAG_KEY, 'true');
  safeStorage.setItem(EMAIL_KEY, clean);
  if (password) safeStorage.setItem(SECRET_KEY, encodeSecret(password));
}

export function clearRememberedCredentials(): void {
  safeStorage.setItem(FLAG_KEY, 'false');
  safeStorage.removeItem(EMAIL_KEY);
  safeStorage.removeItem(SECRET_KEY);
}

export function applyRememberPreference(rememberMe: boolean, email: string, password: string): void {
  if (rememberMe && email.includes('@')) persistRememberedCredentials(email, password);
  else clearRememberedCredentials();
}
