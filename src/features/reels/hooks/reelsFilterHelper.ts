import { ExploreReelItem } from '../reelTypes';
import { chipHit } from '../../induction/consultationTypes';
import { BODY_PART_TAGS, REEL_CATEGORIES } from '../reelCategories';

export const CATEGORIES: Array<ExploreReelItem['category']> = ['ALL', ...REEL_CATEGORIES.map((c) => c.id)];

export const FILTER_TAGS = ['ALL', ...REEL_CATEGORIES.map((c) => c.id), ...BODY_PART_TAGS];

const CATEGORY_BY_NAME = new Map<string, string>(
  REEL_CATEGORIES.flatMap((c) => [[c.id, c.id], [c.label.toUpperCase(), c.id]] as Array<[string, string]>),
);

function matchesChip(reel: ExploreReelItem, chip: string): boolean {
  if (!chip || chip === 'ALL' || chip === 'All') return true;
  const upper = chip.toUpperCase();
  const category = CATEGORY_BY_NAME.get(upper);
  if (category) return reel.category === category;
  if ((BODY_PART_TAGS as readonly string[]).includes(upper)) return reel.filterTag === upper;
  if (upper === 'HEAVY COMPOUND') return reel.category === 'STRENGTH' || chipHit(`${reel.title} ${reel.cues || ''}`, chip);
  return chipHit(`${reel.title} ${reel.cues || ''} ${reel.filterTag || ''}`, chip);
}

/** Every reel belongs to exactly one category; body-part tags and discovery chips narrow within it. */
export const filterReelsCatalog = (
  reels: ExploreReelItem[],
  selectedFilter: string,
  selectedCategory: ExploreReelItem['category'],
  searchQuery: string
): ExploreReelItem[] => {
  const q = searchQuery.toLowerCase().trim();
  return reels.filter((reel) => {
    if (selectedCategory !== 'ALL' && reel.category !== selectedCategory) return false;
    if (!matchesChip(reel, selectedFilter)) return false;
    return (
      !q ||
      (reel?.title ?? '').toLowerCase().includes(q) ||
      (reel?.coach?.name ?? '').toLowerCase().includes(q) ||
      (reel?.coach?.specialtyTitle ?? reel?.coach?.specialty ?? '').toLowerCase().includes(q) ||
      (reel?.cues ?? '').toLowerCase().includes(q)
    );
  });
};
