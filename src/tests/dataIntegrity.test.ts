import { describe, it, expect } from 'vitest';
import {
  ROUTINE_TEMPLATES,
  INITIAL_FOOD_DB,
} from '@/data/exerciseDatabase';

describe('Exercise Database', () => {
  it('has routine templates defined', () => {
    expect(ROUTINE_TEMPLATES).toBeDefined();
    expect(Object.keys(ROUTINE_TEMPLATES).length).toBeGreaterThan(0);
  });

  it('each routine has exercises as an array of strings', () => {
    Object.entries(ROUTINE_TEMPLATES).forEach(([key, exercises]: [string, any]) => {
      expect(key.length).toBeGreaterThan(0);
      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);
      exercises.forEach((name: any) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Food Database', () => {
  it('has food categories defined', () => {
    expect(INITIAL_FOOD_DB).toBeDefined();
    expect(Object.keys(INITIAL_FOOD_DB).length).toBeGreaterThan(0);
  });

  it('each category has food items with nutritional data', () => {
    Object.entries(INITIAL_FOOD_DB).forEach(([category, items]: [string, any[]]) => {
      expect(category.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item.name).toBeDefined();
        expect(typeof item.p).toBe('number');
        expect(typeof item.c).toBe('number');
        expect(typeof item.f).toBe('number');
      });
    });
  });
});
