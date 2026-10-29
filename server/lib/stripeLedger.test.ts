import { describe, expect, it } from 'vitest';
import { defaultReturnOrigin, PRODUCTION_ORIGIN, safeReturnBase } from './stripeLedger';

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

describe('defaultReturnOrigin', () => {
  it('returns to the live site in production when the request came from the installed app', () => {
    expect(defaultReturnOrigin('https://localhost', true)).toBe(PRODUCTION_ORIGIN);
    expect(defaultReturnOrigin('capacitor://localhost', true)).toBe(PRODUCTION_ORIGIN);
    expect(defaultReturnOrigin(undefined, true)).toBe(PRODUCTION_ORIGIN);
  });

  it('keeps a real web origin in production', () => {
    expect(defaultReturnOrigin('https://o1.club', true)).toBe('https://o1.club');
  });

  it('keeps http://localhost:3000 for local development', () => {
    expect(defaultReturnOrigin(undefined, false)).toBe('http://localhost:3000');
    expect(defaultReturnOrigin('http://127.0.0.1:3000', false)).toBe('http://127.0.0.1:3000');
  });
});
