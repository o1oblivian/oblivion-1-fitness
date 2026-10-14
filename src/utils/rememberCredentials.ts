import { safeStorage } from './safeStorage';

const FLAG_KEY = 'o1fc_remember_me';
const EMAIL_KEY = 'o1fc_remember_email';
/** Older builds kept the password here. It is only ever deleted now. */
const LEGACY_SECRET_KEY = 'o1fc_remember_secret';

export interface RememberedCredentials {
  rememberMe: boolean;
  email: string;
}

function isRememberOn(raw: unknown): boolean {
  if (raw === null || raw === undefined || raw === '') return true;
  return raw === true || String(raw) === 'true' || String(raw) === '1';
}

export function loadRememberedCredentials(): RememberedCredentials {
  safeStorage.removeItem(LEGACY_SECRET_KEY);
  const rememberMe = isRememberOn(safeStorage.getItem(FLAG_KEY, null));
  const email = String(safeStorage.getItem(EMAIL_KEY, '') || '');
  return { rememberMe, email: rememberMe ? email : '' };
}

export function persistRememberedEmail(email: string): void {
  safeStorage.setItem(FLAG_KEY, 'true');
  safeStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

export function clearRememberedCredentials(): void {
  safeStorage.setItem(FLAG_KEY, 'false');
  safeStorage.removeItem(EMAIL_KEY);
  safeStorage.removeItem(LEGACY_SECRET_KEY);
}

export function applyRememberPreference(rememberMe: boolean, email: string): void {
  if (rememberMe && email.includes('@')) persistRememberedEmail(email);
  else clearRememberedCredentials();
}
