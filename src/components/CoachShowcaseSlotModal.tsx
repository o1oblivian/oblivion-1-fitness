import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Upload,
  Video,
  Image as ImageIcon,
  Sparkles,
  Play,
  Layers,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  CoachShowcaseConfig,
  getCoachShowcase,
  saveCoachShowcase,
} from '@/utils/coachShowcaseStore';

interface CoachShowcaseSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachIdOrName: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onSaved?: (config: CoachShowcaseConfig) => void;
}

const PRESET_LIBRARY = [
  {
    title: 'Hip 90/90 Kinetic Flow',
    type: 'video' as const,
    badge: 'DRILL',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-her-body-on-a-mat-41483-large.mp4',
    poster: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Dumbbell Kinetic Curls',
    type: 'video' as const,
    badge: 'DRILL',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-fitness-exercise-with-dumbbells-41485-large.mp4',
    poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Scapular Resistance Pitch',
    type: 'video' as const,
    badge: 'CUE',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-elastic-resistance-bands-41484-large.mp4',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Clinical Lab Assessment',
    type: 'photo' as const,
    badge: 'PHOTO',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Barbell Olympic Deadlift',
    type: 'video' as const,
    badge: 'HEAVY',
    url: 'https://videos.pexels.com/video-files/4761434/4761434-uhd_1440_2560_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Overhead Shoulder Lockout',
    type: 'video' as const,
    badge: 'CUE',
    url: 'https://videos.pexels.com/video-files/4754031/4754031-uhd_1440_2560_25fps.mp4',
    poster: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  },
];

export const CoachShowcaseSlotModal: React.FC<CoachShowcaseSlotModalProps> = ({
  isOpen,
  onClose,
  coachIdOrName,
  showToast,
  onSaved,
}) => {
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [config, setConfig] = useState<CoachShowcaseConfig>(() =>
    getCoachShowcase(coachIdOrName)
  );

  useEffect(() => {
    if (isOpen) {
      setConfig(getCoachShowcase(coachIdOrName));
    }
  }, [isOpen, coachIdOrName]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveCoachShowcase(config);
    showToast('Reels showcase & vault slots updated successfully!', 'success');
    if (onSaved) onSaved(config);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slotNum: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (slotNum === 1) {
        setConfig((prev) => ({
          ...prev,
          mainHero: {
            ...prev.mainHero,
            type: isVideo ? 'video' : 'photo',
            url: dataUrl,
            thumbnail: dataUrl,
          },
        }));
      } else if (slotNum === 2) {
        setConfig((prev) => ({
          ...prev,
          slot2: {
            ...prev.slot2,
            type: isVideo ? 'video' : 'photo',
            url: dataUrl,
            poster: dataUrl,
          },
        }));
      } else if (slotNum === 3) {
        setConfig((prev) => ({
          ...prev,
          slot3: {
            ...prev.slot3,
            type: isVideo ? 'video' : 'photo',
            url: dataUrl,
            poster: dataUrl,
          },
        }));
      } else if (slotNum === 4) {
        setConfig((prev) => ({
          ...prev,
          slot4: {
            ...prev.slot4,
            type: isVideo ? 'video' : 'photo',
            url: dataUrl,
            poster: dataUrl,
          },
        }));
      } else if (slotNum === 5) {
        setConfig((prev) => ({
          ...prev,
          slot5: {
            ...prev.slot5,
            type: isVideo ? 'video' : 'photo',
            url: dataUrl,
            poster: dataUrl,
          },
        }));
      }
      showToast(`Uploaded to Slot ${slotNum}!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: (typeof PRESET_LIBRARY)[0]) => {
    if (activeSlot === 1) {
      setConfig((prev) => ({
        ...prev,
        mainHero: {
          type: preset.type,
          title: preset.title,
          url: preset.url,
          thumbnail: preset.poster,
        },
      }));
    } else if (activeSlot === 2) {
      setConfig((prev) => ({
        ...prev,
        slot2: {
          type: preset.type,
          title: preset.title,
          badge: preset.badge,
          url: preset.url,
          poster: preset.poster,
        },
      }));
    } else if (activeSlot === 3) {
      setConfig((prev) => ({
        ...prev,
        slot3: {
          type: preset.type,
          title: preset.title,
          badge: preset.badge,
          url: preset.url,
          poster: preset.poster,
        },
      }));
    } else if (activeSlot === 4) {
      setConfig((prev) => ({
        ...prev,
        slot4: {
          type: preset.type,
          title: preset.title,
          badge: preset.badge,
          url: preset.url,
          poster: preset.poster,
        },
      }));
    } else if (activeSlot === 5) {
      setConfig((prev) => ({
        ...prev,
        slot5: {
          ...prev.slot5,
          title: preset.title,
          badge: preset.badge,
          url: preset.url,
          poster: preset.poster,
        },
      }));
    }
    showToast(`Applied preset to Slot ${activeSlot}`, 'success');
  };

  return (
    <div
      className="fixed inset-0 z-[280] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0E1118] border border-neutral-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Reels Showcase & Vault Studio
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white mt-1">
              Select 5-Slot Media Showcase
            </h2>
            <p className="text-xs text-zinc-500 dark:text-white/40">
              Pick your main full-screen reel (Slot 1) + 4 mini windows (Slots 2–5)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 flex items-center justify-center text-zinc-600 dark:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 5 SLOTS SELECTOR TABS ── */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40">
            Choose Slot to Configure
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {/* Slot 1 */}
            <button
              type="button"
              onClick={() => setActiveSlot(1)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlot === 1
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-neutral-50 dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 border-neutral-200 dark:border-white/10 hover:border-red-400'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase block">Slot 1</span>
              <span className="text-[9px] font-bold truncate block">Main Hero</span>
            </button>

            {/* Slot 2 */}
            <button
              type="button"
              onClick={() => setActiveSlot(2)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlot === 2
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-neutral-50 dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 border-neutral-200 dark:border-white/10 hover:border-red-400'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase block">Slot 2</span>
              <span className="text-[9px] font-bold truncate block">Mini 1</span>
            </button>

            {/* Slot 3 */}
            <button
              type="button"
              onClick={() => setActiveSlot(3)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlot === 3
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-neutral-50 dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 border-neutral-200 dark:border-white/10 hover:border-red-400'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase block">Slot 3</span>
              <span className="text-[9px] font-bold truncate block">Mini 2</span>
            </button>

            {/* Slot 4 */}
            <button
              type="button"
              onClick={() => setActiveSlot(4)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlot === 4
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-neutral-50 dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 border-neutral-200 dark:border-white/10 hover:border-red-400'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase block">Slot 4</span>
              <span className="text-[9px] font-bold truncate block">Mini 3</span>
            </button>

            {/* Slot 5 */}
            <button
              type="button"
              onClick={() => setActiveSlot(5)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                activeSlot === 5
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/25 scale-[1.02]'
                  : 'bg-neutral-50 dark:bg-white/[0.04] text-zinc-700 dark:text-white/70 border-neutral-200 dark:border-white/10 hover:border-red-400'
              }`}
            >
              <span className="text-[10px] font-mono font-black uppercase block">Slot 5</span>
              <span className="text-[9px] font-bold truncate block">Mini 4</span>
            </button>
          </div>
        </div>

        {/* ── ACTIVE SLOT EDITOR ── */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">
                {activeSlot}
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {activeSlot === 1
                  ? 'Main Fullscreen Reel (Hero Video/Photo)'
                  : activeSlot === 2
                  ? 'Mini Window 1 (e.g., Drill / Exercise)'
                  : activeSlot === 3
                  ? 'Mini Window 2 (e.g., Form Cue / Technique)'
                  : activeSlot === 4
                  ? 'Mini Window 3 (e.g., Photo / Proof / Lab)'
                  : 'Mini Window 4 (e.g., Programs & Consult)'}
              </h3>
            </div>
          </div>

          {/* Slot 1 Configuration */}
          {activeSlot === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                  Reel Title
                </label>
                <input
                  type="text"
                  value={config.mainHero.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      mainHero: { ...prev.mainHero, title: e.target.value },
                    }))
                  }
                  className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                  placeholder="e.g. Deep Hip 90/90 Kinetic Rotation"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Media Type
                  </label>
                  <select
                    value={config.mainHero.type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        mainHero: { ...prev.mainHero, type: e.target.value as 'video' | 'photo' },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <option value="video">Video (MP4 / WebM)</option>
                    <option value="photo">High-Res Photo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Upload From Device
                  </label>
                  <label className="w-full py-2 px-3 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-xs font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 1)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                  Media Direct URL
                </label>
                <input
                  type="text"
                  value={config.mainHero.url}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      mainHero: {
                        ...prev.mainHero,
                        url: e.target.value,
                        thumbnail: prev.mainHero.thumbnail || e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          {/* Slot 2 Configuration */}
          {activeSlot === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={config.slot2.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot2: { ...prev.slot2, badge: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none focus:border-red-500"
                    placeholder="DRILL"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Mini Window Title
                  </label>
                  <input
                    type="text"
                    value={config.slot2.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot2: { ...prev.slot2, title: e.target.value },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                    placeholder="Hip 90/90 Flow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Media Type
                  </label>
                  <select
                    value={config.slot2.type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot2: { ...prev.slot2, type: e.target.value as 'video' | 'photo' },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <option value="video">Video (Looping Clip)</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Upload From Device
                  </label>
                  <label className="w-full py-2 px-3 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-xs font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mini 1</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 2)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Slot 3 Configuration */}
          {activeSlot === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={config.slot3.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot3: { ...prev.slot3, badge: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none focus:border-red-500"
                    placeholder="CUE"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Mini Window Title
                  </label>
                  <input
                    type="text"
                    value={config.slot3.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot3: { ...prev.slot3, title: e.target.value },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                    placeholder="Scapular Pitch"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Media Type
                  </label>
                  <select
                    value={config.slot3.type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot3: { ...prev.slot3, type: e.target.value as 'video' | 'photo' },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <option value="video">Video (Looping Clip)</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Upload From Device
                  </label>
                  <label className="w-full py-2 px-3 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-xs font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mini 2</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 3)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Slot 4 Configuration */}
          {activeSlot === 4 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={config.slot4.badge}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot4: { ...prev.slot4, badge: e.target.value.toUpperCase() },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none focus:border-red-500"
                    placeholder="PHOTO"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Mini Window Title
                  </label>
                  <input
                    type="text"
                    value={config.slot4.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot4: { ...prev.slot4, title: e.target.value },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                    placeholder="Clinical Lab"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Media Type
                  </label>
                  <select
                    value={config.slot4.type}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot4: { ...prev.slot4, type: e.target.value as 'video' | 'photo' },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <option value="photo">Photo (High-Res Snapshot)</option>
                    <option value="video">Video Clip</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Upload From Device
                  </label>
                  <label className="w-full py-2 px-3 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-xs font-bold text-zinc-800 dark:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mini 3</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 4)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Slot 5 Configuration */}
          {activeSlot === 5 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Card Title
                  </label>
                  <input
                    type="text"
                    value={config.slot5.title}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot5: { ...prev.slot5, title: e.target.value },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none focus:border-red-500"
                    placeholder="PROGRAMS"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.slot5.subLabel || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slot5: { ...prev.slot5, subLabel: e.target.value },
                      }))
                    }
                    className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                    placeholder="& Consult"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 block mb-1">
                  Plans / Price Pill
                </label>
                <input
                  type="text"
                  value={config.slot5.highlightPrice || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      slot5: { ...prev.slot5, highlightPrice: e.target.value },
                    }))
                  }
                  className="w-full bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-red-500"
                  placeholder="2 Plans"
                />
              </div>
            </div>
          )}

          {/* Quick Preset Library */}
          <div className="pt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-white/40 flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or Choose from Preset Media Vault</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_LIBRARY.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 group cursor-pointer hover:border-red-500 transition-all text-left"
                >
                  <img
                    src={preset.poster}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/70 text-[7.5px] font-mono font-bold text-white uppercase">
                    {preset.badge}
                  </span>
                  <span className="absolute bottom-1 left-1 right-1 text-[8.5px] font-bold text-white truncate leading-tight">
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-zinc-700 dark:text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <Check className="w-4 h-4" />
            <span>Publish 5-Slot Showcase</span>
          </button>
        </div>
      </div>
    </div>
  );
};
