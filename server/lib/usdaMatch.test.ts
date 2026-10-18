import { describe, expect, it } from 'vitest';
import {
  MIN_MATCH_SCORE,
  bestMatch,
  indexRecords,
  overlap,
  tokensOf,
  type UsdaRecord,
} from './usdaMatch';

const record = (
  id: string,
  description: string,
  dataType: UsdaRecord['dataType'] = 'SR Legacy',
): UsdaRecord => ({ id, description, dataType, calories: 100, protein: 1, carbs: 1, fats: 1 });

describe('tokensOf', () => {
  it('lower-cases, drops filler and folds plurals', () => {
    expect(tokensOf('Bananas, raw')).toEqual(['banana']);
    expect(tokensOf('Eggs and Cheese')).toEqual(['egg', 'cheese']);
  });
});

describe('overlap', () => {
  it('is 1 for identical words and 0 for nothing shared', () => {
    expect(overlap(['rice', 'white'], ['white', 'rice'])).toBe(1);
    expect(overlap(['rice'], ['bread'])).toBe(0);
  });

  it('scores a long record below a close one', () => {
    const close = overlap(['rice', 'white', 'cook'], ['rice', 'white', 'cook']);
    const loose = overlap(['rice', 'white', 'cook'], ['rice', 'white', 'cook', 'enriched', 'long']);
    expect(loose).toBeLessThan(close);
  });
});

describe('bestMatch', () => {
  const index = indexRecords([
    record('usda-1', 'Rice, white, long-grain, regular, cooked'),
    record('usda-2', 'Rice, brown, long-grain, cooked'),
    record('usda-3', 'Beverages, carbonated, cola, regular'),
  ]);

  it('picks the record that reads like the request', () => {
    expect(bestMatch('Rice, white, long-grain, regular, cooked', index)?.record.id).toBe('usda-1');
    expect(bestMatch('Rice, brown, cooked', index)?.record.id).toBe('usda-2');
  });

  it('returns null when nothing is close enough to trust', () => {
    expect(bestMatch('Vegemite', index)).toBeNull();
    expect(bestMatch('', index)).toBeNull();
  });

  it('never accepts a match below the threshold', () => {
    const found = bestMatch('Rice, white, cooked', index);
    expect(found === null || found.score >= MIN_MATCH_SCORE).toBe(true);
  });

  it('prefers a Foundation record when two read equally well', () => {
    const tied = indexRecords([
      record('usda-old', 'Bananas, raw', 'SR Legacy'),
      record('usda-new', 'Bananas, raw', 'Foundation'),
    ]);
    expect(bestMatch('Bananas, raw', tied)?.record.id).toBe('usda-new');
  });
});
