import { describe, expect, it } from 'vitest';
import { resolveDetail, resolveTextSize } from './useDisplayPrefs';

describe('resolveTextSize', () => {
  it('starts over-60s on large text and everyone else on standard', () => {
    expect(resolveTextSize('auto', '60+')).toBe('large');
    expect(resolveTextSize('auto', '18-39')).toBe('standard');
    expect(resolveTextSize('auto', '')).toBe('standard');
  });

  it('always honours an explicit choice', () => {
    expect(resolveTextSize('standard', '60+')).toBe('standard');
    expect(resolveTextSize('xlarge', '18-39')).toBe('xlarge');
  });
});

describe('resolveDetail', () => {
  it('starts beginners, teenagers and over-60s on Simple', () => {
    expect(resolveDetail('auto', 'new', '18-39')).toBe('simple');
    expect(resolveDetail('auto', '<1yr', '40-59')).toBe('simple');
    expect(resolveDetail('auto', 'competitor', 'under18')).toBe('simple');
    expect(resolveDetail('auto', '3-5yrs', '60+')).toBe('simple');
  });

  it('starts experienced adults and unanswered profiles on Pro', () => {
    expect(resolveDetail('auto', '1-3yrs', '18-39')).toBe('pro');
    expect(resolveDetail('auto', 'competitor', '40-59')).toBe('pro');
    expect(resolveDetail('auto', '', '')).toBe('pro');
  });

  it('always honours an explicit choice', () => {
    expect(resolveDetail('pro', 'new', '60+')).toBe('pro');
    expect(resolveDetail('simple', 'competitor', '18-39')).toBe('simple');
  });
});
