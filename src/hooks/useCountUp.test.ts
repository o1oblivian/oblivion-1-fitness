import { describe, expect, it } from 'vitest';
import { easeOutCubic } from './useCountUp';

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('moves fast first and settles slowly', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(0.9) - easeOutCubic(0.8)).toBeLessThan(
      easeOutCubic(0.2) - easeOutCubic(0.1),
    );
  });
});
