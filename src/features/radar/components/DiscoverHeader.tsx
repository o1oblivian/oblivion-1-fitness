import React from 'react';
import { ChevronLeft, Compass, Users, Shield, User, Search, RotateCcw, X, MapPin } from 'lucide-react';
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
  const canGoBack = Boolean(searchQuery || activeTab === 'MATCHED');

  const handleOpenStudio = () => {
    tactileEngine.triggerSelectionBuzz();
    if (onOpenProfile) {
      onOpenProfile();
    } else if (onOpenFilters) {
      onOpenFilters();
    }
  };
  return (
    <div className="bg-[#F4F4F7] dark:bg-[#09090b] pb-2 select-none transition-colors border-b border-black/5 dark:border-white/5">
      {/* Top Row: Circular Back Chevron (dynamic) | Centered Buddy & Chats Pills | Right Shield & Sliders */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {/* Left: Round circular back button (revealed only in sub-views / search) */}
        {canGoBack ? (
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onBack?.(); }}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-800 dark:text-white/90 hover:text-neutral-900 dark:hover:text-white transition active:scale-90 cursor-pointer shadow-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}

        {/* Center: Buddy (pill) and Chats */}
        <div className="flex items-center gap-4">
          {/* Active Buddy Pill */}
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onTabChange('DISCOVER'); }}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
              activeTab === 'DISCOVER'
                ? 'bg-neutral-900 dark:bg-[#18181b] text-white border border-transparent dark:border-neutral-700 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#C4121A]" />
            <span className="text-[11px] font-semibold tracking-tight font-tactical">Buddy</span>
          </button>

          {/* Chats with Counter */}
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onTabChange('MATCHED'); }}
            className={`flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              activeTab === 'MATCHED'
                ? 'text-neutral-900 dark:text-white font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="text-[11px] font-medium tracking-tight font-tactical">Chats</span>
            {matchedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#C4121A] text-white text-[9.5px] font-mono font-bold leading-none">
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
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition active:scale-95 cursor-pointer p-1"
          >
            <Shield className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Nude Profile Icon: No border, no background fog, no green dot */}
          <button
            id="radar-profile-icon-btn"
            type="button"
            onClick={handleOpenStudio}
            aria-label="Profile"
            title="Profile & Settings"
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition active:scale-95 cursor-pointer p-1"
          >
            <User className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Active Destination Corridor Banner if travel destination is set */}
      {travelCity && (
        <div className="px-3 pt-1 pb-1">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-[#121214] border border-[#C4121A]/30 text-xs font-mono shadow-xs">
            <button
              type="button"
              onClick={onOpenTravelHub}
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90"
            >
              <div className="w-5 h-5 rounded-full bg-[#C4121A]/10 flex items-center justify-center text-[#C4121A]">
                <PremiumPlaneIcon className="w-3 h-3 text-[#C4121A]" />
              </div>
              <div className="flex items-center gap-1.5">
                {travelOrigin && (
                  <span className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">
                    {travelOrigin} ➔
                  </span>
                )}
                <span className="text-[11px] font-bold text-neutral-900 dark:text-white">
                  {travelCity.toUpperCase()}
                </span>
                <span className="text-[8.5px] text-[#C4121A] font-semibold px-1 py-0.2 bg-[#C4121A]/10 rounded border border-[#C4121A]/20">
                  {radiusKm} KM RADIUS
                </span>
              </div>
            </button>

            {onClearTravelCorridor && (
              <button
                type="button"
                onClick={onClearTravelCorridor}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
                title="Reset to local radar"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input and Separate Dedicated Flight/Plane Travel Trigger: (search         ) ( 🛫 ) */}
      <div className="flex items-center gap-2 px-3 mt-1.5">
        {/* Dedicated Search Bar (search         ) */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={travelCity ? `Search athletes & gyms in ${travelCity}...` : "Search gym, name, discipline..."}
            className="w-full pl-9 pr-8 py-2 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-[11px] placeholder:text-[11px] placeholder-neutral-400 dark:placeholder-neutral-500 text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); onSearchChange(''); }}
              aria-label="Clear search"
              className="absolute right-3 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white active:scale-90 transition cursor-pointer"
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
          className="w-9 h-9 shrink-0 rounded-full bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-[#C4121A] dark:hover:text-[#C4121A] hover:border-neutral-300 dark:hover:border-neutral-700 active:scale-90 transition shadow-xs cursor-pointer group"
        >
          <PremiumPlaneIcon className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-200 group-hover:text-[#C4121A] transition-colors" />
        </button>
      </div>

      {/* Sub-Bar Telemetry & Scan: "● 0 athletes within 25 km" and "⟲ Scan" */}
      <div className="flex items-center justify-between px-4 mt-2 text-[10.5px] font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A] shrink-0" />
            <span className="font-sans font-medium text-[10.5px] text-neutral-600 dark:text-neutral-300">
              {count} athletes {travelCity ? `in ${travelCity}` : `within ${radiusKm} km`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onScan}
          className="flex items-center gap-1 text-[#C4121A] hover:text-red-600 dark:hover:text-red-400 font-sans font-medium text-[10.5px] active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
          <span>Scan</span>
        </button>
      </div>
    </div>
  );
};

export default DiscoverHeader;
