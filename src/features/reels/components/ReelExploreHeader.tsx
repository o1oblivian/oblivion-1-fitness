import React from 'react';
import { Search, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelExploreHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filterTags: string[];
  onClose: () => void;
}

export const ReelExploreHeader: React.FC<ReelExploreHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filterTags,
  onClose,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-black border-b border-white/[0.05] px-4 pt-3 pb-3 flex flex-col gap-3 select-none">
      <div className="relative flex items-center justify-center w-full min-h-[44px]">
        <h2 className="text-[15px] font-semibold text-[#EAE8DF]">Elite Reels</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
          aria-label="Close Explore Hub"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search exercises, cues, coaches..."
          className="w-full bg-o1-well border border-white/[0.07] rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {filterTags.map((tag) => {
            const isSelected = selectedFilter === tag || (tag === 'All' && selectedFilter === 'ALL');
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  tactileEngine.triggerLightTick();
                  setSelectedFilter(tag);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-950'
                    : 'bg-[#0E0E0E] text-[#8A887F] border border-[#1F1F1F]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
    </div>
  );
};
