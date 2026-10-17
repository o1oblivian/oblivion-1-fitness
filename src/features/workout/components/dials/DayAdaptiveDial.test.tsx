import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DayAdaptiveDial } from './DayAdaptiveDial';
import type { DialComponentProps } from './dialTypes';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const base: DialComponentProps = {
  steps: 12619,
  stepTarget: 14000,
  burnKcal: 390,
  goalMove: 700,
  distKm: 9,
  goalDist: 10,
  intakeKcal: 450,
  intakeGoal: 1861,
  hydrationPct: 62,
  sleepHours: 8,
  activeDay: 'Mon',
  splitLabel: 'Rest',
};

const empty: DialComponentProps = {
  ...base,
  steps: 0,
  burnKcal: 0,
  distKm: 0,
  intakeKcal: 0,
  hydrationPct: null,
  sleepHours: null,
};

const render = (props: DialComponentProps) => renderToStaticMarkup(<DayAdaptiveDial {...props} />);

describe('DayAdaptiveDial', () => {
  it.each(DAYS)('%s dial shows every logged value', (day) => {
    const html = render({ ...base, activeDay: day });
    expect(html).toContain('12,619');
    expect(html).toContain('390');
    expect(html).toContain('9.0');
    expect(html).toContain('450');
  });

  it.each(DAYS)('%s dial shows -- for unread metrics and never zeros', (day) => {
    // Serif text is the printed 0..goal scale on Tuesday, not a reading.
    const html = render({ ...empty, activeDay: day }).replace(
      /<text[^>]*Georgia[^>]*>[^<]*<\/text>/g,
      '',
    );
    expect(html).toContain('--');
    expect(html).not.toMatch(/>0</);
    expect(html).not.toContain('NaN');
  });

  it('draws no text outline or blur on any day', () => {
    for (const day of DAYS) {
      const html = render({ ...base, activeDay: day });
      expect(html).not.toContain('paint-order');
      expect(html).not.toContain('filter');
    }
  });

  it('gives each day its own dial and a varied colour combination', () => {
    const htmlByDay = DAYS.map((day) => render({ ...base, activeDay: day }));
    expect(new Set(htmlByDay).size).toBe(7);
    const stepColours = htmlByDay.map(
      (html) => /<text[^>]*fill="(#[0-9a-fA-F]{6})"[^>]*>STEPS<\/text>/.exec(html)?.[1],
    );
    expect(stepColours.every(Boolean)).toBe(true);
    expect(new Set(stepColours).size).toBeGreaterThanOrEqual(4);
  });
});
