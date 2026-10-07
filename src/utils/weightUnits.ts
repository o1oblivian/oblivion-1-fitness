import { WeightUnit } from '../hooks/useAthleteSettings';

const LB_PER_KG = 2.2046226218;

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  if (unit === 'lbs') return Math.round(kg * LB_PER_KG * 10) / 10;
  return Math.round(kg * 10) / 10;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (unit === 'lbs') return Math.round((value / LB_PER_KG) * 10) / 10;
  return Math.round(value * 10) / 10;
}

export function formatLoad(kg: number, unit: WeightUnit): string {
  const n = kgToDisplay(kg, unit);
  if (n <= 0) return '--';
  return `${n}`;
}

export function loadUnitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'LBS' : 'KG';
}
