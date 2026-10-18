import { beforeEach, describe, expect, it, vi } from 'vitest';
import { claimDeviceAtBoot, claimDeviceForUser, releaseDevice } from './accountScope';

class MemoryStorage {
  private data = new Map<string, string>();
  constructor() {
    return new Proxy(this, {
      ownKeys: (t) => [...t.data.keys()],
      getOwnPropertyDescriptor: (t, k) =>
        t.data.has(String(k))
          ? { enumerable: true, configurable: true, value: t.data.get(String(k)) }
          : undefined,
    });
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v));
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}

const reload = vi.fn();
const session = (id: string) =>
  localStorage.setItem('sb-proj-auth-token', JSON.stringify({ user: { id } }));

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  vi.stubGlobal('window', { location: { reload } });
  reload.mockClear();
  localStorage.setItem('o1fc_telemetry_5day_history_v1', '[workouts]');
  localStorage.setItem('o1_coach_notes_local', '{}');
  localStorage.setItem('o1fc_remember_email', 'a@b.co');
  localStorage.setItem('o1fc_athlete_trial_v2_user-a', '{}');
  sessionStorage.setItem('o1_session_origin', 'assigned');
});

describe('accountScope', () => {
  it('keeps data when the same account opens the app', () => {
    localStorage.setItem('o1fc_device_owner', 'user-a');
    session('user-a');
    claimDeviceAtBoot();
    expect(localStorage.getItem('o1fc_telemetry_5day_history_v1')).toBe('[workouts]');
  });

  it('wipes personal data, not device settings, when another account opens the app', () => {
    localStorage.setItem('o1fc_device_owner', 'user-a');
    session('user-b');
    claimDeviceAtBoot();
    expect(localStorage.getItem('o1fc_telemetry_5day_history_v1')).toBeNull();
    expect(localStorage.getItem('o1_coach_notes_local')).toBeNull();
    expect(sessionStorage.getItem('o1_session_origin')).toBeNull();
    expect(localStorage.getItem('o1fc_remember_email')).toBe('a@b.co');
    expect(localStorage.getItem('o1fc_athlete_trial_v2_user-a')).toBe('{}');
    expect(localStorage.getItem('sb-proj-auth-token')).not.toBeNull();
    expect(localStorage.getItem('o1fc_device_owner')).toBe('user-b');
    expect(localStorage.getItem('o1fc_user_id')).toBe('user-b');
  });

  it('wipes and reloads when a different account signs in while the app is open', () => {
    localStorage.setItem('o1fc_device_owner', 'user-a');
    localStorage.setItem('o1fc_user_id', 'user-a');
    claimDeviceForUser({ id: 'user-b', email: 'b@b.co' });
    expect(localStorage.getItem('o1fc_telemetry_5day_history_v1')).toBeNull();
    expect(localStorage.getItem('o1fc_user_id')).toBe('user-b');
    expect(localStorage.getItem('o1fc_user_email')).toBe('b@b.co');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does nothing when the same account signs in again', () => {
    localStorage.setItem('o1fc_device_owner', 'user-a');
    claimDeviceForUser({ id: 'user-a' });
    expect(localStorage.getItem('o1fc_telemetry_5day_history_v1')).toBe('[workouts]');
    expect(reload).not.toHaveBeenCalled();
  });

  it('sign-out clears personal data and the owner', async () => {
    localStorage.setItem('o1fc_device_owner', 'user-a');
    releaseDevice();
    expect(localStorage.getItem('o1fc_telemetry_5day_history_v1')).toBeNull();
    expect(localStorage.getItem('o1fc_device_owner')).toBeNull();
    // Sign-out waits up to 1.5 s for the store logout before it reloads, so allow longer than that.
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce(), { timeout: 4000 });
  });
});
