import { describe, expect, it } from 'vitest';
import { cardioDevice, plausibleHeartRate } from './cardioReading';

const none = { speedKmh: null, inclinePct: null, watts: null };

describe('plausibleHeartRate', () => {
  it('treats the 0 a console shows without a strap as unread', () => {
    expect(plausibleHeartRate(0)).toBeNull();
    expect(plausibleHeartRate(null)).toBeNull();
    expect(plausibleHeartRate(400)).toBeNull();
    expect(plausibleHeartRate(142)).toBe(142);
  });
});

describe('cardioDevice', () => {
  it('calls a Life Fitness treadmill with an Apple Watch badge a console', () => {
    expect(cardioDevice('WATCH', { speedKmh: 0.8, inclinePct: 0, watts: 3 }, null)).toBe('console');
  });

  it('keeps a watch reading with no machine metrics a watch', () => {
    expect(cardioDevice('WATCH', none, null)).toBe('watch');
  });

  it('falls back to the backup reader when the model gave no type', () => {
    expect(cardioDevice(undefined, none, 'console')).toBe('console');
    expect(cardioDevice(undefined, none, null)).toBeNull();
  });
});
