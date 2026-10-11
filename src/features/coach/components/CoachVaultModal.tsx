import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Trash2,
  Play,
  Radio,
  Film,
  UserCheck,
  Check,
  Loader2,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useUserStore } from '../../../stores/useUserStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { compressPhoto, compressVideo } from '../../../utils/mediaCompressor';
import { CoachReelUploadModal } from '../../reels/components/CoachReelUploadModal';
import type { ExploreReelItem } from '../../reels/reelTypes';

export interface VaultMediaItem {
  id: string;
  type: 'photo' | 'video';
  title: string;
  category: 'Transformation' | 'Biomechanics Audit' | 'Form Check' | 'Body Composition' | 'Exercise Guide';
  athleteName: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  fileSize?: string;
  notes?: string;
}

const STORAGE_KEY = 'o1_coach_exercise_vault_media';

export interface CoachVaultViewProps {
  embedded?: boolean;
}

export const CoachVaultView: React.FC<CoachVaultViewProps> = ({ embedded = false }) => {
  const buddy = useBuddyProfileStore();
  const user = useUserStore();
  const addCoachReel = useReelsStore((s) => s.addCoachReel);
  const ownerName = buddy.displayName || user.name || '';
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'reels'>('all');
  const [items, setItems] = useState<VaultMediaItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [selectedPreviewItem, setSelectedPreviewItem] = useState<VaultMediaItem | null>(null);
  const [showOnBuddyOnAdd] = useState(true);
  const [isReelUploadOpen, setIsReelUploadOpen] = useState(false);
  const [publishedReelIds, setPublishedReelIds] = useState<string[]>([]);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const photoCount = items.filter((i) => i.type === 'photo').length;
  const reelsCount = items.filter(
    (i) => i.type === 'video' || i.id.includes('reel') || publishedReelIds.includes(i.id)
  ).length;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'photo') return item.type === 'photo';
    if (activeTab === 'reels') {
      return item.type === 'video' || item.id.includes('reel') || publishedReelIds.includes(item.id);
    }
    return true;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    tactileEngine.triggerImpactPulse();
    setIsCompressing(true);
    const isVid = file.type.startsWith('video');

    try {
      const result = isVid ? await compressVideo(file) : await compressPhoto(file);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || (isVid ? 'Training Reel Check-in' : 'Progress Audit Photo');
      const newItem: VaultMediaItem = {
        id: `vault-media-${Date.now()}`,
        type: isVid ? 'video' : 'photo',
        title,
        category: isVid ? 'Form Check' : 'Transformation',
        athleteName: ownerName,
        url: result.url,
        thumbnailUrl: isVid ? result.thumbnailUrl || result.url : undefined,
        createdAt: 'Just now',
        fileSize: result.formattedCompressed,
      };

      setItems((prev) => [newItem, ...prev]);

      if (showOnBuddyOnAdd) {
        const buddyUrl = newItem.thumbnailUrl || newItem.url;
        if (!buddy.isPhotoOnBuddy(buddyUrl)) {
          buddy.toggleVaultPhotoOnBuddy(buddyUrl);
        }
      }

      tactileEngine.playPRCelebration();
      setAvatarSuccessMsg('Asset saved to Vault successfully!');
      setTimeout(() => setAvatarSuccessMsg(null), 2500);
    } catch (err) {
      console.warn('[CoachVault] Compression fallback:', err);
      const localUrl = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || (isVid ? 'Training Reel Check-in' : 'Progress Audit Photo');
      const newItem: VaultMediaItem = {
        id: `vault-media-${Date.now()}`,
        type: isVid ? 'video' : 'photo',
        title,
        category: isVid ? 'Form Check' : 'Transformation',
        athleteName: ownerName,
        url: localUrl,
        createdAt: 'Just now',
      };
      setItems((prev) => [newItem, ...prev]);
      setAvatarSuccessMsg('Asset saved to Vault successfully!');
      setTimeout(() => setAvatarSuccessMsg(null), 2500);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetAsAvatar = (item: VaultMediaItem) => {
    tactileEngine.playPRCelebration();
    const avatarUrl = item.thumbnailUrl || item.url;
    user.updateProfile({ avatarUrl });
    try {
      localStorage.setItem('o1_profile_avatar_url', avatarUrl);
    } catch (err) {
      console.error(err);
    }
    setAvatarSuccessMsg('Profile Avatar Updated!');
    setTimeout(() => setAvatarSuccessMsg(null), 2500);
  };

  const handlePublishToReels = (item: VaultMediaItem) => {
    tactileEngine.playPRCelebration();
    const thumb = item.thumbnailUrl || item.url;
    const filterTag: ExploreReelItem['filterTag'] =
      item.category === 'Biomechanics Audit'
        ? 'MOBILITY & REHAB'
        : item.category === 'Form Check'
        ? 'BACK & BICEPS'
        : item.category === 'Transformation' || item.category === 'Body Composition'
        ? 'QUADS & GLUTES'
        : 'CHEST & TRICEPS';

    addCoachReel({
      id: `reel-${Date.now()}`,
      title: item.title,
      category: 'BIOMECHANICS',
      filterTag,
      videoUrl: item.url,
      thumbnail: thumb,
      views: '--',
      duration: '0:18',
      coach: {
        id: user.userId || 'coach',
        name: buddy.displayName || user.name || 'Coach',
        handle: user.handle || '',
        avatar: buddy.buddyPhotos?.[0] || user.avatarUrl || '',
        verified: false,
        specialtyTitle: 'Coach',
        rating: 0,
        reviewCount: 0,
        certificationPill: '',
        rate: '',
        slotsRemaining: 0,
        bio: '',
        disciplines: [],
      },
      cues: item.notes || 'Biomechanical checkpoint synced from Coach Vault.',
      filmstripClips: [
        {
          id: `clip-${Date.now()}-1`,
          title: item.title,
          duration: '0:18',
          thumbnail: thumb,
          videoUrl: item.url,
          tag: 'BIOMECHANICS',
          badge: 'CUE',
        },
      ],
    });
    setPublishedReelIds((prev) => [...prev, item.id]);
    setAvatarSuccessMsg('⚡ Reel published to Train Ring!');
    setTimeout(() => setAvatarSuccessMsg(null), 2500);
  };

  const handleReelPublished = (reelTitle: string) => {
    tactileEngine.playPRCelebration();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore
    }
    setAvatarSuccessMsg(`⚡ Reel "${reelTitle}" uploaded & synced to Vault!`);
    setTimeout(() => setAvatarSuccessMsg(null), 3000);
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    const itemToDelete = items.find((i) => i.id === id);
    if (itemToDelete) {
      const url = itemToDelete.thumbnailUrl || itemToDelete.url;
      if (buddy.isPhotoOnBuddy(url)) {
        buddy.toggleVaultPhotoOnBuddy(url);
      }
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedPreviewItem?.id === id) {
      setSelectedPreviewItem(null);
    }
  };

  return (
    <div className={`w-full text-o1-text select-none ${
      embedded
        ? 'bg-o1-surface border border-white/[0.07] rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4'
        : 'p-3 sm:p-4 space-y-4'
    }`}>
      {/* Hidden File Input for Native Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. TOP STATUS STRIP: Buddy Profile Broadcast (Matching Screenshot 1) */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2 text-xs font-mono text-o1-muted">
          <Radio className="w-3.5 h-3.5 text-o1-crimson animate-pulse" />
          <span>
            Buddy Profile Broadcast: <strong className="text-o1-text">{buddy.buddyPhotos.length}/6</strong> active
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-o1-crimson/10 border border-o1-crimson/30 text-o1-crimson text-[9px] font-mono font-bold">
          {buddy.buddyPhotos.length} ON RADAR
        </span>
      </div>

      {/* Success Notification Banner */}
      {avatarSuccessMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{avatarSuccessMsg}</span>
        </div>
      )}

      {/* 2. CONTROL ROW: Filter Tabs + ADD Button on Right (Matching Screenshot 1) */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center bg-o1-sheet border border-white/[0.07] p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setActiveTab('all');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-o1-surface text-o1-text shadow-xs'
                : 'text-o1-muted hover:text-o1-text'
            }`}
          >
            ALL ({items.length})
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setActiveTab('photo');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-o1-surface text-o1-text shadow-xs'
                : 'text-o1-muted hover:text-o1-text'
            }`}
          >
            <Camera size={13} />
            <span>PHOTOS ({photoCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setActiveTab('reels');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reels'
                ? 'bg-o1-surface text-o1-crimson shadow-xs'
                : 'text-o1-muted hover:text-o1-text'
            }`}
          >
            <Film size={13} />
            <span>REELS ({reelsCount})</span>
          </button>
        </div>

        <button
          type="button"
          disabled={isCompressing}
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (activeTab === 'reels') {
              setIsReelUploadOpen(true);
            } else {
              fileInputRef.current?.click();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-o1-text text-xs font-bold font-mono tracking-wider cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-wait"
        >
          {isCompressing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : activeTab === 'reels' ? (
            <Film size={14} />
          ) : (
            <Camera size={14} />
          )}
          <span>{isCompressing ? 'Compressing…' : '+ Add'}</span>
        </button>
      </div>

      {/* 3. MEDIA GALLERY BODY */}
      <div>
        {filteredItems.length === 0 ? (
          <div className="py-24 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-o1-sheet border border-white/[0.07] flex items-center justify-center text-o1-muted">
              <Camera size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-o1-text">
                No media in this category.
              </h3>
              <p className="text-xs text-o1-muted max-w-xs font-mono">
                Tap Add to import athlete transformation photos or kinetic reels.
              </p>
            </div>
          </div>
        ) : (
          /* Responsive 2-Col Grid (3-Col on sm+) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setSelectedPreviewItem(item);
                }}
                className="group relative rounded-2xl overflow-hidden border border-white/[0.07] bg-o1-sheet aspect-square flex flex-col justify-between cursor-pointer hover:shadow-md transition-all"
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full relative bg-o1-sheet">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-o1-crimson flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={18} className="ml-0.5 fill-o1-crimson" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Top Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1">
                    {(item.type === 'video' || item.id.includes('reel') || publishedReelIds.includes(item.id)) && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-o1-crimson text-o1-text shadow-xs flex items-center gap-1">
                        <Film size={10} />
                        Reel
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/60 text-o1-text backdrop-blur-xs">
                      {item.athleteName}
                    </span>
                  </div>

                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 text-o1-text backdrop-blur-xs">
                    {item.category === 'Biomechanics Audit' ? '4K AUDIT' : item.category.toUpperCase()}
                  </span>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-xs font-bold text-o1-text truncate drop-shadow-sm">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-o1-text font-mono">
                    {item.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. FULL-SCREEN LIGHTBOX / PREVIEW VIEWER */}
      {selectedPreviewItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-o1-sheet border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col text-o1-text shadow-2xl">
            {/* Header */}
            <div className="p-3.5 border-b border-white/[0.07] flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-o1-crimson text-o1-text">
                  {selectedPreviewItem.category}
                </span>
                <h3 className="text-xs font-bold truncate max-w-xs sm:max-w-md">
                  {selectedPreviewItem.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedPreviewItem.id)}
                  className="p-1.5 text-o1-muted hover:text-red-400 transition cursor-pointer"
                  title="Delete Item"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewItem(null)}
                  className="p-1.5 text-o1-muted hover:text-o1-text transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Media Presentation */}
            <div className="relative bg-o1-canvas flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
              {selectedPreviewItem.type === 'video' ? (
                <video
                  src={selectedPreviewItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[60vh] w-auto max-w-full object-contain"
                />
              ) : (
                <img
                  src={selectedPreviewItem.url}
                  alt={selectedPreviewItem.title}
                  className="max-h-[60vh] w-auto max-w-full object-contain"
                />
              )}
            </div>

            {/* Footer Metadata & Action Bar */}
            <div className="p-4 bg-o1-canvas border-t border-white/[0.07] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-o1-text block">
                    {selectedPreviewItem.athleteName}
                  </span>
                  <span className="text-[10px] text-o1-muted font-mono">
                    {selectedPreviewItem.createdAt}
                  </span>
                </div>
                {selectedPreviewItem.fileSize && (
                  <span className="px-2 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono text-o1-text">
                    {selectedPreviewItem.fileSize}
                  </span>
                )}
              </div>

              {selectedPreviewItem.notes && (
                <div className="p-2.5 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text">
                  <span className="text-[10px] font-bold text-amber-500 block font-mono mb-0.5">
                    Biomechanical Notes
                  </span>
                  {selectedPreviewItem.notes}
                </div>
              )}

              {/* Action Controls */}
              {(() => {
                const targetUrl = selectedPreviewItem.thumbnailUrl || selectedPreviewItem.url;
                const onBuddy = buddy.isPhotoOnBuddy(targetUrl);
                const isVid = selectedPreviewItem.type === 'video';
                const isPublished = publishedReelIds.includes(selectedPreviewItem.id);

                return (
                  <div className="space-y-2 pt-1">
                    <div className="p-2 rounded-xl bg-o1-sheet border border-white/[0.07] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-o1-crimson animate-pulse" />
                        <span className="text-[11px] text-o1-text">
                          Buddy Profile Broadcast: {onBuddy ? 'Active on Radar' : 'Vault Only'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => buddy.toggleVaultPhotoOnBuddy(targetUrl)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                          onBuddy
                            ? 'bg-o1-crimson text-o1-text shadow-xs'
                            : 'bg-white/[0.08] text-o1-text hover:text-o1-text'
                        }`}
                      >
                        {onBuddy ? 'On radar' : 'set on'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetAsAvatar(selectedPreviewItem)}
                        className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-o1-text text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Set as Avatar</span>
                      </button>

                      {isVid ? (
                        <button
                          type="button"
                          disabled={isPublished}
                          onClick={() => handlePublishToReels(selectedPreviewItem)}
                          className={`py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-400'
                              : 'bg-o1-crimson hover:bg-o1-crimson-hover text-o1-text shadow-xs'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>{isPublished ? 'Published to Reels' : 'Publish to Reels'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewItem(null)}
                          className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-o1-text text-[11px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 6. Integrated Coach Reel Studio Modal */}
      <CoachReelUploadModal
        isOpen={isReelUploadOpen}
        onClose={() => setIsReelUploadOpen(false)}
        onReelPublished={handleReelPublished}
      />
    </div>
  );
};

export interface CoachVaultModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CoachVaultModal: React.FC<CoachVaultModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-o1-canvas text-o1-text overflow-y-auto animate-in fade-in duration-150">
      {/* Top Mobile Bar with Back to Coach Navigation */}
      <div className="sticky top-0 z-20 bg-o1-surface/90 backdrop-blur-md border-b border-white/[0.07] px-4 py-2 flex items-center justify-between min-h-[44px]">
        <span className="text-xs font-bold tracking-wider text-o1-text">
          Vault
        </span>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (onClose) onClose();
          }}
          className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
          aria-label="Close vault"
        >
          <X size={15} />
        </button>
      </div>

      <div className="w-full max-w-xl mx-auto p-3 flex-1 pb-16">
        <CoachVaultView embedded />
      </div>
    </div>
  );
};

export default CoachVaultModal;
