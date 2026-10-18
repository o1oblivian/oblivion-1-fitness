import { durableClear } from '../utils/durableStore';

/**
 * Local data belongs to one account. Signing out, or a different account signing in on the same
 * device, wipes it so nobody sees (or syncs into their cloud) another person's history.
 */
const OWNER_KEY = 'o1fc_device_owner';
/** Read by supabaseClient before the auth client starts, so a token refresh racing the reload cannot restore the session. */
const SIGNED_OUT_PENDING_KEY = 'o1fc_signed_out_pending';
const APP_KEY = /^(o1|olfc)/i;

/** Device-level keys that are not personal data. */
const DEVICE_KEYS = new Set([
  'o1_club_taxonomy_v1',
  'o1_pending_invite',
  'o1_pending_reel_link',
  'o1fc_remember_me',
  'o1fc_remember_email',
  'o1fc_onboarding_completed',
  'olfc_onboarding_completed',
  'o1fc_tactile_settings',
  'o1fc_theme_preference',
  'o1fc_hint_swipe_delete_v3',
  'o1fc_last_crash_v1',
  'o1fc_motion_steps_off',
  'o1fc_health_disclaimer_dismissed',
  SIGNED_OUT_PENDING_KEY,
]);
/** Already keyed by user id. */
const DEVICE_PREFIXES = ['o1fc_athlete_trial_v2_'];

const isAccountKey = (key: string) =>
  APP_KEY.test(key) &&
  key !== OWNER_KEY &&
  !DEVICE_KEYS.has(key) &&
  !DEVICE_PREFIXES.some((p) => key.startsWith(p));

function wipe(storage: Storage): void {
  for (const key of Object.keys(storage)) {
    if (isAccountKey(key)) storage.removeItem(key);
  }
}

export function clearAccountData(): void {
  try {
    wipe(localStorage);
    wipe(sessionStorage);
  } catch {
    /* storage unavailable */
  }
  durableClear();
}

interface SessionUser {
  id: string;
  email?: string | null;
}

export function storedSessionUser(): SessionUser | null {
  try {
    const key = Object.keys(localStorage).find((k) => /^sb-.+-auth-token$/.test(k));
    if (!key) return null;
    const user = JSON.parse(localStorage.getItem(key) || 'null')?.user;
    return typeof user?.id === 'string' && user.id ? { id: user.id, email: user.email } : null;
  } catch {
    return null;
  }
}

/** Wipes the previous account and hands the device to `user`. App reads the identity keys on first render. */
function takeOver(user: SessionUser): void {
  clearAccountData();
  localStorage.setItem(OWNER_KEY, user.id);
  localStorage.setItem('o1fc_user_id', user.id);
  if (user.email) localStorage.setItem('o1fc_user_email', user.email);
}

/** Runs before any store reads storage, so stores never load another account's data. */
export function claimDeviceAtBoot(): void {
  const user = storedSessionUser();
  if (!user) return;
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner && owner !== user.id) takeOver(user);
    else localStorage.setItem(OWNER_KEY, user.id);
  } catch {
    /* storage unavailable */
  }
}

/** For sign-ins while the app is open. Reloads when a different account takes over the device. */
export function claimDeviceForUser(user: SessionUser): void {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner === user.id) return;
    if (!owner) {
      localStorage.setItem(OWNER_KEY, user.id);
      return;
    }
    takeOver(user);
  } catch {
    return;
  }
  window.location.reload();
}

/** Explicit sign-out: forget this account's local data and restart clean. */
export function releaseDevice(): void {
  clearAccountData();
  try {
    localStorage.removeItem(OWNER_KEY);
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.+-auth-token/.test(key)) localStorage.removeItem(key);
    }
    localStorage.setItem(SIGNED_OUT_PENDING_KEY, '1');
  } catch {
    /* storage unavailable */
  }
  // Detach the store customer so the next account on this phone never inherits this one's plan.
  // Loaded on demand (this file must not import billing at start-up) and capped so sign-out never hangs.
  const storeLogOut = import('./revenueCatService')
    .then((m) => m.revenueCatService.logOut())
    .catch(() => undefined);
  const cap = new Promise<void>((resolve) => setTimeout(resolve, 1500));
  void Promise.race([storeLogOut, cap]).then(() => window.location.reload());
}
