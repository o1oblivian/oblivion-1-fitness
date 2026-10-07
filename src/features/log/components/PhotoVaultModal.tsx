import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Lock,
  Trash2,
  Calendar,
  Sparkles,
  Eye,
  Radio,
  Check,
  Film,
  UserCheck,
  Play,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useUserStore } from '../../../stores/useUserStore';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { compressPhoto, compressVideo } from '../../../utils/mediaCompressor';

export interface PhotoVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: () => void;
  initialUploadType?: 'photo' | 'video';
}

export interface AthletePhysiquePhoto {
  id: string;
  type?: 'photo' | 'video';
  timestamp: number;
  dateStr: string;
  dataUrl: string;
  thumbnailUrl?: string;
  durationSecs?: number;
  weightKg?: number;
  note?: string;
  fileSize?: string;
}

const STORAGE_KEY = 'o1_athlete_physique_vault_v1';

export const PhotoVaultModal: React.FC<PhotoVaultModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  initialUploadType,
}) => {
  const currentWeightKg = useUserStore((s) => s.weightKg);
  const user = useUserStore();
  const buddy = useBuddyProfileStore();
  const addCoachReel = useReelsStore((s) => s.addCoachReel);
  const [photos, setPhotos] = useState<AthletePhysiquePhoto[]>([]);
  const [activePhoto, setActivePhoto] = useState<AthletePhysiquePhoto | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'reels'>('all');
  const [publishedReelIds, setPublishedReelIds] = useState<string[]>([]);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [lastCompression, setLastCompression] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Load photos from persistent storage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPhotos(JSON.parse(stored));
      } else {
        setPhotos([]);
      }
    } catch (e) {
      console.error('Failed to parse photo vault:', e);
      setPhotos([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialUploadType === 'video') {
      videoInputRef.current?.click();
    } else if (initialUploadType === 'photo') {
      fileInputRef.current?.click();
    }
  }, [initialUploadType]);

  // Save photos
  const savePhotos = (updated: AthletePhysiquePhoto[]) => {
    setPhotos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage full or error saving media:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, forceType?: 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    tactileEngine.triggerSelectionBuzz();
    setIsUploading(true);

    const isVideo = forceType === 'video' || file.type.startsWith('video/');

    try {
      if (isVideo) {
        const compressed = await compressVideo(file);
        setLastCompression(`Reel compressed ${compressed.formattedOriginal} → ${compressed.formattedCompressed} (-${compressed.savingsPercent}%)`);

        const newMedia: AthletePhysiquePhoto = {
          id: `media-reel-${Date.now()}`,
          type: 'video',
          timestamp: Date.now(),
          dateStr: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          dataUrl: compressed.url,
          thumbnailUrl: compressed.thumbnailUrl || compressed.url,
          durationSecs: compressed.durationSecs,
          fileSize: compressed.formattedCompressed,
          weightKg: currentWeightKg > 0 ? currentWeightKg : undefined,
          note: noteInput.trim() || 'Training Reel Check-in',
        };

        const next = [newMedia, ...photos];
        savePhotos(next);
        setNoteInput('');
        onCapture?.();
      } else {
        const compressed = await compressPhoto(file, { maxDimension: 1280, quality: 0.82 });
        setLastCompression(`Photo compressed ${compressed.formattedOriginal} → ${compressed.formattedCompressed} (-${compressed.savingsPercent}%)`);

        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          if (result) {
            const newPhoto: AthletePhysiquePhoto = {
              id: `physique-${Date.now()}`,
              type: 'photo',
              timestamp: Date.now(),
              dateStr: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              dataUrl: result,
              fileSize: compressed.formattedCompressed,
              weightKg: currentWeightKg > 0 ? currentWeightKg : undefined,
              note: noteInput.trim() || 'Physique Check-in',
            };

            const next = [newPhoto, ...photos];
            savePhotos(next);
            setNoteInput('');
            onCapture?.();
          }
        };
        reader.readAsDataURL(compressed.file);
      }
    } catch (err) {
      console.warn('[PhotoVaultModal] Compression fallback:', err);
      const isVid = file.type.startsWith('video');
      const fallbackUrl = URL.createObjectURL(file);
      const newMedia: AthletePhysiquePhoto = {
        id: `media-${Date.now()}`,
        type: isVid ? 'video' : 'photo',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        dataUrl: fallbackUrl,
        thumbnailUrl: fallbackUrl,
        weightKg: currentWeightKg > 0 ? currentWeightKg : undefined,
        note: noteInput.trim() || (isVid ? 'Training Reel' : 'Physique Check-in'),
      };
      savePhotos([newMedia, ...photos]);
      setNoteInput('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const getMediaUrlForBuddy = (item: AthletePhysiquePhoto) => {
    return item.type === 'video' ? (item.thumbnailUrl || item.dataUrl) : item.dataUrl;
  };

  const handleDeletePhoto = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    const photoToDelete = photos.find((p) => p.id === id);
    if (photoToDelete) {
      const buddyUrl = getMediaUrlForBuddy(photoToDelete);
      if (buddy.isPhotoOnBuddy(buddyUrl)) {
        buddy.toggleVaultPhotoOnBuddy(buddyUrl);
      }
    }
    const next = photos.filter((p) => p.id !== id);
    savePhotos(next);
    if (activePhoto?.id === id) setActivePhoto(null);
  };

  const handleSetAsAvatar = (item: AthletePhysiquePhoto) => {
    tactileEngine.playPRCelebration();
    const avatarUrl = item.type === 'video' ? (item.thumbnailUrl || item.dataUrl) : item.dataUrl;
    useUserStore.getState().updateProfile({ avatarUrl });
    try {
      localStorage.setItem('o1_profile_avatar_url', avatarUrl);
    } catch (err) {
      console.error(err);
    }
    setAvatarSuccessMsg('Profile Avatar Updated!');
    setTimeout(() => setAvatarSuccessMsg(null), 2500);
  };

  const handlePublishToReels = (item: AthletePhysiquePhoto) => {
    tactileEngine.playPRCelebration();
    const thumb = item.thumbnailUrl || item.dataUrl;
    addCoachReel({
      id: `reel-${Date.now()}`,
      title: item.note || 'Athlete Kinetic PR',
      category: 'STRENGTH',
      filterTag: 'CHEST & TRICEPS',
      videoUrl: item.dataUrl,
      thumbnail: thumb,
      views: '1.4K',
      duration: item.durationSecs ? `${Math.round(item.durationSecs)}s` : '0:15',
      coach: {
        id: 'user_athlete',
        name: user.name || 'Jordan Vance',
        handle: user.handle || '@jordan.vance',
        avatar: user.avatarUrl || thumb,
        verified: true,
        specialtyTitle: 'Athlete • Member',
        rating: 5.0,
        reviewCount: 48,
        certificationPill: 'ATHLETE PR',
        rate: '$0',
        slotsRemaining: 1,
        bio: 'Kinetic PR uploaded from Athlete Vault',
        disciplines: ['Hypertrophy', 'Strength'],
      },
      cues: item.note || 'High-effort kinetic checkpoint from Athlete Vault.',
      filmstripClips: [
        {
          id: `clip-${Date.now()}`,
          title: 'Prime Movement Path',
          duration: '0:15',
          thumbnail: thumb,
          videoUrl: item.dataUrl,
          tag: 'STRENGTH',
          badge: 'KEY CUE',
        },
      ],
    });
    setPublishedReelIds((prev) => [...prev, item.id]);
    setAvatarSuccessMsg('⚡ Reel published to Train Ring!');
    setTimeout(() => setAvatarSuccessMsg(null), 2500);
  };

  if (!isOpen) return null;

  const photoCount = photos.filter((p) => p.type !== 'video').length;
  const reelsCount = photos.filter((p) => p.type === 'video').length;

  const filteredItems = photos.filter((item) => {
    const isVid = item.type === 'video';
    if (activeTab === 'photos') return !isVid;
    if (activeTab === 'reels') return isVid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-neutral-100 overflow-y-auto animate-in fade-in duration-150 select-none">
      {/* 1. TOP STICKY APP BAR (Matches Coach Page Vault Navigation) */}
      <div className="sticky top-0 z-20 bg-o1-card/90 backdrop-blur-md border-b border-white/[0.05] px-3.5 sm:px-5 py-2 flex items-center justify-between min-h-[44px]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Athlete Vault
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-mono font-bold text-neutral-300 border border-white/[0.07]">
            {photos.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer transition-colors"
          aria-label="Close vault"
        >
          <X size={15} />
        </button>
      </div>

      {/* Hidden File Pickers */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, 'photo')}
        className="hidden"
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        onChange={(e) => handleFileUpload(e, 'video')}
        className="hidden"
      />

      {/* 2. MAIN ATHLETE VAULT FEED (Full-width expansive view) */}
      <div className="w-full max-w-md mx-auto p-3 space-y-2.5 flex-1 pb-24">
        {/* Main Card Container */}
        <div className="bg-o1-card border border-white/[0.07] rounded-2xl p-3.5 shadow-xs space-y-3">
          {/* Top Status Strip: Buddy Profile Broadcast (Matching Screenshot 1) */}
          <div className="flex items-center justify-between px-1 py-0.5">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <Radio className="w-3.5 h-3.5 text-o1-crimson animate-pulse" />
              <span>
                Buddy Profile Broadcast: <strong className="text-white">{buddy.buddyPhotos.length}/6</strong> active
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-o1-crimson/10 border border-o1-crimson/30 text-o1-crimson text-[9px] font-mono font-bold">
              {buddy.buddyPhotos.length > 0 ? `${buddy.buddyPhotos.length} ON RADAR` : '4 ON RADAR'}
            </span>
          </div>

          {/* Success Banner */}
          {avatarSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0" />
              <span>{avatarSuccessMsg}</span>
            </div>
          )}

          {/* Control Row: Filter Tabs + ADD Button on Right (Matching Screenshot 1) */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center bg-o1-well border border-white/[0.07] p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveTab('all');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-o1-card text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ALL ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveTab('photos');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-o1-card text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
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
                    ? 'bg-o1-card text-o1-crimson shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film size={13} />
                <span>REELS ({reelsCount})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-bold font-mono tracking-wider uppercase cursor-pointer shadow-xs"
            >
              <Camera size={14} />
              <span>ADD</span>
            </button>
          </div>

          {/* Media Body: Empty State vs Grid */}
          {filteredItems.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="py-24 px-4 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-500">
                <Camera size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  No media in this category.
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs font-mono">
                  Tap Add to import athlete transformation photos or kinetic reels.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const buddyUrl = getMediaUrlForBuddy(item);
                const onBuddy = buddy.isPhotoOnBuddy(buddyUrl);
                const isVid = item.type === 'video';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setActivePhoto(item);
                    }}
                    className={`aspect-[3/4] rounded-2xl bg-o1-well border overflow-hidden relative group cursor-pointer transition-all hover:shadow-md ${
                      onBuddy
                        ? 'border-o1-crimson ring-1 ring-o1-crimson'
                        : 'border-white/[0.07]'
                    }`}
                  >
                    {isVid ? (
                      <div className="w-full h-full relative bg-o1-well">
                        <img
                          src={item.thumbnailUrl || item.dataUrl}
                          alt={item.note || 'Video Reel'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 text-o1-crimson flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play size={18} fill="#C4121A" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.dataUrl}
                        alt={item.note || 'Check-in'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Top Badges & Status Strip */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                      <div className="flex items-center gap-1">
                        {isVid && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-o1-crimson text-white shadow-xs flex items-center gap-1">
                            <Film size={10} />
                            REEL
                          </span>
                        )}
                        {item.weightKg && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-black/60 text-white backdrop-blur-xs">
                            {item.weightKg}kg
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tactileEngine.triggerSelectionBuzz();
                          buddy.toggleVaultPhotoOnBuddy(buddyUrl);
                        }}
                        className={`pointer-events-auto px-2 py-0.5 rounded-full flex items-center gap-1 font-mono text-[9px] font-bold shadow-md cursor-pointer transition-all ${
                          onBuddy
                            ? 'bg-o1-crimson text-white hover:bg-o1-crimson-hover'
                            : 'bg-black/60 hover:bg-black/85 text-neutral-300 backdrop-blur-xs'
                        }`}
                      >
                        {onBuddy ? (
                          <>
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            <span>ON RADAR</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5 text-neutral-400" />
                            <span>PRIVATE</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bottom Metadata Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-end justify-between">
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                          {item.note || item.dateStr}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-300">
                          {item.dateStr} {item.fileSize ? `• ${item.fileSize}` : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeletePhoto(item.id, e)}
                        className="p-1 rounded-lg bg-black/50 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                        title="Delete media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. FULL-SCREEN MEDIA LIGHTBOX VIEWER */}
      {activePhoto && (() => {
        const buddyUrl = getMediaUrlForBuddy(activePhoto);
        const onBuddy = buddy.isPhotoOnBuddy(buddyUrl);
        const isVid = activePhoto.type === 'video';
        const isPublishedReel = publishedReelIds.includes(activePhoto.id);

        return (
          <div
            className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative max-w-xl w-full bg-black border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar */}
              <div className="p-3.5 border-b border-white/[0.05] flex justify-between items-center bg-black/50">
                <div>
                  <span className="font-mono text-xs font-bold block">{activePhoto.dateStr}</span>
                  <span className="text-[11px] text-neutral-400 truncate max-w-xs block">
                    {activePhoto.note || 'Check-in'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(activePhoto.id)}
                    className="p-1.5 rounded-full bg-red-600/30 text-red-400 hover:bg-red-600/50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1.5 rounded-full bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Media Content */}
              <div className="relative bg-black flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                {isVid ? (
                  <video
                    src={activePhoto.dataUrl}
                    poster={activePhoto.thumbnailUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[60vh] w-auto max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={activePhoto.dataUrl}
                    alt={activePhoto.note || 'Enlarged photo'}
                    className="max-h-[60vh] w-auto max-w-full object-contain"
                  />
                )}
              </div>

              {/* Action Controls Strip */}
              <div className="p-4 bg-o1-well border-t border-white/[0.05] space-y-2.5">
                {/* Buddy Profile Broadcast Toggle */}
                <div className="p-2.5 rounded-2xl bg-black border border-white/[0.07] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        onBuddy ? 'bg-o1-crimson/20 text-o1-crimson' : 'bg-white/[0.08] text-neutral-400'
                      }`}
                    >
                      <Radio className={`w-4 h-4 ${onBuddy ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Show on Buddy Profile
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {onBuddy
                          ? `Broadcasting on Radar (${buddy.buddyPhotos.length}/6)`
                          : 'Private to Vault only'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      buddy.toggleVaultPhotoOnBuddy(buddyUrl);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      onBuddy
                        ? 'bg-o1-crimson text-white shadow-xs'
                        : 'bg-white/[0.08] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {onBuddy ? 'ON RADAR' : 'SET ON'}
                  </button>
                </div>

                {/* Quick Actions Strip */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAsAvatar(activePhoto)}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Set as Avatar</span>
                  </button>

                  {isVid ? (
                    <button
                      type="button"
                      disabled={isPublishedReel}
                      onClick={() => handlePublishToReels(activePhoto)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isPublishedReel
                          ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-400'
                          : 'bg-o1-crimson hover:bg-o1-crimson-hover text-white shadow-xs'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>{isPublishedReel ? 'Published to Reels' : 'Publish to Reels'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActivePhoto(null)}
                      className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-300 text-xs font-bold flex items-center justify-center cursor-pointer"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PhotoVaultModal;
