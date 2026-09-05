import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import {
  type WallpaperSettings,
  type WallpaperMode,
  loadWallpaperSettings,
  saveWallpaperSettings,
} from '../utils/wallpaperStore';
import {
  WALLPAPER_CATEGORIES,
  type WallpaperCategory,
  CURATED_100_WALLPAPERS,
} from '../data/curatedWallpapers';
import { useModalBackHandler } from '../utils/modalHistory';

interface WallpaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChange: (settings: WallpaperSettings) => void;
  onOpenPicker?: () => void;
}

const REFRESH_OPTIONS = [
  { sec: 5, label: '5s' },
  { sec: 10, label: '10s' },
  { sec: 15, label: '15s' },
  { sec: 30, label: '30s' },
  { sec: 60, label: '1 min' },
  { sec: 300, label: '5 min' },
];

export const WallpaperSettingsModal: React.FC<WallpaperSettingsModalProps> = ({
  isOpen,
  onClose,
  onChange,
  onOpenPicker,
}) => {
  const [settings, setSettings] = useState<WallpaperSettings>(loadWallpaperSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useModalBackHandler(isOpen, onClose, 'wallpaper_settings_modal');

  if (!isOpen) return null;

  const update = (partial: Partial<WallpaperSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveWallpaperSettings(next);
    onChange(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const readers: Promise<string>[] = [];
    for (let i = 0; i < files.length && i < 15; i++) {
      const file = files[i];
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.readAsDataURL(file);
        })
      );
    }
    Promise.all(readers).then((dataUrls) => {
      const valid = dataUrls.filter(Boolean);
      const updatedList = [...settings.customImages, ...valid];
      update({ customImages: updatedList, mode: 'custom' });
    });
  };

  const removeCustomImage = (index: number) => {
    const next = settings.customImages.filter((_, i) => i !== index);
    update({ customImages: next, mode: next.length === 0 ? 'curated' : settings.mode });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#18181B] text-zinc-900 dark:text-white w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative flex flex-col overflow-hidden font-sans max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#18181B] px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              Wallpaper & Auto-Play Settings
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gym Floor, Hyrox Athletes, Track, Alpine, Vault, or OLED
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              Wallpaper Mode
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'curated' as WallpaperMode,
                  label: 'Curated Pro',
                  desc: 'Gym, Hyrox, Run, Alpine',
                },
                {
                  id: 'custom' as WallpaperMode,
                  label: 'Phone Vault',
                  desc: 'Your uploaded photos',
                },
                {
                  id: 'off' as WallpaperMode,
                  label: 'Obsidian',
                  desc: 'OLED clean minimal',
                },
              ].map((m) => {
                const isSelected = settings.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update({ mode: m.id })}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? 'border-[#EA4335] bg-red-50/60 dark:bg-red-950/20 ring-1 ring-[#EA4335]'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-[#EA4335]' : 'text-zinc-900 dark:text-white'
                        }`}
                      >
                        {m.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#EA4335] shrink-0" />}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-1 leading-tight">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Curated Mode: Auto-Play Controls, Shuffle & Category Channel */}
          {settings.mode === 'curated' && (
            <>
              {/* Auto Play & Shuffle Engine */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      Auto-Play Rotation
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      {settings.autoPlay
                        ? `Rotating every ${settings.refreshIntervalSec}s in ${settings.shuffle !== false ? 'random' : 'sequential'} order`
                        : 'Rotation paused on current photo'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => update({ autoPlay: !settings.autoPlay })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      settings.autoPlay
                        ? 'bg-[#EA4335] text-white hover:bg-red-700'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {settings.autoPlay ? 'Active' : 'Paused'}
                  </button>
                </div>

                {/* Shuffle / Random Order Selector */}
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      Shuffle / Random Rotation
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      {settings.shuffle !== false
                        ? 'Wallpapers rotate in dynamic random order'
                        : 'Wallpapers rotate in fixed sequential order'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => update({ shuffle: settings.shuffle === false ? true : false })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      settings.shuffle !== false
                        ? 'bg-[#EA4335] text-white shadow-xs'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {settings.shuffle !== false ? 'Shuffle ON' : 'Sequential'}
                  </button>
                </div>

                {/* Interval Options */}
                <div className="space-y-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Interval Speed
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">
                      {settings.refreshIntervalSec}s
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {REFRESH_OPTIONS.map((opt) => (
                      <button
                        key={opt.sec}
                        type="button"
                        onClick={() =>
                          update({
                            refreshIntervalSec: opt.sec,
                            autoPlay: true,
                            continuousRotation: true,
                          })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                          settings.refreshIntervalSec === opt.sec
                            ? 'bg-[#EA4335] text-white border-[#EA4335]'
                            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Channel Filter
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {settings.categoryFilter === 'all'
                      ? `${CURATED_100_WALLPAPERS.length} Wallpapers`
                      : `${CURATED_100_WALLPAPERS.filter((w) => w.category === settings.categoryFilter).length} Wallpapers`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WALLPAPER_CATEGORIES.map((cat) => {
                    const isSelected = settings.categoryFilter === cat.id;
                    const count =
                      cat.id === 'all'
                        ? CURATED_100_WALLPAPERS.length
                        : CURATED_100_WALLPAPERS.filter((w) => w.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => update({ categoryFilter: cat.id as WallpaperCategory, autoPlay: true })}
                        className={`px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-[#EA4335] bg-red-50/70 dark:bg-red-950/20 text-[#EA4335] font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                        }`}
                      >
                        <span className="text-xs truncate">{cat.label}</span>
                        <span className="text-[10px] opacity-70 px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 font-mono shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Jump to Gallery Browser */}
              {onOpenPicker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPicker();
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Browse Full Wallpaper Gallery ({CURATED_100_WALLPAPERS.length} Photos)
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </>
          )}

          {/* If Custom Mode: Phone Vault */}
          {settings.mode === 'custom' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer flex items-center justify-center gap-3 text-center"
              >
                <Plus className="w-5 h-5 text-[#EA4335]" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Add Photos from Phone
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {settings.customImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {settings.customImages.map((img, i) => (
                    <div
                      key={i}
                      className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-zinc-200 dark:border-zinc-800"
                    >
                      <img src={img} alt={`Vault ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeCustomImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-2">
                  No photos uploaded yet. Tap above to select photos from your device.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            {settings.mode === 'curated'
              ? `Auto-play active (${settings.shuffle !== false ? 'shuffled' : 'sequential'})`
              : settings.mode === 'custom'
              ? `${settings.customImages.length} personal photos in vault`
              : 'OLED obsidian mode enabled'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#EA4335] text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
