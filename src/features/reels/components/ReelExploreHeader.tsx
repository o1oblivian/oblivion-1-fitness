import React from 'react';
import { Search, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelExploreHeaderProps {
  tabMode: 'reels' | 'coaches';
  setTabMode: (mode: 'reels' | 'coaches') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filterTags: string[];
  onClose: () => void;
}

export const ReelExploreHeader: React.FC<ReelExploreHeaderProps> = ({
  tabMode,
  setTabMode,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filterTags,
  onClose,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-black border-b border-white/[0.05] px-4 pt-3 pb-3 flex flex-col gap-3 select-none">
      {/* Top Bar: Center Segmented Control Pill + Absolute Right Close Button */}
      <div className="relative flex items-center justify-center w-full min-h-[36px]">
        {/* Tab 1: ELITE REELS | Tab 2: COACHES - Horizontally Centered */}
        <div className="p-1 rounded-full bg-o1-well border border-white/[0.07] flex items-center shadow-inner mx-auto">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              setTabMode('reels');
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer font-tactical ${
              tabMode === 'reels' ? 'bg-o1-crimson text-white font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Elite Reels
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              setTabMode('coaches');
            }}
            className={`px-4 py-1 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer font-tactical ${
              tabMode === 'coaches' ? 'bg-o1-crimson text-white font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Coaches
          </button>
        </div>

        {/* Absolute Right [X] Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
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
          placeholder={tabMode === 'reels' ? "Search exercises, cues, coaches..." : "Search verified trainers, specialties..."}
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

      {tabMode === 'reels' && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {filterTags.map((tag) => {
            const isSelected = selectedFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  tactileEngine.triggerLightTick();
                  setSelectedFilter(tag);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer font-tactical ${
                  isSelected
                    ? 'bg-o1-crimson text-white shadow-xs'
                    : 'bg-o1-well text-neutral-400 border border-white/[0.07] hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
