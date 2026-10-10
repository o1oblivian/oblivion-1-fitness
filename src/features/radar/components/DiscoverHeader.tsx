import React from 'react';
import { ChevronLeft, Compass, Shield, User, Search, X, SlidersHorizontal } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { PremiumPlaneIcon } from './RadarIcons';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';

interface Props {
  activeTab: 'DISCOVER' | 'MATCHED';
  onTabChange: (tab: 'DISCOVER' | 'MATCHED') => void;
  matchedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  count: number;
  radiusKm?: number;
  isScanning: boolean;
  onScan: () => void;
  onBack?: () => void;
  onOpenPrivacy: () => void;
  onOpenFilters?: () => void;
  onOpenProfile?: () => void;
  onOpenTravelHub: () => void;
  onOpenSetup?: () => void;
  travelCity?: string;
  travelOrigin?: string;
  onClearTravelCorridor?: () => void;
}

export const DiscoverHeader: React.FC<Props> = ({
  activeTab,
  onTabChange,
  matchedCount,
  searchQuery,
  onSearchChange,
  count,
  radiusKm = 25,
  isScanning,
  onScan,
  onBack,
  onOpenPrivacy,
  onOpenFilters,
  onOpenProfile,
  onOpenTravelHub,
  travelCity,
  travelOrigin,
  onClearTravelCorridor,
}) => {
  const buddyPhotos = useBuddyProfileStore((s) => s.buddyPhotos);
  const isBuddyProfileActive = useBuddyProfileStore((s) => s.isBuddyProfileActive);
  const ghostMode = useBuddyProfileStore((s) => s.ghostMode);
  const primaryPhoto = buddyPhotos[0];
  const canGoBack = Boolean(searchQuery && activeTab === 'DISCOVER');

  const handleOpenStudio = () => {
    tactileEngine.triggerSelectionBuzz();
    onOpenProfile?.();
  };
  return (
    <div className="bg-black pb-2 select-none transition-colors border-b border-white/[0.05]">
      {/* Top Row: Circular Back Chevron (dynamic) | Centered Buddy & Chats Pills | Right Shield & Sliders */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {/* Left: Round circular back button (revealed only in sub-views / search) */}
        <div className="flex items-center gap-1">
          {canGoBack && (
            <button
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); onBack?.(); }}
              aria-label="Back"
              className="w-10 h-10 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-white/90 hover:text-white transition active:scale-90 cursor-pointer shadow-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          {activeTab === 'DISCOVER' && (
            <button
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenFilters?.(); }}
              aria-label="Filters"
              className="text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer p-1"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[1.8]" />
            </button>
          )}
        </div>

        {/* Center: Buddy (pill) and Chats */}
        <div className="flex items-center gap-4">
          {/* Active Buddy Pill */}
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onTabChange('DISCOVER'); }}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
              activeTab === 'DISCOVER'
                ? 'bg-o1-well text-white border border-white/[0.07] shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-o1-crimson" />
            <span className="text-[11px] font-semibold tracking-tight font-tactical">Buddy</span>
          </button>

          {/* Chats with Counter */}
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onTabChange('MATCHED'); }}
            className={`flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              activeTab === 'MATCHED'
                ? 'text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-[11px] font-medium tracking-tight font-tactical">Chats</span>
            {matchedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-o1-crimson text-white text-[9.5px] font-mono font-bold leading-none">
                {matchedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Shield & Athlete Profile Studio */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenPrivacy(); }}
            aria-label="Stealth & Privacy"
            className="text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer p-1"
          >
            <Shield className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Nude Profile Icon: No border, no background fog, no green dot */}
          <button
            id="radar-profile-icon-btn"
            type="button"
            onClick={handleOpenStudio}
            aria-label="Profile"
            className="text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer p-1"
          >
            <User className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Active Destination Corridor Banner if travel destination is set */}
      {activeTab === 'DISCOVER' && travelCity && (
        <div className="px-3 pt-1 pb-1">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-o1-card border border-o1-crimson/30 text-xs font-mono shadow-xs">
            <button
              type="button"
              onClick={onOpenTravelHub}
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-5 h-5 rounded-full bg-o1-crimson/10 flex items-center justify-center text-o1-crimson">
                <PremiumPlaneIcon className="w-3 h-3 text-o1-crimson" />
              </div>
              <div className="flex items-center gap-1.5">
                {travelOrigin && (
                  <span className="text-[9px] font-medium text-neutral-400">
                    {travelOrigin} ➔
                  </span>
                )}
                <span className="text-[11px] font-bold text-white">
                  {travelCity.toUpperCase()}
                </span>
                <span className="text-[8.5px] text-o1-crimson font-semibold px-1 py-0.2 bg-o1-crimson/10 rounded border border-o1-crimson/20">
                  {radiusKm} KM RADIUS
                </span>
              </div>
            </button>

            {onClearTravelCorridor && (
              <button
                type="button"
                onClick={onClearTravelCorridor}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                title="Reset to local radar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input and Separate Dedicated Flight/Plane Travel Trigger: (search         ) ( 🛫 ) */}
      {activeTab === 'DISCOVER' && (
      <div className="flex items-center gap-2 px-3 mt-1.5">
        {/* Dedicated Search Bar (search         ) */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={travelCity ? `Search athletes & gyms in ${travelCity}...` : "Search gym, name, discipline..."}
            className="w-full pl-9 pr-8 py-2 rounded-full bg-o1-well border border-white/[0.07] text-[11px] placeholder:text-[11px] placeholder-neutral-500 text-white focus:outline-none focus:border-white/[0.14] transition shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); onSearchChange(''); }}
              aria-label="Clear search"
              className="absolute right-3 p-0.5 text-neutral-400 hover:text-white active:scale-90 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dedicated Standalone Travel / Flight Hub Button ( 🛫 ) */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenTravelHub();
          }}
          aria-label="Open Travel Hub - Train Anywhere"
          title="Global Travel Hub (Train Anywhere)"
          className="w-9 h-9 shrink-0 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-200 hover:text-o1-crimson hover:border-white/[0.14] active:scale-90 transition shadow-xs cursor-pointer group"
        >
          <PremiumPlaneIcon className="w-3.5 h-3.5 text-neutral-200 group-hover:text-o1-crimson transition-colors" />
        </button>
      </div>
      )}
    </div>
  );
};

export default DiscoverHeader;
