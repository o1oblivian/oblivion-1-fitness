import type { OnboardingStatus } from '../../services/oauthDeepLink';

const ATTEMPTS = 3;
const GAP_MS = 2_000;

interface RestoreSteps {
  status: () => Promise<OnboardingStatus>;
  /** Pulls a saved consultation from the cloud; true when one was found. */
  hydrate: () => Promise<boolean>;
  wait?: (ms: number) => Promise<void>;
  isCancelled?: () => boolean;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Brings back a consultation finished earlier (another device, or before a reinstall).
 * A signed-in member who already completed it must not be sent through the questions again
 * just because the phone's connection was slow at launch, so a failed lookup is retried.
 * Returns true when a saved consultation is in place, or when the caller gave up waiting.
 */
export async function restoreConsultation({
  status,
  hydrate,
  wait = sleep,
  isCancelled = () => false,
}: RestoreSteps): Promise<boolean> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const answer = await status();
    if (isCancelled()) return true;
    if (answer === 'not_done') return false;
    if (answer === 'done' && (await hydrate().catch(() => false))) return true;
    if (attempt < ATTEMPTS - 1) await wait(GAP_MS);
    if (isCancelled()) return true;
  }
  return false;
}
