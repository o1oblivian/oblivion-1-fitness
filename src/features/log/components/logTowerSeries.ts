import type {
  DayTelemetryRecord,
  NutritionDayRecord,
  TelemetryCategory,
  WorkoutDayRecord,
} from '../store/useTelemetryHistoryStore';
import type { TowerPoint } from './LogProgressTowers';
import {
  WEEKDAYS,
  cleanCardio,
  cleanNutrition,
  cleanWorkout,
  dateKeyOf,
  sessionKg,
} from './logHistoryFormat';

export type ChartSpan = 'week' | 'month' | 'year';

export interface TowerContext {
  category: TelemetryCategory;
  span: ChartSpan;
  today: Date;
  /** Monday of the week being viewed. */
  mondayDate: Date;
  selectedDate: Date;
  historyByDate: Record<string, Partial<DayTelemetryRecord>>;
  /** Today's in-progress records; these win over saved history for today. */
  liveWorkout?: WorkoutDayRecord;
  liveFood?: NutritionDayRecord;
}

export interface TowerSeries {
  points: TowerPoint[];
  unit: string;
  selectedKey: string;
}

/** Cardio is the only channel with two measures (minutes and kcal); the rest are one number. */
type DayValue = number | { minutes: number; kcal: number };

interface Bucket {
  key: string;
  label: string;
  value: number;
  minutes: number;
  kcal: number;
}

const DAY_MS = 86_400_000;

/** Short label for a tower value: blank for zero, `1.2k` from a thousand up. */
export function formatTowerValue(category: TelemetryCategory, value: number): string {
  if (value <= 0) return '';
  if (category === 'sleep') return String(Math.round(value * 10) / 10);
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

/** Monday of the week containing `date`, at local midnight. */
export function mondayOf(date: Date): Date {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  const weekday = monday.getDay();
  monday.setDate(monday.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return monday;
}

/** Whole weeks between this week and the week of `target`, never positive (the future is not viewable). */
export function weekOffsetOf(target: Date, today: Date): number {
  const weeks = Math.round((mondayOf(target).getTime() - mondayOf(today).getTime()) / (7 * DAY_MS));
  return Math.min(0, weeks);
}

function unitFor(category: TelemetryCategory, buckets: Bucket[]): string {
  if (category === 'workout') return 'kg';
  if (category === 'nutrition') return 'kcal';
  if (category === 'sleep') return 'h';
  if (category === 'meditation') return 'min';
  return buckets.some((bucket) => bucket.minutes > 0) ? 'min' : 'kcal';
}

function readDay(ctx: TowerContext, date: Date, todayKey: string): DayValue {
  const key = dateKeyOf(date);
  const record = ctx.historyByDate[key];
  const isToday = key === todayKey;
  switch (ctx.category) {
    case 'workout':
      return sessionKg((isToday && ctx.liveWorkout) || cleanWorkout(record?.workout));
    case 'cardio': {
      const session = cleanCardio(record?.cardio);
      return { minutes: session?.durationMinutes || 0, kcal: session?.burnedKcal || 0 };
    }
    case 'nutrition':
      return ((isToday && ctx.liveFood) || cleanNutrition(record?.nutrition))?.calories || 0;
    case 'sleep':
      return record?.sleep?.hasData ? record.sleep.durationHours || 0 : 0;
    default:
      return record?.meditation?.minutes || 0;
  }
}

/** Adds up `length` consecutive days starting at `start` into one bar. */
function sumDays(ctx: TowerContext, todayKey: string, start: Date, length: number): Bucket {
  const bucket: Bucket = { key: start.toDateString(), label: '', value: 0, minutes: 0, kcal: 0 };
  for (let offset = 0; offset < length; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const raw = readDay(ctx, date, todayKey);
    if (typeof raw === 'number') bucket.value += raw;
    else {
      bucket.minutes += raw.minutes;
      bucket.kcal += raw.kcal;
    }
  }
  return bucket;
}

function toSeries(
  category: TelemetryCategory,
  buckets: Bucket[],
  selectedKey: string,
): TowerSeries {
  const unit = unitFor(category, buckets);
  const measure = (bucket: Bucket) =>
    category === 'cardio' ? (unit === 'min' ? bucket.minutes : bucket.kcal) : bucket.value;
  return {
    selectedKey,
    unit,
    points: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      value: measure(bucket),
    })),
  };
}

/** The bars for the Progress chart: seven days, four weeks, or twelve months. */
export function buildTowerSeries(ctx: TowerContext): TowerSeries {
  const todayKey = dateKeyOf(ctx.today);

  if (ctx.span === 'year') {
    const months = Array.from({ length: 12 }, (_, index) => {
      const start = new Date(ctx.today.getFullYear(), ctx.today.getMonth() - (11 - index), 1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      return {
        ...sumDays(ctx, todayKey, start, daysInMonth),
        label: start.toLocaleDateString('en-US', { month: 'short' }),
      };
    });
    const selectedMonth = new Date(ctx.selectedDate.getFullYear(), ctx.selectedDate.getMonth(), 1);
    return toSeries(ctx.category, months, selectedMonth.toDateString());
  }

  if (ctx.span === 'month') {
    const weeks = [3, 2, 1, 0].map((weeksAgo) => {
      const start = new Date(ctx.mondayDate);
      start.setDate(ctx.mondayDate.getDate() - weeksAgo * 7);
      return {
        ...sumDays(ctx, todayKey, start, 7),
        label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
    return toSeries(ctx.category, weeks, ctx.mondayDate.toDateString());
  }

  const days = WEEKDAYS.map((label, index) => {
    const start = new Date(ctx.mondayDate);
    start.setDate(ctx.mondayDate.getDate() + index);
    return { ...sumDays(ctx, todayKey, start, 1), label };
  });
  return toSeries(ctx.category, days, ctx.selectedDate.toDateString());
}
