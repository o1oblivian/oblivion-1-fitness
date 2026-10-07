import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ImagePlus,
  Trash2,
  BatteryCharging,
  Clock,
  Play,
  Pause,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Activity,
  Timer,
  Swords,
  Mountain,
  Sparkles,
} from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { useWallpaperStore, WallpaperInterval } from '../../stores/useWallpaperStore';
import { WallpaperTopic } from '../../services/liveWallpaperService';
import { compressWallpaperFile } from '../../services/wallpaperImage';
import { CrimsonSwitch } from './CrimsonSwitch';

interface WallpaperSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const TOPICS: { id: WallpaperTopic; label: string; icon: typeof Dumbbell }[] = [
  { id: 'hyrox', label: 'Hyrox', icon: Activity },
  { id: 'iron', label: 'Iron', icon: Dumbbell },
  { id: 'track', label: 'Track', icon: Timer },
  { id: 'combat', label: 'Combat', icon: Swords },
  { id: 'nature', label: 'Nature', icon: Mountain },
  { id: 'all', label: 'Mix', icon: Sparkles },
];

export const WallpaperSelectorModal: React.FC<WallpaperSelectorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  const {
    customUrl,
    isEnabled,
    isPaused,
    intervalSeconds,
    topic,
    pool,
    activeIndex,
    sourceLabel,
    isLoading,
    setCustomWallpaper,
    clearCustomWallpaper,
    setEnabled,
    setTopic,
    setIntervalSeconds,
    togglePause,
    nextWallpaper,
    prevWallpaper,
    selectWallpaper,
    refreshLive,
    reportBroken,
    getActiveWallpaper,
  } = useWallpaperStore();

  const current = getActiveWallpaper();
  const pickerSlides = [
    ...(customUrl ? [{ url: customUrl, thumb: customUrl, title: 'Your wallpaper' }] : []),
    ...pool.map((p) => ({ url: p.url, thumb: p.thumbUrl, title: p.title })),
  ];
  const slideCount = pickerSlides.length;

  useEffect(() => {
    if (!isOpen || !isEnabled) return;
    void refreshLive(true);
  }, [isOpen, isEnabled, refreshLive]);

  if (!isOpen) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReading(true);
    try {
      const dataUrl = await compressWallpaperFile(file);
      const saved = setCustomWallpaper(dataUrl);
      if (!saved) {
        onShowToast?.('Photo is too large for this device. Try a smaller image.');
        return;
      }
      tactileEngine.triggerSelectionBuzz();
      onShowToast?.('Your photo is in the rotation');
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : 'Could not set wallpaper');
    } finally {
      setIsReading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallpaper-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-150 select-none"
    >
      <div
        className="o1-sheet-card w-full bg-black text-neutral-100 border border-white/[0.07] shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0 min-h-[44px]">
          <div>
            <h2
              id="wallpaper-settings-title"
              className="font-tactical font-bold text-sm tracking-wider uppercase text-white leading-tight"
            >
              Workout wallpaper
            </h2>
              <p className="text-[11px] text-neutral-400">
              Hyrox · Iron · Track · Combat · Nature — pick, pause, or leave live
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-o1-card border border-white/[0.07]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-emerald-400 shrink-0">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-tactical font-bold text-xs uppercase tracking-wider text-white block">
                  Show on console
                </span>
                <p className="text-[11px] text-neutral-400">
                  {isEnabled ? 'Live rotation on the workout hero' : 'Off — no image load, saves battery'}
                </p>
              </div>
            </div>
            <CrimsonSwitch checked={isEnabled} onChange={setEnabled} />
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {TOPICS.map(({ id, label, icon: Icon }) => {
              const active = topic === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTopic(id)}
                  className={`min-w-0 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wide flex flex-col items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-zinc-100 text-neutral-950'
                      : 'bg-o1-well border border-white/[0.07] text-neutral-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {isEnabled && current && (
            <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-o1-well">
              <img
                key={current.url}
                src={current.url}
                alt=""
                decoding="async"
                onError={() => reportBroken(current.url)}
                className="w-full h-36 object-cover bg-black"
              />
              <div className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold truncate">{current.title}</p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">
                    {sourceLabel || 'Live'} · {slideCount} frames
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      prevWallpaper();
                    }}
                    className="w-8 h-8 rounded-lg bg-o1-card border border-white/[0.07] flex items-center justify-center cursor-pointer"
                    aria-label="Previous wallpaper"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      nextWallpaper();
                    }}
                    className="w-8 h-8 rounded-lg bg-o1-card border border-white/[0.07] flex items-center justify-center cursor-pointer"
                    aria-label="Next wallpaper"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEnabled && pickerSlides.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5">
              {pickerSlides.map((slide, idx) => {
                const selected = idx === activeIndex;
                return (
                  <button
                    key={`${slide.url}-${idx}`}
                    type="button"
                    onClick={() => selectWallpaper(idx)}
                    className={`relative overflow-hidden rounded-lg h-14 cursor-pointer border ${
                      selected
                        ? 'border-o1-crimson ring-1 ring-o1-crimson/40'
                        : 'border-white/[0.07]'
                    }`}
                    aria-label={`Select ${slide.title}`}
                  >
                    <img
                      src={slide.thumb ?? slide.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => reportBroken(slide.url)}
                      className="w-full h-full object-cover bg-black"
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="p-3 rounded-2xl bg-o1-card border border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span className="font-tactical font-bold text-xs uppercase tracking-wider">Auto-rotate</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                {isPaused ? 'Paused' : `${intervalSeconds}s`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-o1-well border border-white/[0.07]">
                {([10, 15, 30] as WallpaperInterval[]).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setIntervalSeconds(sec)}
                    className={`py-1.5 rounded-xl text-[10px] font-mono font-bold cursor-pointer ${
                      intervalSeconds === sec
                        ? 'bg-black text-white'
                        : 'text-neutral-500'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading || !isEnabled}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                void refreshLive(true);
                onShowToast?.('Shuffled a fresh set');
              }}
              className="w-full py-2 rounded-xl bg-zinc-100 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Shuffling set…' : 'Shuffle set'}</span>
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={isReading}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              fileRef.current?.click();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-o1-well border border-white/[0.07] text-neutral-200 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <ImagePlus className="w-4 h-4" />
            <span>{isReading ? 'Processing…' : customUrl ? 'Replace my photo' : 'Add my photo to rotation'}</span>
          </button>
          {customUrl && (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                clearCustomWallpaper();
                onShowToast?.('Your photo removed from rotation');
              }}
              className="w-full py-2 px-4 rounded-xl text-neutral-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove my photo</span>
            </button>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.05] flex justify-end">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:opacity-90 text-neutral-950 font-semibold text-xs tracking-wide cursor-pointer active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
