import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  Play,
  Pause,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Compass,
  Dumbbell,
  Sun,
  Flame,
  ZapOff,
  BatteryCharging,
} from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { useWallpaperStore, WallpaperInterval } from '../../stores/useWallpaperStore';
import { FreshWallpaperItem } from '../../data/freshWallpaperCatalog';
import { CrimsonSwitch } from './CrimsonSwitch';

interface WallpaperSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

type CategoryFilter = 'all' | 'nature' | 'athlete' | 'mood_uplift' | 'inspirational';

export const WallpaperSelectorModal: React.FC<WallpaperSelectorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const {
    wallpapers,
    activeWallpaperIndex,
    intervalSeconds,
    isPaused,
    isEnabled,
    setWallpaperIndex,
    setIntervalSeconds,
    togglePause,
    toggleEnabled,
    nextWallpaper,
    prevWallpaper,
    getActiveWallpaper,
  } = useWallpaperStore();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentWallpaper = getActiveWallpaper();

  // Filter 100 fresh wallpapers by category & search
  const filteredWallpapers = useMemo(() => {
    let list = wallpapers;
    if (selectedCategory !== 'all') {
      list = list.filter((w) => w.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.author.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [wallpapers, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (item: FreshWallpaperItem) => {
    tactileEngine.triggerSelectionBuzz();
    const idx = wallpapers.findIndex((w) => w.id === item.id);
    if (idx !== -1) {
      setWallpaperIndex(idx);
      onShowToast?.(`Wallpaper set: ${item.title}`);
    }
  };

  const handleIntervalChange = (sec: WallpaperInterval) => {
    setIntervalSeconds(sec);
    onShowToast?.(`Auto-rotate set to ${sec}s`);
  };

  const handleTogglePause = () => {
    togglePause();
    onShowToast?.(isPaused ? 'Auto-rotate resumed' : 'Auto-rotate paused');
  };

  const categoryCounts = {
    all: wallpapers.length,
    nature: wallpapers.filter((w) => w.category === 'nature').length,
    athlete: wallpapers.filter((w) => w.category === 'athlete').length,
    mood_uplift: wallpapers.filter((w) => w.category === 'mood_uplift').length,
    inspirational: wallpapers.filter((w) => w.category === 'inspirational').length,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallpaper-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 rounded-none md:rounded-3xl border-0 md:border border-neutral-200 dark:border-neutral-800 shadow-2xl h-full md:h-[90vh] flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 text-[#C4121A] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="wallpaper-settings-title" className="font-tactical font-bold text-sm tracking-wider uppercase text-neutral-900 dark:text-white leading-tight">
                Wallpaper &amp; Auto-Rotate Settings
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                100 Curated Nature, Athlete, Mood &amp; Inspirational Visuals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* SECTION 1: AUTO-ROTATE & BATTERY SAVER DECK */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 space-y-4">
            {/* Battery Saver Master Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-tactical font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                      Wallpapers Active
                    </span>
                    {!isEnabled && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                        SAVING BATTERY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {isEnabled ? 'Visual wallpapers rendering on workout console' : 'Turned off for maximum phone battery life and zero background loading'}
                  </p>
                </div>
              </div>
              <CrimsonSwitch
                checked={isEnabled}
                onChange={toggleEnabled}
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C4121A]" />
                <span className="font-tactical font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  Rotation Controls
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isPaused
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60'
                    : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  {isPaused ? 'Paused' : `Cycling Every ${intervalSeconds}s`}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  #{activeWallpaperIndex + 1} of 100
                </span>
              </div>
            </div>

            {/* Quick Actions: Pause/Resume + Speed Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={handleTogglePause}
                className={`w-full py-2.5 px-4 rounded-xl font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isPaused
                    ? 'bg-[#C4121A] hover:bg-[#a30f16] active:bg-[#800C11] text-white shadow-red-950/20'
                    : 'bg-neutral-200 dark:bg-[#18181b] hover:bg-neutral-300 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Auto-Rotate</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Auto-Rotate</span>
                  </>
                )}
              </button>

              {/* Interval Buttons: 10s, 15s, 30s */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-neutral-200/70 dark:bg-[#18181b] border border-neutral-300/80 dark:border-neutral-800">
                {([10, 15, 30] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleIntervalChange(sec)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      intervalSeconds === sec
                        ? 'bg-white dark:bg-[#09090b] text-[#C4121A] shadow-xs border border-neutral-300 dark:border-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Current Active Preview Strip with Steppers */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentWallpaper.thumbUrl}
                  alt={currentWallpaper.title}
                  onError={(e) => {
                    if (e.currentTarget.src !== currentWallpaper.url) {
                      e.currentTarget.src = currentWallpaper.url;
                    }
                  }}
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4121A] block">
                    Active Wallpaper
                  </span>
                  <p className="font-tactical font-bold text-xs text-neutral-900 dark:text-white truncate">
                    {currentWallpaper.title}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    Photo by {currentWallpaper.author} • Unsplash
                  </p>
                </div>
              </div>

              {/* Prev / Next Stepper */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    prevWallpaper();
                  }}
                  title="Previous Wallpaper"
                  className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    nextWallpaper();
                  }}
                  title="Next Wallpaper"
                  className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer active:scale-90 transition-transform"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: CATEGORY FILTERS & SEARCH */}
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 100 wallpapers by title, keyword, or author..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-neutral-100 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#C4121A] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All', icon: Sparkles },
                  { id: 'nature', label: 'Nature & Landscapes', icon: Compass },
                  { id: 'athlete', label: 'Athletes & Power', icon: Dumbbell },
                  { id: 'mood_uplift', label: 'Mood Uplift', icon: Sun },
                  { id: 'inspirational', label: 'Inspirational', icon: Flame },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const isActive = selectedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedCategory(id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#C4121A] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({categoryCounts[id]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: 100 WALLPAPERS HIGH DENSITY GRID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1 font-mono">
              <span>Showing {filteredWallpapers.length} Wallpapers</span>
              <span>Tap any photo to apply immediately</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredWallpapers.map((item) => {
                const isActive = item.id === currentWallpaper.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-100 dark:bg-[#18181b] border-2 transition-all cursor-pointer text-left focus:outline-none ${
                      isActive
                        ? 'border-[#C4121A] ring-2 ring-[#C4121A]/30 scale-[1.02] shadow-lg'
                        : 'border-transparent hover:border-neutral-400 dark:hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src !== item.url) {
                          e.currentTarget.src = item.url;
                        }
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay for Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Active Checkmark Badge */}
                    {isActive && (
                      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#C4121A] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Category Tag Top Left */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                      {item.category.replace('_', ' ')}
                    </div>

                    {/* Meta Bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-2.5 text-white">
                      <p className="font-tactical font-bold text-xs leading-snug line-clamp-1 drop-shadow-sm">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/70 font-mono truncate">
                        {item.author}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredWallpapers.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-bold text-neutral-500">No wallpapers found matching your search</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs text-[#C4121A] font-bold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-20 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md flex items-center justify-between">
          <div className="text-[11px] font-mono text-neutral-500">
            {isPaused ? 'Auto-rotate is paused' : `Rotating every ${intervalSeconds}s across 100 photos`}
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#C4121A] hover:bg-[#a30f16] active:bg-[#800C11] text-white font-tactical font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
