import React from 'react';
import { ExploreReelItem, ExploreCoach, FilmstripClip } from '../../../data/reelsExploreCatalog';
import { ReelExploreHeader } from './ReelExploreHeader';
import { ReelMosaicSection } from './ReelMosaicSection';
import { CoachExploreCard } from './CoachExploreCard';

interface ReelExploreGridProps {
  tabMode: 'reels' | 'coaches';
  setTabMode: (mode: 'reels' | 'coaches') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filterTags: string[];
  filteredReels: ExploreReelItem[];
  coachesList: ExploreCoach[];
  followedCoaches: Record<string, boolean>;
  onClose: () => void;
  onSelectReel: (reel: ExploreReelItem, clip?: FilmstripClip) => void;
  onToggleFollow: (coachId: string, e?: React.MouseEvent) => void;
  onBookCoach: (coach: ExploreCoach) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
}

export const ReelExploreGrid: React.FC<ReelExploreGridProps> = ({
  tabMode, setTabMode, searchQuery, setSearchQuery, selectedFilter, setSelectedFilter,
  filterTags, filteredReels, coachesList, followedCoaches, onClose, onSelectReel,
  onToggleFollow, onBookCoach, onMessageCoach,
}) => {
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#09090b] overflow-y-auto pb-8 select-none">
      <ReelExploreHeader
        tabMode={tabMode}
        setTabMode={setTabMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        filterTags={filterTags}
        onClose={onClose}
      />

      {tabMode === 'reels' ? (
        <div className="flex-1 w-full px-2.5 sm:px-3 pt-3 max-w-xl mx-auto">
          <ReelMosaicSection reels={filteredReels} onSelectReel={onSelectReel} />
        </div>
      ) : (
        <div className="p-3 sm:p-4 space-y-3 max-w-xl mx-auto w-full">
          {coachesList.length > 0 ? (
            coachesList.map((coach) => (
              <CoachExploreCard
                key={coach.id}
                coach={coach}
                isFollowing={Boolean(followedCoaches[coach.id])}
                onToggleFollow={onToggleFollow}
                onBookCoach={onBookCoach}
                onMessageCoach={onMessageCoach}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3 shadow-sm">
                <span className="font-mono text-xs font-bold">O1</span>
              </div>
              <h4 className="text-xs font-tactical font-black text-neutral-300 uppercase tracking-widest">
                VERIFIED DIRECTORY // NO ACTIVE PROFILES REGISTERED
              </h4>
              <p className="text-[11px] text-neutral-500 font-sans mt-1 max-w-xs">
                Active certified trainers will appear once verified by the club administration.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
