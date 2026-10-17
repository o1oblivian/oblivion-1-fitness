import { describe, expect, it } from 'vitest';
import type { DayTelemetryRecord } from '../store/useTelemetryHistoryStore';
import { buildTowerSeries, formatTowerValue, mondayOf, weekOffsetOf } from './logTowerSeries';

// Sunday 18 Oct 2026, local time. Its week starts on Monday 12 Oct.
const TODAY = new Date(2026, 9, 18, 9, 30);
const MONDAY = new Date(2026, 9, 12);

/** Only the fields the chart reads; the full record has many more. */
const record = (partial: object) => partial as Partial<DayTelemetryRecord>;

const sleepDay = (hours: number) =>
  record({ sleep: { hasData: true, durationHours: hours, recoveryPercent: 0 } });

describe('formatTowerValue', () => {
  it('hides zero and negative values', () => {
    expect(formatTowerValue('workout', 0)).toBe('');
    expect(formatTowerValue('workout', -5)).toBe('');
  });

  it('keeps one decimal for sleep and abbreviates thousands elsewhere', () => {
    expect(formatTowerValue('sleep', 7.46)).toBe('7.5');
    expect(formatTowerValue('workout', 1250)).toBe('1.3k');
    expect(formatTowerValue('nutrition', 842.4)).toBe('842');
  });
});

describe('week maths', () => {
  it('finds the Monday of any weekday, Sunday included', () => {
    expect(mondayOf(TODAY).getTime()).toBe(MONDAY.getTime());
    expect(mondayOf(new Date(2026, 9, 12, 23, 0)).getTime()).toBe(MONDAY.getTime());
  });

  it('counts whole weeks back and never goes into the future', () => {
    expect(weekOffsetOf(new Date(2026, 9, 5), TODAY)).toBe(-1);
    expect(weekOffsetOf(new Date(2026, 8, 28), TODAY)).toBe(-2);
    expect(weekOffsetOf(new Date(2026, 10, 3), TODAY)).toBe(0);
  });

  it('puts a month that starts late in the week on that week, not the next one', () => {
    // 1 Oct 2026 is a Thursday; its week began Monday 28 Sep, two weeks before 12 Oct.
    expect(weekOffsetOf(new Date(2026, 9, 1), TODAY)).toBe(-2);
  });
});

describe('buildTowerSeries', () => {
  const base = {
    category: 'sleep' as const,
    today: TODAY,
    mondayDate: MONDAY,
    selectedDate: TODAY,
    historyByDate: { '2026-10-13': sleepDay(7.5), '2026-10-14': sleepDay(6) },
  };

  it('returns seven labelled days for the week view', () => {
    const series = buildTowerSeries({ ...base, span: 'week' });
    expect(series.unit).toBe('h');
    expect(series.points.map((p) => p.label)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    expect(series.points.map((p) => p.value)).toEqual([0, 7.5, 6, 0, 0, 0, 0]);
    expect(series.selectedKey).toBe(TODAY.toDateString());
  });

  it('sums four weeks for the month view, newest last', () => {
    const series = buildTowerSeries({ ...base, span: 'month' });
    expect(series.points).toHaveLength(4);
    expect(series.points[3].value).toBe(13.5);
    expect(series.selectedKey).toBe(MONDAY.toDateString());
  });

  it('sums twelve months for the year view and marks the selected month', () => {
    const series = buildTowerSeries({ ...base, span: 'year' });
    expect(series.points).toHaveLength(12);
    expect(series.points[11].value).toBe(13.5);
    expect(series.selectedKey).toBe(new Date(2026, 9, 1).toDateString());
  });

  it('measures cardio in minutes when any are logged, otherwise kcal', () => {
    const cardio = (durationMinutes: number, burnedKcal: number) =>
      record({ cardio: { hasData: true, durationMinutes, burnedKcal, activityType: 'Run' } });
    const minutes = buildTowerSeries({
      ...base,
      category: 'cardio',
      span: 'week',
      historyByDate: { '2026-10-13': cardio(30, 300) },
    });
    expect(minutes.unit).toBe('min');
    expect(minutes.points[1].value).toBe(30);

    const kcal = buildTowerSeries({
      ...base,
      category: 'cardio',
      span: 'week',
      historyByDate: { '2026-10-13': cardio(0, 300) },
    });
    expect(kcal.unit).toBe('kcal');
    expect(kcal.points[1].value).toBe(300);
  });
});
