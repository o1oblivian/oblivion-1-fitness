/**
 * Oblivion 1 Fitness Club - Dial Modal Types & Utility Math
 * Strict File Ceiling: < 140 lines
 */

export interface DialConfig {
  unit: string;
  min: number;
  max: number;
  step: number;
  title: string;
  presets: number[];
  accentColor: string;
}

export function resolveDialConfig(
  unit: string,
  min?: number,
  max?: number,
  step?: number,
  title?: string,
  presets?: number[]
): DialConfig {
  const upper = unit.toUpperCase();
  const isKg = upper === 'KG';
  const isReps = upper === 'REPS';
  const isSteps = upper === 'STEPS';
  const isRpe = upper === 'RPE';

  const resolvedMin = min ?? (isRpe ? 6 : 0);
  const resolvedMax = max ?? (isKg ? 400 : isSteps ? 40000 : isRpe ? 10 : 60);
  const resolvedStep = step ?? (isKg ? 2.5 : isSteps ? 250 : isRpe ? 0.5 : 1);

  const resolvedTitle =
    title ||
    (isKg
      ? 'WEIGHT LOAD'
      : isReps
      ? 'REPETITIONS'
      : isSteps
      ? 'DAILY STEP ENGINE'
      : isRpe
      ? 'RPE / RIR'
      : `${unit} SELECTOR`);

  const resolvedPresets =
    presets ||
    (isKg
      ? [20, 40, 60, 80, 100, 140, 180, 220]
      : isReps
      ? [5, 8, 10, 12, 15, 20, 25, 30]
      : isSteps
      ? [5000, 8000, 10000, 12000, 15000]
      : isRpe
      ? [6, 7, 7.5, 8, 8.5, 9, 9.5, 10]
      : [10, 20, 30, 40, 50]);

  // Oblivion 1 Crimson for Weights/Sets, Amber for Reps/Fuel, Cyan for Steps, Emerald for RPE
  const accentColor = isKg
    ? '#C4121A'
    : isReps
    ? '#d97706'
    : isSteps
    ? '#0284c7'
    : isRpe
    ? '#059669'
    : '#C4121A';

  return {
    unit: upper,
    min: resolvedMin,
    max: resolvedMax,
    step: resolvedStep,
    title: resolvedTitle,
    presets: resolvedPresets,
    accentColor,
  };
}

export interface DialScaleMarker {
  fraction: number;
  label: string;
}

export function generateScaleMarkers(config: DialConfig): DialScaleMarker[] {
  const { min, max, unit } = config;
  const range = max - min;

  if (unit === 'KG') {
    return [
      { fraction: 0, label: '0' },
      { fraction: 0.25, label: `${Math.round(min + range * 0.25)}` },
      { fraction: 0.5, label: `${Math.round(min + range * 0.5)}` },
      { fraction: 0.75, label: `${Math.round(min + range * 0.75)}` },
      { fraction: 1.0, label: `${max}` },
    ];
  }

  if (unit === 'REPS') {
    return [
      { fraction: 0, label: '0' },
      { fraction: 0.2, label: '12' },
      { fraction: 0.4, label: '24' },
      { fraction: 0.6, label: '36' },
      { fraction: 0.8, label: '48' },
      { fraction: 1.0, label: `${max}` },
    ];
  }

  return [
    { fraction: 0, label: `${min}` },
    { fraction: 0.33, label: `${Math.round(min + range * 0.33)}` },
    { fraction: 0.66, label: `${Math.round(min + range * 0.66)}` },
    { fraction: 1.0, label: `${max}` },
  ];
}
