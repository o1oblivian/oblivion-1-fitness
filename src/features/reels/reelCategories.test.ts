import { describe, expect, it } from 'vitest';
import { normalizeBodyPart, normalizeReelCategory } from './reelCategories';
import { filterReelsCatalog } from './hooks/reelsFilterHelper';
import { isReelVisible } from './services/reelSafety';
import type { ExploreReelItem } from './reelTypes';

const reel = (id: string, category: ExploreReelItem['category'], filterTag: ExploreReelItem['filterTag'] = null, coachId = 'c1') =>
  ({ id, title: id, category, filterTag, coach: { id: coachId, name: 'Coach' } }) as unknown as ExploreReelItem;

describe('reel categories', () => {
  it('maps rows saved before categories were exclusive', () => {
    expect(normalizeReelCategory('HYROX')).toBe('CONDITIONING');
    expect(normalizeReelCategory('ALL', 'HYROX / CONDITIONING')).toBe('CONDITIONING');
    expect(normalizeReelCategory('ALL', 'TUTORIAL')).toBe('TUTORIAL');
    expect(normalizeReelCategory('REHAB', 'MOBILITY & REHAB')).toBe('REHAB');
    expect(normalizeReelCategory('ALL')).toBeNull();
    expect(normalizeReelCategory('nonsense')).toBeNull();
  });

  it('keeps only body-part tags', () => {
    expect(normalizeBodyPart('BACK & BICEPS')).toBe('BACK & BICEPS');
    expect(normalizeBodyPart('MOBILITY & REHAB')).toBeNull();
    expect(normalizeBodyPart(null)).toBeNull();
  });

  it('shows a reel in its own circle only', () => {
    const reels = [reel('a', 'STRENGTH', 'QUADS & GLUTES'), reel('b', 'MOBILITY', 'QUADS & GLUTES'), reel('c', 'CONDITIONING')];
    expect(filterReelsCatalog(reels, 'ALL', 'STRENGTH', '').map((r) => r.id)).toEqual(['a']);
    expect(filterReelsCatalog(reels, 'ALL', 'MOBILITY', '').map((r) => r.id)).toEqual(['b']);
    expect(filterReelsCatalog(reels, 'ALL', 'ALL', '').map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(filterReelsCatalog(reels, 'QUADS & GLUTES', 'ALL', '').map((r) => r.id)).toEqual(['a', 'b']);
    expect(filterReelsCatalog(reels, 'Conditioning', 'ALL', '').map((r) => r.id)).toEqual(['c']);
  });

  it('hides reported reels and blocked coaches', () => {
    expect(isReelVisible(reel('a', 'STRENGTH'), {}, {})).toBe(true);
    expect(isReelVisible(reel('a', 'STRENGTH'), { a: true }, {})).toBe(false);
    expect(isReelVisible(reel('a', 'STRENGTH', null, 'c9'), {}, { c9: true })).toBe(false);
  });
});
