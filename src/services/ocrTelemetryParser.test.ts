import { describe, expect, it } from 'vitest';
import { parseTelemetryFromOcrText } from './ocrTelemetryParser';

describe('watch step read', () => {
  it('joins a segmented 6 151 into 6151 steps and ignores the clock', () => {
    const read = parseTelemetryFromOcrText('P 4:14  6 151');
    expect(read.deviceType).toBe('watch');
    expect(read.steps).toBe(6151);
    expect(read.elapsedMinutes).toBe(0);
  });

  it('reads a solid steps label from a sports digital', () => {
    expect(parseTelemetryFromOcrText('6151 STEPS').steps).toBe(6151);
  });

  it('reads an Apple Watch or Garmin step label', () => {
    expect(parseTelemetryFromOcrText('Steps 8421').steps).toBe(8421);
    expect(parseTelemetryFromOcrText('12034 steps').deviceType).toBe('watch');
  });

  it('joins a Fitbit-style comma count', () => {
    expect(parseTelemetryFromOcrText('8,421 steps').steps).toBe(8421);
  });

  it('accepts an analog face that only shows the time', () => {
    const read = parseTelemetryFromOcrText('10:41');
    expect(read.deviceType).toBe('watch');
    expect(read.steps).toBeNull();
  });

  it('does not invent steps from a console distance', () => {
    const read = parseTelemetryFromOcrText('Treadmill  5.2 km  30:00');
    expect(read.deviceType).toBe('console');
    expect(read.steps).toBeNull();
    expect(read.distanceKm).toBe(5.2);
  });
});
