import { describe, expect, it } from 'vitest';
import { pickStoreKey } from './purchasesService';

describe('pickStoreKey', () => {
  const fallback = 'goog_from_code';

  it('uses the key set at build time when its prefix matches the platform', () => {
    expect(pickStoreKey('goog_from_build', 'goog_', fallback)).toBe('goog_from_build');
  });

  it('trims whitespace pasted into the build variable', () => {
    expect(pickStoreKey('  goog_from_build \n', 'goog_', fallback)).toBe('goog_from_build');
  });

  it('falls back to the key in code when the build sets none', () => {
    expect(pickStoreKey(undefined, 'goog_', fallback)).toBe(fallback);
    expect(pickStoreKey('   ', 'goog_', fallback)).toBe(fallback);
  });

  it('ignores a key from the other platform', () => {
    expect(pickStoreKey('appl_ios_key', 'goog_', fallback)).toBe(fallback);
  });
});
