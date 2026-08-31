import { getSmartDefault, recordSmartInput, getSmartFrequency, resetSmartDefault } from './frequencyDefaults';

export { getSmartDefault, recordSmartInput, getSmartFrequency, resetSmartDefault };

/**
 * Record a user entry for a field.
 * If user enters the exact same number >7 times, auto-saves it as new default.
 * Returns true if a new default was established.
 */
export const recordFieldEntry = (fieldKey: string, value: number): { isNewDefault: boolean; newDefault?: number } => {
  if (isNaN(value)) return { isNewDefault: false };
  const currentCount = recordSmartInput(fieldKey, value);
  if (currentCount > 7) {
    return { isNewDefault: true, newDefault: value };
  }
  return { isNewDefault: false };
};
