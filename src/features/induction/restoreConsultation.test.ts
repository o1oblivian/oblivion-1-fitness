import { describe, expect, it, vi } from 'vitest';
import type { OnboardingStatus } from '../../services/oauthDeepLink';
import { restoreConsultation } from './restoreConsultation';

const noWait = () => Promise.resolve();

const run = (statuses: OnboardingStatus[], hydrates: boolean[], isCancelled = () => false) => {
  const status = vi.fn<() => Promise<OnboardingStatus>>();
  statuses.forEach((value) => status.mockResolvedValueOnce(value));
  const hydrate = vi.fn<() => Promise<boolean>>();
  hydrates.forEach((value) => hydrate.mockResolvedValueOnce(value));
  return {
    status,
    hydrate,
    result: restoreConsultation({ status, hydrate, wait: noWait, isCancelled }),
  };
};

describe('restoreConsultation', () => {
  it('finds a saved consultation on the first try', async () => {
    const { result, status, hydrate } = run(['done'], [true]);
    expect(await result).toBe(true);
    expect(status).toHaveBeenCalledTimes(1);
    expect(hydrate).toHaveBeenCalledTimes(1);
  });

  it('shows the questions at once for someone who has not onboarded', async () => {
    const { result, hydrate } = run(['not_done'], []);
    expect(await result).toBe(false);
    expect(hydrate).not.toHaveBeenCalled();
  });

  it('retries when the server could not be asked, then finds the consultation', async () => {
    const { result, status } = run(['unknown', 'unknown', 'done'], [true]);
    expect(await result).toBe(true);
    expect(status).toHaveBeenCalledTimes(3);
  });

  it('retries when onboarding is done but the saved answers failed to load', async () => {
    const { result, hydrate } = run(['done', 'done'], [false, true]);
    expect(await result).toBe(true);
    expect(hydrate).toHaveBeenCalledTimes(2);
  });

  it('gives up after three attempts and shows the questions', async () => {
    const { result, status } = run(['unknown', 'unknown', 'unknown'], []);
    expect(await result).toBe(false);
    expect(status).toHaveBeenCalledTimes(3);
  });

  it('stops quietly when the screen was closed', async () => {
    const { result, hydrate } = run(['unknown'], [], () => true);
    expect(await result).toBe(true);
    expect(hydrate).not.toHaveBeenCalled();
  });
});
