import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { REEL_CATEGORIES } from '../reelCategories';
import type { ExploreReelItem } from '../reelTypes';

type Category = ExploreReelItem['category'];

const TABS: Array<{ id: Category; label: string }> = [
  { id: 'ALL', label: 'All' },
  ...REEL_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
];

interface ReelExploreHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  counts: Partial<Record<Category, number>>;
  onClose: () => void;
}

export const ReelExploreHeader: React.FC<ReelExploreHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  counts,
  onClose,
}) => {
  const activeTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeTab.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedCategory]);

  return (
    <div className="sticky top-0 z-30 bg-black border-b border-white/[0.05] px-4 pt-3 pb-3 flex flex-col gap-3 select-none">
      <div className="relative flex items-center justify-center w-full min-h-[44px]">
        <h2 className="text-[15px] font-semibold text-[#EAE8DF]">Reels</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer"
          aria-label="Close reels"
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
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Reel categories"
        className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5"
      >
        {TABS.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          const count = counts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              ref={isSelected ? activeTab : undefined}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                tactileEngine.triggerLightTick();
                setSelectedCategory(tab.id);
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-o1-crimson text-white'
                  : 'bg-[#0E0E0E] text-[#8A887F] border border-[#1F1F1F]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 tabular-nums ${isSelected ? 'text-white/70' : 'text-[#5A5852]'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
