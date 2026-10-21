import { describe, expect, it } from 'vitest';
import {
  countLabel,
  formatServings,
  maxGramsFor,
  nutritionScale,
  portionChips,
  snap,
} from './portionMath';

describe('snap', () => {
  it('rounds grams to whole numbers and servings to quarters', () => {
    expect(snap(82.4, 'g')).toBe(82);
    expect(snap(82.6, 'g')).toBe(83);
    expect(snap(1.1, 'serv')).toBe(1);
    expect(snap(1.2, 'serv')).toBe(1.25);
    expect(snap(1.4, 'serv')).toBe(1.5);
  });
});

describe('formatServings', () => {
  it('writes quarters as fraction glyphs', () => {
    expect(formatServings(1)).toBe('1');
    expect(formatServings(0.25)).toBe('¼');
    expect(formatServings(0.5)).toBe('½');
    expect(formatServings(1.5)).toBe('1½');
    expect(formatServings(2.75)).toBe('2¾');
  });
});

describe('countLabel', () => {
  it('drops the weight and keeps the count', () => {
    expect(countLabel('1 burger (352g)')).toBe('1 burger');
    expect(countLabel('2 slices (60 g)')).toBe('2 slices');
  });

  it('is null for a bare weight, an empty value, or no value', () => {
    expect(countLabel('100g')).toBeNull();
    expect(countLabel('250 ml')).toBeNull();
    expect(countLabel('')).toBeNull();
    expect(countLabel(undefined)).toBeNull();
  });
});

describe('maxGramsFor', () => {
  it('is 2 kg with no serving size', () => {
    expect(maxGramsFor(null)).toBe(2000);
  });

  it('is about five servings, kept between 500 g and 3 kg', () => {
    expect(maxGramsFor(30)).toBe(500);
    expect(maxGramsFor(250)).toBe(1300);
    expect(maxGramsFor(900)).toBe(3000);
  });
});

describe('nutritionScale', () => {
  it('counts servings directly', () => {
    expect(nutritionScale('serv', 1.5, 200)).toBe(1.5);
  });

  it('turns grams into servings, or per-100 g with no serving size', () => {
    expect(nutritionScale('g', 100, 200)).toBe(0.5);
    expect(nutritionScale('g', 150, null)).toBe(1.5);
  });
});

describe('portionChips', () => {
  const base = { servingG: 200, label: '1 cup', maxG: 1000, lastPortion: null };

  it('offers half, one, two, and 100 g for a food with a serving size', () => {
    const chips = portionChips({ ...base, unit: 'g' });
    expect(chips.map((c) => [c.id, c.value])).toEqual([
      ['half', 100],
      ['one', 200],
      ['two', 400],
      ['100', 100],
    ]);
    expect(chips[1].text).toBe('1 · 200g');
  });

  it('skips the 100 g chip when one serving already is 100 g, and caps two servings', () => {
    const chips = portionChips({ ...base, unit: 'g', servingG: 100, maxG: 150 });
    expect(chips.map((c) => c.id)).toEqual(['half', 'one', 'two']);
    expect(chips[2].value).toBe(150);
  });

  it('has no grams chips without a serving size', () => {
    expect(portionChips({ ...base, unit: 'g', servingG: null })).toEqual([]);
  });

  it('offers common serving counts in servings mode', () => {
    const chips = portionChips({ ...base, unit: 'serv' });
    expect(chips.map((c) => c.text)).toEqual(['½×', '1×', '1½×', '2×', '3×']);
  });

  it('puts the last portion first unless it is already a chip', () => {
    const fresh = portionChips({ ...base, unit: 'g', lastPortion: { unit: 'g', amount: 175 } });
    expect(fresh[0]).toEqual({ id: 'last', text: 'Last · 175 g', unit: 'g', value: 175 });
    const dupe = portionChips({ ...base, unit: 'g', lastPortion: { unit: 'g', amount: 200 } });
    expect(dupe.some((c) => c.id === 'last')).toBe(false);
    const otherUnit = portionChips({
      ...base,
      unit: 'g',
      lastPortion: { unit: 'serv', amount: 2 },
    });
    expect(otherUnit.some((c) => c.id === 'last')).toBe(false);
  });
});
