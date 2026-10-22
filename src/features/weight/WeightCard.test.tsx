import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  const storage = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };
  vi.stubGlobal('window', {
    localStorage,
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('localStorage', localStorage);
  vi.resetModules();
});

async function render(footer?: React.ReactNode) {
  const { WeightCard } = await import('./WeightCard');
  return renderToStaticMarkup(
    <WeightCard onSaveWeight={vi.fn()} onToast={vi.fn()} onSetGoal={vi.fn()} footer={footer} />,
  );
}

describe('WeightCard', () => {
  it('invites the first weigh-in when nothing is logged', async () => {
    const markup = await render();
    expect(markup).toContain('Log your first weigh-in');
  });

  it('renders the footer slot at the foot of the card', async () => {
    const markup = await render(<p data-testid="energy">Energy line</p>);
    expect(markup).toContain('Energy line');
    expect(markup.indexOf('Log your first weigh-in')).toBeLessThan(markup.indexOf('Energy line'));
  });
});
