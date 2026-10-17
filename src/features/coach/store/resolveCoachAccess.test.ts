import { describe, expect, it } from 'vitest';
import { resolveCoachAccess } from './useCoachViewStore';

const ME = '07b7d413-3ca0-477f-9258-39f6ab851985';
const base = { userId: ME, validUserId: true, checkFailed: false };

describe('resolveCoachAccess', () => {
  it('waits, without painting the athlete view, until an account has been checked once', () => {
    expect(resolveCoachAccess({ ...base, role: 'athlete', cached: null })).toEqual({
      isCoach: false,
      awaitingFirstCheck: true,
    });
  });

  it('opens the coaching layout at once for a remembered coach card', () => {
    expect(
      resolveCoachAccess({ ...base, role: 'athlete', cached: { userId: ME, has: true } }),
    ).toEqual({
      isCoach: true,
      awaitingFirstCheck: false,
    });
  });

  it('opens the athlete view at once for a remembered non-coach', () => {
    expect(
      resolveCoachAccess({ ...base, role: 'athlete', cached: { userId: ME, has: false } }),
    ).toEqual({
      isCoach: false,
      awaitingFirstCheck: false,
    });
  });

  it("never reuses another account's answer", () => {
    expect(
      resolveCoachAccess({
        ...base,
        role: 'athlete',
        cached: { userId: 'someone-else', has: true },
      }),
    ).toEqual({
      isCoach: false,
      awaitingFirstCheck: true,
    });
  });

  it('treats the coach role as coach without waiting', () => {
    expect(resolveCoachAccess({ ...base, role: 'coach', cached: null })).toEqual({
      isCoach: true,
      awaitingFirstCheck: false,
    });
  });

  it('falls back to the athlete view when the lookup failed, instead of waiting forever', () => {
    expect(
      resolveCoachAccess({ ...base, role: 'athlete', cached: null, checkFailed: true }),
    ).toEqual({
      isCoach: false,
      awaitingFirstCheck: false,
    });
  });

  it('does not wait when there is no valid signed-in user', () => {
    expect(
      resolveCoachAccess({
        userId: '',
        validUserId: false,
        checkFailed: false,
        role: undefined,
        cached: null,
      }),
    ).toEqual({
      isCoach: false,
      awaitingFirstCheck: false,
    });
  });
});
