import { describe, expect, it } from 'vitest';
import { resolveDetail, resolveTextSize } from './useDisplayPrefs';
import { textSizeForZoom } from '../utils/systemTextSize';

describe('resolveTextSize', () => {
  it('starts over-60s on large text and everyone else on standard', () => {
    expect(resolveTextSize('auto', '60+')).toBe('large');
    expect(resolveTextSize('auto', '18-39')).toBe('standard');
    expect(resolveTextSize('auto', '')).toBe('standard');
  });

  it('always honours an explicit choice', () => {
    expect(resolveTextSize('standard', '60+')).toBe('standard');
    expect(resolveTextSize('xlarge', '18-39')).toBe('xlarge');
    expect(resolveTextSize('standard', '18-39', 'xlarge')).toBe('standard');
  });

  it('follows the phone when it is set larger than the age default', () => {
    expect(resolveTextSize('auto', '18-39', 'xlarge')).toBe('xlarge');
    expect(resolveTextSize('auto', '60+', 'xlarge')).toBe('xlarge');
    expect(resolveTextSize('auto', '', 'large')).toBe('large');
  });

  it('never goes smaller than the age default because of the phone', () => {
    expect(resolveTextSize('auto', '60+', 'standard')).toBe('large');
    expect(resolveTextSize('auto', '60+', null)).toBe('large');
  });
});

describe('textSizeForZoom', () => {
  it('maps the phone multiplier onto the three sizes', () => {
    expect(textSizeForZoom(1)).toBe('standard');
    expect(textSizeForZoom(1.1)).toBe('large');
    expect(textSizeForZoom(1.29)).toBe('large');
    expect(textSizeForZoom(1.3)).toBe('xlarge');
    expect(textSizeForZoom(2.4)).toBe('xlarge');
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
