import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Athlete } from '../../services/coachService';
import { ago, dispatchTarget, kg, rosterId, stat } from './floorFormat';

describe('ago', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts minutes, then hours, then days', () => {
    expect(ago('2026-10-21T11:55:00Z')).toBe('5m ago');
    expect(ago('2026-10-21T09:00:00Z')).toBe('3h ago');
    expect(ago('2026-10-19T12:00:00Z')).toBe('2d ago');
  });

  it('never goes negative for a time slightly in the future', () => {
    expect(ago('2026-10-21T12:00:30Z')).toBe('0m ago');
  });

  it('is empty when there is no usable date', () => {
    expect(ago(undefined)).toBe('');
    expect(ago('not a date')).toBe('');
  });
});

describe('stat and kg', () => {
  it('rounds and groups real numbers, with the unit', () => {
    expect(stat(1234.6)).toBe('1,235');
    expect(stat(82, '%')).toBe('82%');
    expect(kg(12500)).toBe('12,500 kg');
  });

  it('shows "--" for missing, zero, negative, or non-finite values', () => {
    for (const value of [null, undefined, 0, -3, NaN, Infinity]) {
      expect(stat(value)).toBe('--');
      expect(kg(value)).toBe('--');
    }
  });
});

describe('rosterId and dispatchTarget', () => {
  const athlete: Athlete = {
    id: 'row-1',
    client_id: 'client-1',
    name: 'Sam Lee',
    handle: '@sam',
    status: 'Active',
    readiness: 80,
    volume: 1000,
  };

  it('prefers the client id over the row id', () => {
    expect(rosterId(athlete)).toBe('client-1');
    expect(rosterId({ ...athlete, client_id: undefined })).toBe('row-1');
  });

  it('uses the roster row when the target has one', () => {
    expect(dispatchTarget({ athleteId: 'client-1', name: 'Sam Lee', athlete })).toBe(athlete);
  });

  it('builds a minimal row for an athlete outside the roster', () => {
    expect(dispatchTarget({ athleteId: 'x-9', name: 'Pat', avatar: 'a.jpg' })).toEqual({
      id: 'x-9',
      client_id: 'x-9',
      name: 'Pat',
      handle: '',
      avatar: 'a.jpg',
      status: 'Active',
      readiness: null,
      volume: null,
    });
  });
});
