import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  type AthleticVector,
  type FacilityGear,
  type IntensityMode,
  type SessionDuration,
  synthesizeDailyBlueprint,
} from './dispatchBlueprintSynthesizer';

const DURATIONS: SessionDuration[] = ['20m', '30m', '45m', '60m', '75m'];
const GEARS: FacilityGear[] = ['Full Gym', 'DB & Bench', 'Bodyweight'];
const MODES: IntensityMode[] = ['Progressive RPE', 'Failure Dropset'];

/**
 * A fingerprint of every blueprint a focus can produce: 5 lengths x 3 gear x 2 intensity modes.
 * If you change a blueprint on purpose, rerun and replace its fingerprint below.
 */
const FINGERPRINTS: Record<AthleticVector, string> = {
  'Push Alpha': '08c4f4266a890ce6',
  'Push Beta': '8e2245a61fbfc6df',
  'Pull Alpha': '2f0689c553cb5468',
  'Pull Beta': '474184838db94eff',
  'Legs Alpha': 'dbef537abb2d28c6',
  'Legs Beta': '6549c127cae07ed9',
  'Upper Body': 'cacf9aa438f15b64',
  'Lower Body': '43cdcd2f1d245336',
  'Speed & COD': '440f934ea0d54c1b',
  'Hyrox/Metcon': '304f9f82e01ddd30',
  'Strength S&C': '04ef8d1ded7e9772',
  'Bio-Recovery': 'ef86b28bfc19196f',
};

function everyVariant(vector: AthleticVector) {
  return DURATIONS.flatMap((d) =>
    GEARS.flatMap((g) => MODES.map((m) => synthesizeDailyBlueprint(vector, d, g, m))),
  );
}

describe('synthesizeDailyBlueprint', () => {
  it.each(Object.keys(FINGERPRINTS) as AthleticVector[])('%s is unchanged', (vector) => {
    const hash = createHash('sha256')
      .update(JSON.stringify(everyVariant(vector)))
      .digest('hex');
    expect(hash.slice(0, 16)).toBe(FINGERPRINTS[vector]);
  });

  it('carries the choices it was given', () => {
    const bp = synthesizeDailyBlueprint('Pull Alpha', '60m', 'DB & Bench', 'Failure Dropset');
    expect(bp).toMatchObject({
      vector: 'Pull Alpha',
      durationMins: 60,
      gear: 'DB & Bench',
      intensityMode: 'Failure Dropset',
    });
  });

  it('defaults to 45 minutes, full gym and progressive effort', () => {
    expect(synthesizeDailyBlueprint('Push Alpha')).toEqual(
      synthesizeDailyBlueprint('Push Alpha', '45m', 'Full Gym', 'Progressive RPE'),
    );
  });

  it('falls back to 45 minutes for an unknown length and to recovery for an unknown focus', () => {
    expect(synthesizeDailyBlueprint('Push Alpha', '90m' as SessionDuration).durationMins).toBe(45);
    expect(synthesizeDailyBlueprint('nope' as AthleticVector).vector).toBe('Bio-Recovery');
  });

  it('never lists more exercises than the session length allows', () => {
    for (const vector of Object.keys(FINGERPRINTS) as AthleticVector[]) {
      for (const bp of everyVariant(vector)) {
        expect(bp.exercises.length).toBeLessThanOrEqual(bp.movesCount);
        expect(bp.exercises.length).toBeGreaterThan(0);
      }
    }
  });
});
