/**
 * Entry rules for age, height and weight. Everything is stored in years, centimetres and kilograms;
 * the person types in the unit they chose in Settings and these helpers convert both ways.
 */

export const LB_PER_KG = 2.20462;
export const CM_PER_IN = 2.54;

export type BodyMetricKind = 'age' | 'height' | 'weight';
export type HeightUnit = 'cm' | 'in';
export type WeightUnit = 'kg' | 'lbs';

/** The range a typed value must fall in, in the unit the person is typing. */
export function metricRange(
  kind: BodyMetricKind,
  unit: HeightUnit | WeightUnit | null,
): { min: number; max: number } {
  if (kind === 'age') return { min: 10, max: 99 };
  if (kind === 'height') return unit === 'in' ? { min: 40, max: 100 } : { min: 100, max: 250 };
  return unit === 'lbs' ? { min: 66, max: 660 } : { min: 30, max: 300 };
}

const UNIT_WORDS: Record<string, string> = { cm: 'cm', in: 'in', kg: 'kg', lbs: 'lb' };

/** Keeps only what a number of this kind can contain: digits, and for weight one decimal place. */
export function cleanMetricDraft(raw: string, kind: BodyMetricKind): string {
  const normal = raw.replace(',', '.');
  if (kind !== 'weight')
    return normal
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, 3);
  const [whole = '', ...rest] = normal.replace(/[^\d.]/g, '').split('.');
  const intPart = whole.replace(/^0+(?=\d)/, '').slice(0, 3);
  if (rest.length === 0) return intPart;
  return `${intPart === '' ? '0' : intPart}.${rest.join('').slice(0, 1)}`;
}

export type MetricReading =
  { state: 'empty' } | { state: 'ok'; value: number } | { state: 'bad'; message: string };

const LABEL: Record<BodyMetricKind, string> = { age: 'Age', height: 'Height', weight: 'Weight' };

/** Reads a typed draft. `value` is in stored units (years, cm, kg). */
export function readMetricDraft(
  kind: BodyMetricKind,
  draft: string,
  unit: HeightUnit | WeightUnit | null,
): MetricReading {
  if (draft === '' || draft === '.') return { state: 'empty' };
  const typed = parseFloat(draft);
  const { min, max } = metricRange(kind, unit);
  if (!Number.isFinite(typed) || typed < min || typed > max) {
    const suffix = kind === 'age' ? '' : ` ${UNIT_WORDS[unit ?? ''] ?? ''}`;
    return { state: 'bad', message: `${LABEL[kind]} must be ${min} to ${max}${suffix}.` };
  }
  if (kind === 'height' && unit === 'in') return { state: 'ok', value: typed * CM_PER_IN };
  if (kind === 'weight' && unit === 'lbs') {
    return { state: 'ok', value: Math.round((typed / LB_PER_KG) * 100) / 100 };
  }
  return { state: 'ok', value: typed };
}

/** The stored value as text in the person's unit. Unset (0) is an empty field. */
export function metricToDraft(
  kind: BodyMetricKind,
  stored: number,
  unit: HeightUnit | WeightUnit | null,
): string {
  if (!Number.isFinite(stored) || stored <= 0) return '';
  if (kind === 'age') return String(Math.round(stored));
  if (kind === 'height') return String(Math.round(unit === 'in' ? stored / CM_PER_IN : stored));
  const shown = Math.round(stored * (unit === 'lbs' ? LB_PER_KG : 1) * 10) / 10;
  return String(shown);
}
