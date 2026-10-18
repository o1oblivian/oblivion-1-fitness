import { describe, expect, it } from 'vitest';
import { cleanMetricDraft, metricToDraft, readMetricDraft } from './bodyMetrics';

describe('cleanMetricDraft', () => {
  it('keeps digits only for age and height, at most three', () => {
    expect(cleanMetricDraft('1a7b4c9', 'height')).toBe('174');
    expect(cleanMetricDraft('007', 'age')).toBe('7');
    expect(cleanMetricDraft('17.5', 'age')).toBe('175');
  });

  it('keeps one decimal place for weight and accepts a comma', () => {
    expect(cleanMetricDraft('70.', 'weight')).toBe('70.');
    expect(cleanMetricDraft('70,55', 'weight')).toBe('70.5');
    expect(cleanMetricDraft('.5', 'weight')).toBe('0.5');
    expect(cleanMetricDraft('1.2.3', 'weight')).toBe('1.2');
  });
});

describe('readMetricDraft', () => {
  it('treats an empty field as unset, not an error', () => {
    expect(readMetricDraft('age', '', null)).toEqual({ state: 'empty' });
  });

  it('accepts values in range and rejects the rest with a plain message', () => {
    expect(readMetricDraft('age', '17', null)).toEqual({ state: 'ok', value: 17 });
    expect(readMetricDraft('age', '7', null)).toEqual({
      state: 'bad',
      message: 'Age must be 10 to 99.',
    });
    expect(readMetricDraft('height', '300', 'cm')).toEqual({
      state: 'bad',
      message: 'Height must be 100 to 250 cm.',
    });
    expect(readMetricDraft('weight', '29.9', 'kg')).toMatchObject({ state: 'bad' });
  });

  it('converts inches and pounds to centimetres and kilograms', () => {
    expect(readMetricDraft('height', '70', 'in')).toEqual({ state: 'ok', value: 177.8 });
    expect(readMetricDraft('weight', '150', 'lbs')).toEqual({ state: 'ok', value: 68.04 });
  });
});

describe('metricToDraft', () => {
  it('shows the stored value in the chosen unit', () => {
    expect(metricToDraft('height', 177.8, 'in')).toBe('70');
    expect(metricToDraft('weight', 68.04, 'lbs')).toBe('150');
    expect(metricToDraft('weight', 70.5, 'kg')).toBe('70.5');
    expect(metricToDraft('age', 0, null)).toBe('');
  });

  it('round-trips a pound weight without drifting', () => {
    const read = readMetricDraft('weight', '185.5', 'lbs');
    expect(read.state).toBe('ok');
    if (read.state === 'ok') expect(metricToDraft('weight', read.value, 'lbs')).toBe('185.5');
  });
});
