/**
 * Safe reader for caught values. `catch` binds `unknown`, so anything thrown
 * (Error, string, plain object from an SDK) is narrowed here instead of using `any`.
 * Imported by both the Express backend and the app.
 */
export function errorMessage(err: unknown, fallback = ''): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

export function errorName(err: unknown): string {
  return typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    typeof (err as { name: unknown }).name === 'string'
    ? (err as { name: string }).name
    : '';
}
