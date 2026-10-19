/**
 * Races a phone-bridge call against a deadline so a call the phone never answers rejects with a
 * readable message instead of leaving a spinner on screen forever.
 * Silent calls use the short default; calls that wait for a person (system prompts, sign-in
 * sheets, the camera) pass a longer limit.
 */
export const NATIVE_CALL_TIMEOUT_MS = 15_000;
export const NATIVE_PROMPT_TIMEOUT_MS = 120_000;

export function withNativeTimeout<T>(
  work: Promise<T>,
  message: string,
  timeoutMs: number = NATIVE_CALL_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
