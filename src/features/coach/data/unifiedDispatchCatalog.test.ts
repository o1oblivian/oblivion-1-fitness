import { describe, expect, it } from 'vitest';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { DISPATCH_EXERCISE_CATALOG } from './dispatchExerciseCatalog';
import { UNIFIED_DISPATCH_CATALOG } from './unifiedDispatchCatalog';

describe('UNIFIED_DISPATCH_CATALOG', () => {
  it('lists every curated coach exercise first, unchanged', () => {
    expect(UNIFIED_DISPATCH_CATALOG.slice(0, DISPATCH_EXERCISE_CATALOG.length)).toEqual(
      DISPATCH_EXERCISE_CATALOG,
    );
  });

  it('adds every database exercise the curated list does not have', () => {
    const names = new Set(UNIFIED_DISPATCH_CATALOG.map((e) => e.name.toLowerCase()));
    for (const ex of EXERCISE_DATABASE) expect(names.has(ex.name.toLowerCase())).toBe(true);
  });

  it('never lists an id or a name twice', () => {
    const ids = UNIFIED_DISPATCH_CATALOG.map((e) => e.id);
    const names = UNIFIED_DISPATCH_CATALOG.map((e) => e.name.toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every entry a name and a usable default dose', () => {
    for (const ex of UNIFIED_DISPATCH_CATALOG) {
      expect(ex.name.length).toBeGreaterThan(0);
      expect(ex.defaultSets).toBeGreaterThan(0);
    }
  });
});
