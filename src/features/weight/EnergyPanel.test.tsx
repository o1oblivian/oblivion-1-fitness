import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { EnergyPanel } from './EnergyPanel';
import { dailyBurn, restingBurn } from '../fuel/utils/energyMath';

const body = { weightKg: 80, heightCm: 180, ageYears: 30, sex: 'male' as const };

const render = (props: Partial<React.ComponentProps<typeof EnergyPanel>> = {}) =>
  renderToStaticMarkup(
    <EnergyPanel
      {...body}
      goalKg={0}
      calorieTarget={null}
      unit="kg"
      onApply={vi.fn()}
      onEditDetails={vi.fn()}
      {...props}
    />,
  );

describe('EnergyPanel', () => {
  it('asks for body details before it can say anything', () => {
    const markup = render({ heightCm: null });
    expect(markup).toContain('Set up your daily calories');
    expect(markup).not.toContain('kcal/day');
  });

  it('shows the maintenance burn when no target is saved', () => {
    const burn = Math.round(dailyBurn(restingBurn(80, 180, 30, 'male') as number));
    const markup = render();
    expect(markup).toContain(`${burn.toLocaleString()} kcal/day`);
    expect(markup).toContain('to maintain');
  });

  it('shows the saved target in preference to the burn', () => {
    const markup = render({ calorieTarget: 2200, goalKg: 75 });
    expect(markup).toContain('2,200 kcal/day');
    expect(markup).toContain('your target');
  });

  it('starts collapsed so the card stays two rows tall', () => {
    const markup = render({ goalKg: 75 });
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain('You burn');
  });
});
