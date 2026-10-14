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
  onClose: () => void;
  onSelectReel: (reel: ExploreReelItem, clip?: FilmstripClip) => void;
}

export const ReelExploreGrid: React.FC<ReelExploreGridProps> = ({
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
  categoryCounts, filteredReels, onClose, onSelectReel,
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
        <ReelMosaicSection reels={filteredReels} onSelectReel={onSelectReel} />
      </div>
    </div>
  );
};
