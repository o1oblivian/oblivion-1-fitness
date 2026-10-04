import { ExploreReelItem } from '../../../data/reelsExploreCatalog';

export const CATEGORIES: Array<ExploreReelItem['category']> = [
  'ALL',
  'TUTORIAL',
  'MOBILITY',
  'BIOMECHANICS',
  'HYPERTROPHY',
  'STRENGTH',
  'REHAB',
];

export const FILTER_TAGS = [
  'ALL',
  'TUTORIAL',
  'HYPERTROPHY',
  'BIOMECHANICS',
  'STRENGTH',
  'MOBILITY',
  'HYROX',
  'REHAB',
  'CHEST & TRICEPS',
  'BACK & BICEPS',
  'QUADS & GLUTES',
  'SHOULDERS & ARMS',
];

export const filterReelsCatalog = (
  reels: ExploreReelItem[],
  selectedFilter: string,
  selectedCategory: ExploreReelItem['category'],
  searchQuery: string
): ExploreReelItem[] => {
  return reels.filter((reel) => {
    let matchFilter = true;
    if (selectedFilter !== 'ALL') {
      const sf = selectedFilter.toUpperCase();
      if (sf === 'TUTORIAL') {
        matchFilter = reel.category === 'TUTORIAL' || reel.filterTag === 'TUTORIAL';
      } else if (sf === 'HYROX' || sf === 'HYROX / CONDITIONING') {
        matchFilter = reel.filterTag === 'HYROX / CONDITIONING' || (reel.category as string) === 'HYROX';
      } else if (sf === 'MOBILITY') {
        matchFilter = reel.category === 'MOBILITY' || reel.filterTag === 'MOBILITY & REHAB';
      } else if (sf === 'MOBILITY & REHAB') {
        matchFilter = reel.filterTag === 'MOBILITY & REHAB' || reel.category === 'MOBILITY' || reel.category === 'REHAB';
      } else if (sf === 'HYPERTROPHY') {
        matchFilter = reel.category === 'HYPERTROPHY';
      } else if (sf === 'BIOMECHANICS') {
        matchFilter = reel.category === 'BIOMECHANICS';
      } else if (sf === 'STRENGTH') {
        matchFilter = reel.category === 'STRENGTH';
      } else if (sf === 'REHAB') {
        matchFilter = reel.category === 'REHAB' || reel.filterTag === 'MOBILITY & REHAB';
      } else {
        matchFilter = reel.filterTag === selectedFilter || reel.category === selectedFilter;
      }
    }

    let matchCategory = true;
    if (selectedCategory !== 'ALL' && selectedFilter === 'ALL') {
      const sc = selectedCategory.toUpperCase();
      if (sc === 'TUTORIAL') {
        matchCategory = reel.category === 'TUTORIAL' || reel.filterTag === 'TUTORIAL';
      } else if (sc === 'HYROX') {
        matchCategory = reel.filterTag === 'HYROX / CONDITIONING' || (reel.category as string) === 'HYROX';
      } else if (sc === 'MOBILITY' || sc === 'REHAB') {
        matchCategory = reel.category === sc || reel.filterTag === 'MOBILITY & REHAB';
      } else {
        matchCategory = reel.category === selectedCategory;
      }
    }

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      (reel?.title ?? '').toLowerCase().includes(q) ||
      (reel?.coach?.name ?? '').toLowerCase().includes(q) ||
      (reel?.coach?.specialtyTitle ?? reel?.coach?.specialty ?? '').toLowerCase().includes(q) ||
      (reel?.cues ?? '').toLowerCase().includes(q);
    return matchFilter && matchCategory && matchQuery;
  });
};
