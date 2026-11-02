import React from 'react';
import { ExploreReelItem, FilmstripClip } from '../reelTypes';
import { ReelExploreHeader } from './ReelExploreHeader';
import { ReelMosaicSection } from './ReelMosaicSection';

interface ReelExploreGridProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: ExploreReelItem['category'];
  setSelectedCategory: (category: ExploreReelItem['category']) => void;
  categoryCounts: Partial<Record<ExploreReelItem['category'], number>>;
  filteredReels: ExploreReelItem[];
  feedLoading: boolean;
  /** Why the feed failed to load, or `null`. */
  feedError: string | null;
  onRetryFeed: () => void;
  onClose: () => void;
  onSelectReel: (reel: ExploreReelItem, clip?: FilmstripClip) => void;
}

export const ReelExploreGrid: React.FC<ReelExploreGridProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categoryCounts,
  filteredReels,
  feedLoading,
  feedError,
  onRetryFeed,
  onClose,
  onSelectReel,
}) => {
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-black overflow-y-auto pb-8 select-none">
      <ReelExploreHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        counts={categoryCounts}
        onClose={onClose}
      />
      <div className="flex-1 w-full px-2.5 sm:px-3 pt-3 max-w-xl mx-auto">
        {feedError ? (
          <div
            role="alert"
            className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-o1-card px-4 py-3"
          >
            <p className="text-o1-body text-o1-text">{feedError}</p>
            <button
              type="button"
              onClick={onRetryFeed}
              className="min-h-[44px] shrink-0 rounded-full border border-white/[0.07] px-4 text-o1-caption font-semibold text-o1-text active:scale-95"
            >
              Retry
            </button>
          </div>
        ) : null}
        {feedLoading && filteredReels.length === 0 ? (
          <p className="py-20 text-center text-o1-body text-o1-muted">Loading reels</p>
        ) : (
          <ReelMosaicSection
            reels={filteredReels}
            emptyMessage={
              searchQuery.trim()
                ? 'No reels match your search.'
                : selectedCategory === 'ALL'
                  ? 'No reels available'
                  : 'No reels uploaded for this category yet.'
            }
            onSelectReel={onSelectReel}
          />
        )}
      </div>
    </div>
  );
};
