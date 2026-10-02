/**
 * Utility functions for clean number entry across inputs.
 * Prevents leading zeros (e.g., '080' -> '80', '053' -> '53')
 * while preserving decimals ('0.5') and clean backspacing.
 */

export function sanitizeNumericInput(val: string): string {
  if (!val) return '';
  // Strip leading zeros ahead of digits (e.g., '080' -> '80', '05' -> '5')
  // Leaves '0.' or standalone '0' intact
  if (/^0[0-9]+/.test(val)) {
    return val.replace(/^0+/, '');
  }
  return val;
}

export function parseCleanNumber(val: string, fallback: number = 0): number {
  const cleaned = sanitizeNumericInput(val);
  if (cleaned === '' || cleaned === '.') return fallback;
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

export function parseCleanInt(val: string, fallback: number = 0): number {
  const cleaned = sanitizeNumericInput(val);
  if (cleaned === '' || cleaned === '.') return fallback;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? fallback : num;
}
