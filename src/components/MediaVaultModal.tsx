import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Play,
  Heart,
  Video,
  Image as ImageIcon,
  Share2,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Dumbbell,
  FlaskConical,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SwipeableMediaViewer } from './SwipeableMediaViewer';
import {
  persistUploadedVaultMedia,
  deleteAthleteVaultItem,
  deleteCoachVaultItem,
  saveAthleteVaultItems,
  saveCoachVaultItems,
} from '../utils/vaultPersistenceStore';
import { idbDeleteVaultItem } from '../utils/indexedDbMediaVault';

export interface VaultMediaItem {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
  category: 'Photos' | 'Videos' | 'Physique' | 'Form Video' | 'PR Clip' | 'Tutorial' | 'Transformation';
  date: string;
  likes: number;
  coachNote?: string;
  tags?: string[];
  specialization?: string;
  show_on_buddy?: boolean;
  rawBlob?: Blob | File;
}

interface MediaVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: VaultMediaItem[];
  isUnlocked?: boolean;
  displayName?: string;
  ownerName?: string;
  vaultTitle?: string;
  showroomMode?: boolean;
  maskedName?: string;
  realName?: string;
  socialLinks?: any;
  programPrice?: string;
  onBuyProgram?: () => void;
  onTestExercise?: (item: VaultMediaItem) => void;
  mode?: 'athlete' | 'coach';
  onAddItem?: (item: VaultMediaItem) => void;
  onDeleteItem?: (item: VaultMediaItem) => void;
  onToggleBuddy?: (item: VaultMediaItem) => void;
  showToast?: (msg?: string, type?: 'error' | 'success') => void;
}

export function formatVaultMediaTitle(item: VaultMediaItem): string {
  if (item.title && item.title.trim()) return item.title;
  return item.type === 'video' ? 'Form Check Video' : 'Athlete Progress Shot';
}

function resolveVideoSrc(item: VaultMediaItem): string {
  if (item.rawBlob) {
    try {
      return URL.createObjectURL(item.rawBlob);
    } catch {
      // ignore
    }
  }
  if (!item.url) return item.thumbnailUrl || '';
  if (item.url.startsWith('data:video/')) {
    try {
      const parts = item.url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch {
      return item.url;
    }
  }
  return item.url;
}

export const MediaVaultModal: React.FC<MediaVaultModalProps> = ({
  isOpen,
  onClose,
  items: initialItems,
  isUnlocked = true,
  displayName,
  ownerName: propOwnerName,
  programPrice,
  onBuyProgram,
  onTestExercise,
  mode = 'athlete',
  vaultTitle = 'Media Vault',
  showroomMode = false,
  maskedName,
  onAddItem,
  onDeleteItem,
  onToggleBuddy,
}) => {
  const [items, setItems] = useState<VaultMediaItem[]>(initialItems);
  const [activeItem, setActiveItem] = useState<VaultMediaItem | null>(null);
  const [showroomIndex, setShowroomIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Photos' | 'Videos'>('ALL');
  const showroomTouchStartRef = useRef<number>(0);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Sync external items
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const effectiveDisplayName = maskedName || displayName || propOwnerName || 'Athlete';
  const ownerName = useMemo(() => {
    if (propOwnerName && propOwnerName.trim()) return propOwnerName;
    if (mode === 'coach') return effectiveDisplayName || 'Coach';
    return effectiveDisplayName && effectiveDisplayName !== 'Athlete' ? effectiveDisplayName : 'Athlete';
  }, [propOwnerName, mode, effectiveDisplayName]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'Photos') return item.type === 'photo';
      if (selectedCategory === 'Videos') return item.type === 'video';
      return true;
    });
  }, [items, selectedCategory]);

  // Lock Body & HTML Scroll to strip background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLikeItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, likes: i.likes + 1 } : i))
    );
  };

  const handleToggleBuddy = (item: VaultMediaItem) => {
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, show_on_buddy: !i.show_on_buddy } : i
    );
    setItems(updated);
    if (mode === 'coach') {
      saveCoachVaultItems(updated);
    } else {
      saveAthleteVaultItems(updated);
    }
    if (onToggleBuddy) {
      const target = updated.find((i) => i.id === item.id);
      if (target) onToggleBuddy(target);
    }
  };

  const handleDeleteItem = (item: VaultMediaItem) => {
    const updated = items.filter((i) => i.id !== item.id);
    setItems(updated);
    if (mode === 'coach') {
      deleteCoachVaultItem(item.id);
    } else {
      deleteAthleteVaultItem(item.id);
    }
    idbDeleteVaultItem(item.id);
    if (onDeleteItem) onDeleteItem(item);
    if (activeItem?.id === item.id) {
      setActiveItem(null);
    }
  };

  const handleGalleryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const persisted = await persistUploadedVaultMedia(
        file,
        mode === 'coach' ? 'coach' : 'athlete'
      );
      const updated = [persisted, ...items.filter((i) => i.id !== persisted.id)];
      setItems(updated);
      if (onAddItem) onAddItem(persisted);
    } catch (err) {
      console.error('Failed to persist vault upload', err);
    } finally {
      e.target.value = '';
    }
  };

  // ─── PRO CAROUSEL SHOWROOM (FOR COACH STOREFRONT / LOCKED EXPERIENCE) ───
  if (mode === 'coach' && !isUnlocked) {
    const currentItem = items[showroomIndex] || items[0];

    const goNext = () => {
      if (showroomIndex < items.length - 1) {
        setShowroomIndex((prev) => prev + 1);
      }
    };

    const goPrev = () => {
      if (showroomIndex > 0) {
        setShowroomIndex((prev) => prev - 1);
      }
    };

    const handleShowroomTouchStart = (e: React.TouchEvent) => {
      showroomTouchStartRef.current = e.touches[0].clientX;
    };

    const handleShowroomTouchEnd = (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - showroomTouchStartRef.current;
      if (deltaX < -50) goNext();
      if (deltaX > 50) goPrev();
    };

    if (!currentItem) {
      const emptyUi = (
        <div className="fixed inset-0 z-[99990] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overscroll-contain">
          <div className="bg-[#12141A] border border-white/10 rounded-2xl p-6 text-center max-w-sm text-white space-y-4">
            <p className="text-zinc-400 font-mono text-xs">No media preview available for this coach.</p>
            <button
              onClick={onClose}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      );
      return typeof document !== 'undefined' ? createPortal(emptyUi, document.body) : emptyUi;
    }

    const videoSrc = currentItem.type === 'video' ? resolveVideoSrc(currentItem) : '';

    const showroomUi = (
      <div
        className="fixed inset-0 z-[99990] bg-black/95 backdrop-blur-2xl flex flex-col select-none animate-in fade-in duration-200 overscroll-contain"
        onTouchStart={handleShowroomTouchStart}
        onTouchEnd={handleShowroomTouchEnd}
      >
        {/* Top bar — Apple Studio compact header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-xs truncate flex items-center gap-1.5">
                {displayName}
                <span className="text-[8px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 uppercase tracking-wider shrink-0">
                  MASKED
                </span>
              </div>
              <div className="text-[9px] text-white/50 font-mono truncate">
                Identity revealed after purchase
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 border border-white/10 backdrop-blur-md"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Media stage */}
        <div className="flex-1 relative flex items-center justify-center p-4 pt-14 pb-24 overflow-hidden">
          {showroomIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md border border-white/10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center max-h-[68vh]" key={currentItem.id}>
            {currentItem.type === 'video' && videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
                className="max-w-full max-h-[68vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <img
                src={currentItem.url || currentItem.thumbnailUrl}
                alt={formatVaultMediaTitle(currentItem)}
                className="max-w-full max-h-[68vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {showroomIndex < items.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-md border border-white/10"
              aria-label="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dots Indicator */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setShowroomIndex(idx)}
                className={`h-1 rounded-full transition-all cursor-pointer ${
                  idx === showroomIndex ? 'w-3.5 bg-white' : 'w-1 bg-white/30'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Floating Bottom Action Sheet */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#12141A]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] font-mono uppercase text-red-400 font-bold tracking-wider">
                {currentItem.category} • {currentItem.date}
              </span>
              <h4 className="text-white font-semibold text-xs truncate">
                {formatVaultMediaTitle(currentItem)}
              </h4>
            </div>
            <div className="text-[9px] text-white/50 font-mono shrink-0">
              {showroomIndex + 1} / {items.length}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            {onTestExercise && (
              <button
                type="button"
                onClick={() => onTestExercise(currentItem)}
                className="flex-1 py-1.5 px-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-xs"
              >
                <FlaskConical className="w-3 h-3" />
                <span>Trial & Chat</span>
              </button>
            )}
            {onBuyProgram && (
              <button
                type="button"
                onClick={onBuyProgram}
                className="flex-1 py-1.5 px-2.5 bg-[#EA4335] hover:bg-[#EA4335] text-white font-mono text-[10px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-xs"
              >
                <Lock className="w-3 h-3" />
                <span>Buy Program{programPrice ? ` (${programPrice})` : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(showroomUi, document.body) : showroomUi;
  }

  // ─── APPLE STUDIO VAULT MODAL (EDGE-TO-EDGE & COMPACT) ───
  const modalUi = (
    <div
      className="fixed inset-0 z-[99990] bg-black/40 dark:bg-black/80 backdrop-blur-xs flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-xl bg-white dark:bg-[#0D0F15] text-zinc-900 dark:text-white sm:rounded-2xl border-0 sm:border sm:border-neutral-200 dark:sm:border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Studio Header */}
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0D0F15] shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wider">
                {vaultTitle.toLowerCase().endsWith('vault') ? vaultTitle : `${vaultTitle} Vault`}
              </span>
              <span className="text-[9px] font-mono text-neutral-500 dark:text-zinc-400">
                {items.length} Items
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 tracking-tight truncate">
              {ownerName && ownerName.trim() && ownerName !== 'Athlete'
                ? `${ownerName}'s Media Vault`
                : (vaultTitle.toLowerCase().endsWith('vault') ? vaultTitle : `${vaultTitle} Vault`)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-nude-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seamless Apple Segmented Track */}
        <div className="p-2 border-b border-neutral-100 dark:border-white/5 flex items-center gap-1.5 bg-neutral-50 dark:bg-black/20 text-xs font-mono shrink-0">
          <div className="flex-1 flex items-center p-0.5 bg-neutral-200/60 dark:bg-white/5 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer text-center ${
                selectedCategory === 'ALL'
                  ? 'bg-white dark:bg-white/20 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Photos')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedCategory === 'Photos'
                  ? 'bg-white dark:bg-white/20 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Videos')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                selectedCategory === 'Videos'
                  ? 'bg-white dark:bg-white/20 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>Videos</span>
            </button>
          </div>
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleGalleryFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="py-1.5 px-3 rounded-xl bg-[#EA4335] hover:bg-[#EA4335] text-white text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shrink-0 shadow-xs"
            title="Upload Photo or Video"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* High-Density Media Grid */}
        <div className="p-3 overflow-y-auto flex-1 bg-white dark:bg-transparent">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400 dark:text-zinc-500 font-mono text-xs">
              <Camera className="w-7 h-7 mb-2 text-neutral-300 dark:text-zinc-600" />
              <span className="font-semibold">No media in this category.</span>
              <p className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-0.5">Tap Add to import photos or workout form videos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-black/60 border border-neutral-100 dark:border-white/10 hover:border-red-500/50 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={formatVaultMediaTitle(item)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono font-bold bg-black/60 text-white/90 px-1.5 py-0.5 rounded uppercase backdrop-blur-xs">
                        {item.type === 'video' ? 'VID' : 'PIC'}
                      </span>
                      
                      {/* Eye / Buddy Card Visibility Quick-Tap Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBuddy(item);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
                          item.show_on_buddy
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-black/50 text-white/70 hover:text-white'
                        }`}
                        title={item.show_on_buddy ? 'Visible on Buddy Card (tap to hide)' : 'Hidden from Buddy Card (tap to show)'}
                        aria-label="Toggle Buddy Visibility"
                      >
                        {item.show_on_buddy ? (
                          <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 stroke-[1.8]" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[8px] font-mono text-white/80 truncate">
                        {item.date}
                      </div>
                      {item.type === 'video' && (
                        <div className="w-4 h-4 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-xs">
                          <Play className="w-2 h-2 fill-current ml-0.2" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LIGHTBOX APPLE GALLERY VIEWER */}
        {activeItem && (
          <SwipeableMediaViewer
            isOpen={!!activeItem}
            onClose={() => setActiveItem(null)}
            items={filteredItems}
            startIndex={Math.max(0, filteredItems.findIndex((i) => i.id === activeItem.id))}
            ownerName={displayName}
            onToggleFavorite={(item) => handleLikeItem(item.id)}
            onToggleBuddy={handleToggleBuddy}
            onDelete={handleDeleteItem}
          />
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalUi, document.body) : modalUi;
};
