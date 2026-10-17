import { describe, expect, it } from 'vitest';
import { safeReturnBase } from './stripeLedger';

describe('safeReturnBase', () => {
  const fallback = 'https://app.example';

  it('keeps https and the app scheme, dropping query and hash', () => {
    expect(safeReturnBase('https://o1.club/coach?x=1#y', fallback)).toBe('https://o1.club/coach');
    expect(safeReturnBase('com.o1fc.fitness://stripe/return', fallback)).toBe(
      'com.o1fc.fitness://stripe/return',
    );
  });

  it('refuses script, data and file links', () => {
    expect(safeReturnBase('javascript:alert(1)', fallback)).toBe(fallback);
    expect(safeReturnBase('data:text/html,hi', fallback)).toBe(fallback);
    expect(safeReturnBase('file:///etc/passwd', fallback)).toBe(fallback);
  });

  it('falls back for anything that is not a url', () => {
    expect(safeReturnBase(undefined, fallback)).toBe(fallback);
    expect(safeReturnBase('', fallback)).toBe(fallback);
    expect(safeReturnBase('not a url', fallback)).toBe(fallback);
  });
});
