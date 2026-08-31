// src/utils/frequencyDefaults.ts

const FREQ_DEFAULTS_STORAGE_KEY = 'lumina_smart_frequency_defaults';
const FREQ_COUNTS_STORAGE_KEY = 'lumina_smart_frequency_counts';

interface FrequencyDefaultsStore {
  [fieldKey: string]: number;
}

interface FrequencyCountsStore {
  [fieldKey: string]: {
    [valueKey: string]: number;
  };
}

/**
 * Returns the personalized default value for a given field key if set (or 0 by default).
 */
export function getSmartDefault(fieldKey: string, fallbackDefault: number = 0): number {
  try {
    const raw = localStorage.getItem(FREQ_DEFAULTS_STORAGE_KEY);
    if (raw) {
      const parsed: FrequencyDefaultsStore = JSON.parse(raw);
      if (typeof parsed[fieldKey] === 'number') {
        return parsed[fieldKey];
      }
    }
  } catch (e) {
    console.error('Error reading smart default:', e);
  }
  return fallbackDefault; // Always 0 by default
}

/**
 * Records when a user enters a numeric value for a field key.
 * If entered more than 7 times (>7), automatically saves it as the new personalized default.
 */
export function recordSmartInput(fieldKey: string, val: number | string): number {
  const numVal = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(numVal)) return 0;

  try {
    const rawCounts = localStorage.getItem(FREQ_COUNTS_STORAGE_KEY);
    const countsStore: FrequencyCountsStore = rawCounts ? JSON.parse(rawCounts) : {};

    if (!countsStore[fieldKey]) {
      countsStore[fieldKey] = {};
    }

    const valStr = String(numVal);
    const currentCount = (countsStore[fieldKey][valStr] || 0) + 1;
    countsStore[fieldKey][valStr] = currentCount;

    localStorage.setItem(FREQ_COUNTS_STORAGE_KEY, JSON.stringify(countsStore));

    // If entered more than 7 times (>7), set as the personalized default
    if (currentCount > 7) {
      const rawDefaults = localStorage.getItem(FREQ_DEFAULTS_STORAGE_KEY);
      const defaultsStore: FrequencyDefaultsStore = rawDefaults ? JSON.parse(rawDefaults) : {};
      defaultsStore[fieldKey] = numVal;
      localStorage.setItem(FREQ_DEFAULTS_STORAGE_KEY, JSON.stringify(defaultsStore));
    }
  } catch (e) {
    console.error('Error recording smart input:', e);
  }

  return numVal;
}

/**
 * Get current entry frequency for a value on a specific field key
 */
export function getSmartFrequency(fieldKey: string, val: number | string): number {
  try {
    const rawCounts = localStorage.getItem(FREQ_COUNTS_STORAGE_KEY);
    if (rawCounts) {
      const countsStore: FrequencyCountsStore = JSON.parse(rawCounts);
      const valStr = String(val);
      return countsStore[fieldKey]?.[valStr] || 0;
    }
  } catch (e) {
    // ignore
  }
  return 0;
}

/**
 * Reset smart default for a field key back to 0
 */
export function resetSmartDefault(fieldKey: string): void {
  try {
    const raw = localStorage.getItem(FREQ_DEFAULTS_STORAGE_KEY);
    if (raw) {
      const parsed: FrequencyDefaultsStore = JSON.parse(raw);
      delete parsed[fieldKey];
      localStorage.setItem(FREQ_DEFAULTS_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch (e) {
    console.error('Error resetting smart default:', e);
  }
}
