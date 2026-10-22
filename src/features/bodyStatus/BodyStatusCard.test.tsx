import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };
  vi.stubGlobal('window', { localStorage, dispatchEvent: vi.fn() });
  vi.stubGlobal('localStorage', localStorage);
  vi.resetModules();
});

/** Loads the card and the status module together so both see the same fresh storage. */
async function render() {
  const [{ BodyStatusCard }, status] = await Promise.all([
    import('./BodyStatusCard'),
    import('./bodyStatus'),
  ]);
  return { status, html: () => renderToStaticMarkup(<BodyStatusCard />) };
}

describe('BodyStatusCard', () => {
  it('offers the four states and starts on Good', async () => {
    const { html } = await render();
    const markup = html();
    for (const label of ['Good', 'Rest day', 'Sick', 'Injured']) {
      expect(markup).toContain(label);
    }
    expect(markup.match(/role="radio"/g)).toHaveLength(4);
    expect(markup).toMatch(/aria-checked="true"[^>]*>(?:(?!<button).)*Good/);
    expect(markup).toContain('Training is on.');
    expect(markup).not.toContain('Injured area');
  });

  it('shows the injured areas once injured, with the chosen one selected', async () => {
    const { status, html } = await render();
    status.setBodyStatus('injured', 'Knee');
    const markup = html();
    expect(markup).toContain('Injured area');
    expect(markup).toContain('Shoulder');
    expect(markup).toMatch(/aria-checked="true"[^>]*>Knee</);
    expect(markup).toContain('Targets drop 10%');
  });

  it('counts the days while sick', async () => {
    const { status, html } = await render();
    status.setBodyStatus('sick');
    const markup = html();
    expect(markup).toContain('Day 1');
    expect(markup).toContain('Training is paused until you say you are better.');
  });
});
