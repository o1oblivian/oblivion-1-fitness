export type ScanErrorCode =
  /** The source answered and has no record of this item. */
  | 'not_found'
  /** The photo or screen was read and held no usable numbers. */
  | 'unreadable'
  /** The request never got an answer (offline, timeout, dropped connection). */
  | 'network'
  /** The server answered with a failure status. */
  | 'server'
  /** The device has no reader for this kind of scan. */
  | 'unsupported';

/** A scanner or lookup failure that the UI shows as-is and can branch on by `code`. */
export class ScanError extends Error {
  readonly code: ScanErrorCode;
  /** HTTP status when a server answered, otherwise `null`. */
  readonly status: number | null;

  constructor(
    code: ScanErrorCode,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ScanError';
    this.code = code;
    this.status = options.status ?? null;
  }
}

/** The server's own `{ error }` message, or a status line when the body has none. */
export async function serverFailure(res: Response, what: string): Promise<ScanError> {
  const body = await res.json().catch((err: unknown) => {
    console.error(`[${what}] ${res.status} reply was not JSON`, err);
    return null;
  });
  const message =
    typeof body?.error === 'string' && body.error
      ? body.error
      : `${what} failed: the server answered ${res.status}.`;
  return new ScanError('server', message, { status: res.status });
}
