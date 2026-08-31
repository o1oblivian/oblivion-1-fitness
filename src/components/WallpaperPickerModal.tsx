import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  CURATED_100_WALLPAPERS,
  WALLPAPER_CATEGORIES,
  type WallpaperCategory,
  type CuratedWallpaper,
  getCuratedWallpaperUrl,
  getCuratedThumbUrl,
} from '../data/curatedWallpapers';
import {
  loadWallpaperSettings,
  saveWallpaperSettings,
  type WallpaperSettings,
  type WallpaperItem,
} from '../utils/wallpaperStore';

interface WallpaperPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWallpaperUrl: string;
  onSelectWallpaper: (wp: WallpaperItem) => void;
  onOpenSettings?: () => void;
}

export const WallpaperPickerModal: React.FC<WallpaperPickerModalProps> = ({
  isOpen,
  onClose,
  selectedWallpaperUrl,
  onSelectWallpaper,
}) => {
  const [activeCategory, setActiveCategory] = useState<WallpaperCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<WallpaperSettings>(loadWallpaperSettings());

  const filteredWallpapers = useMemo(() => {
    let list = CURATED_100_WALLPAPERS;
    if (activeCategory !== 'all') {
      list = list.filter((w) => w.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.categoryLabel.toLowerCase().includes(q) ||
          w.author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (wp: CuratedWallpaper) => {
    const item: WallpaperItem = {
      id: wp.id,
      title: wp.title,
      category: wp.categoryLabel,
      thumbUrl: getCuratedThumbUrl(wp.photoId),
      fullUrl: getCuratedWallpaperUrl(wp.photoId),
      author: wp.author,
      ringColors: wp.ringColors,
    };
    const nextSettings: WallpaperSettings = {
      ...settings,
      mode: 'curated',
      selectedWallpaperId: wp.id,
      categoryFilter: activeCategory,
      autoPlay: true,
    };
    setSettings(nextSettings);
    saveWallpaperSettings(nextSettings);
    onSelectWallpaper(item);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl text-zinc-900 dark:text-white flex flex-col h-[90vh] font-sans">
        {/* Header: Title and subtitle on left, ONLY X on top right */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#18181B] shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
              Curated Athletic Wallpapers
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gym Floor, Hyrox Athletes, Track, Alpine, Cycling & Recovery
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-w-0 flex-1">
            {WALLPAPER_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as WallpaperCategory)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700/50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:border-[#DC2626]"
            />
          </div>
        </div>

        {/* 100 Wallpapers Grid */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          {filteredWallpapers.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto opacity-40 text-[#DC2626]" />
              <p className="text-sm font-medium">No matching wallpapers found</p>
              <p className="text-xs text-zinc-500">Try changing your search query or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredWallpapers.map((wp) => {
                const thumb = getCuratedThumbUrl(wp.photoId);
                const isSelected = selectedWallpaperUrl.includes(wp.photoId);

                return (
                  <div
                    key={wp.id}
                    onClick={() => handleSelect(wp)}
                    className={`group relative rounded-2xl overflow-hidden aspect-[4/5] border text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-98 ${
                      isSelected
                        ? 'border-[#DC2626] ring-2 ring-[#DC2626]'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={wp.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-lg ring-2 ring-white/20">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Category Pill Top Right */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90">
                      {wp.categoryLabel}
                    </div>

                    {/* Title & Photographer Info Bottom */}
                    <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                      <span className="text-xs font-bold block truncate drop-shadow-xs">
                        {wp.title}
                      </span>
                      <span className="text-[10px] text-white/70 block truncate mt-0.5">
                        Photo by {wp.author}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: ONLY professional Done button on bottom left */}
        <div className="p-3.5 sm:px-6 sm:py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-[#18181B]/95 flex items-center justify-start shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-6 rounded-xl text-xs font-semibold tracking-wide bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
