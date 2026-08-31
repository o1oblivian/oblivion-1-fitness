import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Plus, Camera, Video,
  Trash2, Share2, Flame, MapPin, Dumbbell, Heart,
  Send, UserPlus, Play, Pause, Volume2, VolumeX,
  Edit3, Check, Image as ImageIcon,
} from 'lucide-react';
import {
  VaultPhoto,
  fetchVaultPhotos,
  uploadVaultPhoto,
  deleteVaultPhoto,
  updateProfileBio,
  updateTrainingTags,
} from '@/utils/profileMediaStore';

interface AthleteProfileCardProps {
  userId: string;
  userName: string;
  userAvatar: string;
  handle?: string;
  bio?: string;
  trainingTags?: string[];
  streakDays?: number;
  totalSessions?: number;
  city?: string;
  matchPercentage?: number;
  partnerStatus?: string;
  isOwnProfile?: boolean;
  onClose: () => void;
  onInviteTandem?: () => void;
  onSendWorkout?: () => void;
  onMessage?: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const TRAINING_TAG_OPTIONS = [
  'Hypertrophy', 'Powerlifting', 'CrossFit', 'Calisthenics',
  'Cardio', 'HIIT', 'Yoga', 'Recovery', 'Running', 'Swimming',
  'Boxing', 'Climbing', 'Cycling', 'Pilates',
];

export const AthleteProfileCard: React.FC<AthleteProfileCardProps> = ({
  userId,
  userName,
  userAvatar,
  handle,
  bio: initialBio,
  trainingTags: initialTags,
  streakDays = 0,
  totalSessions = 0,
  city,
  matchPercentage,
  partnerStatus,
  isOwnProfile = false,
  onClose,
  onInviteTandem,
  onSendWorkout,
  onMessage,
  showToast,
}) => {
  const [media, setMedia] = useState<VaultPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || '');
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, [userId]);

  const loadMedia = async () => {
    setLoading(false);
    const items = await fetchVaultPhotos(userId);
    setMedia(items);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (media.length >= 6) {
      showToast('Maximum 6 media items allowed', 'error');
      return;
    }

    showToast('Uploading...');
    const result = await uploadVaultPhoto(file);
    if (result) {
      setMedia((prev) => [...prev, result]);
      setActiveIndex(media.length);
      showToast('Uploaded!', 'success');
    } else {
      showToast('Upload failed', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (item: VaultPhoto) => {
    const ok = await deleteVaultPhoto(item.id, item.media_url);
    if (ok) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      setActiveIndex(Math.max(0, activeIndex - 1));
      showToast('Removed', 'success');
    }
  };

  const handleSaveBio = async () => {
    await updateProfileBio(bio);
    setIsEditing(false);
    showToast('Bio updated', 'success');
  };

  const handleToggleTag = async (tag: string) => {
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag].slice(0, 4);
    setTags(newTags);
    await updateTrainingTags(newTags);
  };

  const goNext = () => setActiveIndex((i) => Math.min(i + 1, media.length - 1));
  const goPrev = () => setActiveIndex((i) => Math.max(i - 1, 0));

  const currentMedia = media[activeIndex];
  const initials = userName ? userName.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-full max-w-md max-h-[90vh] bg-[#0A0C10] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Gallery Hero */}
        <div className="relative aspect-[3/4] max-h-[55vh] bg-neutral-900 flex-shrink-0">
          {media.length > 0 && currentMedia ? (
            <>
              {currentMedia.media_type === 'video' ? (
                <video
                  ref={videoRef}
                  src={currentMedia.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={videoMuted}
                  playsInline
                />
              ) : (
                <img
                  src={currentMedia.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}

              {/* Video controls */}
              {currentMedia.media_type === 'video' && (
                <button
                  onClick={() => setVideoMuted(!videoMuted)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 cursor-pointer z-10"
                >
                  {videoMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              )}

              {/* Navigation arrows */}
              {activeIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 cursor-pointer z-10"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
              )}
              {activeIndex < media.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 cursor-pointer z-10"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Dot indicators */}
              {media.length > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {media.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`h-1 rounded-full transition-all cursor-pointer ${
                        i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Delete button for own profile */}
              {isOwnProfile && (
                <button
                  onClick={() => handleDelete(currentMedia)}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-red-500/30 backdrop-blur-sm flex items-center justify-center border border-red-500/40 cursor-pointer z-10 hover:bg-red-500/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-white/10" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/10">
                  <span className="text-3xl font-black text-white/60">{initials}</span>
                </div>
              )}
              {isOwnProfile && (
                <p className="text-xs text-white/40">Add photos and videos to your profile</p>
              )}
            </div>
          )}

          {/* Upload button for own profile */}
          {isOwnProfile && media.length < 6 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold cursor-pointer hover:bg-white/20 transition-colors z-10"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0C10] to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 cursor-pointer z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Match percentage badge */}
          {matchPercentage != null && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 z-10">
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-black text-red-400">{matchPercentage}%</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name & Handle */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{userName}</h2>
              {handle && <p className="text-xs text-white/40 font-mono">{handle}</p>}
              {city && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span className="text-[11px] text-white/50">{city}</span>
                </div>
              )}
            </div>
            {partnerStatus && (
              <span className="text-[9px] font-mono font-bold text-red-300 bg-red-500/15 border border-red-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                {partnerStatus}
              </span>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1">
            {isOwnProfile && isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={80}
                  placeholder="Add a short bio..."
                  className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 outline-none focus:border-red-500/50"
                />
                <button onClick={handleSaveBio} className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center cursor-pointer">
                  <Check className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-white/70">{bio || (isOwnProfile ? 'Tap to add bio...' : '')}</p>
                {isOwnProfile && (
                  <button onClick={() => setIsEditing(true)} className="cursor-pointer">
                    <Edit3 className="w-3 h-3 text-white/30 hover:text-white/60 transition-colors" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Training Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono font-bold text-white/80 bg-white/10 border border-white/15 px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
            {isOwnProfile && (
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md cursor-pointer hover:bg-red-500/20 transition-colors"
              >
                + Tag
              </button>
            )}
          </div>

          {/* Tag picker */}
          {showTagPicker && isOwnProfile && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-white/5 border border-white/10 rounded-xl">
              {TRAINING_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                    tags.includes(tag)
                      ? 'text-red-300 bg-red-500/20 border-red-500/40'
                      : 'text-white/50 bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
              <Flame className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-lg font-black text-white">{streakDays}</span>
              <span className="text-[9px] font-mono text-white/40 uppercase">Streak</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
              <Dumbbell className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-lg font-black text-white">{totalSessions}</span>
              <span className="text-[9px] font-mono text-white/40 uppercase">Sessions</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
              <ImageIcon className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-lg font-black text-white">{media.length}</span>
              <span className="text-[9px] font-mono text-white/40 uppercase">Media</span>
            </div>
          </div>

          {/* Thumbnail strip */}
          {media.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {media.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(i)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all ${
                    i === activeIndex ? 'border-red-400 scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  {item.media_type === 'video' ? (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white/60" />
                    </div>
                  ) : (
                    <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
              {isOwnProfile && media.length < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-white/40 transition-colors"
                >
                  <Plus className="w-5 h-5 text-white/30" />
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2 pt-2">
              {onInviteTandem && (
                <button
                  onClick={onInviteTandem}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm cursor-pointer transition-colors shadow-xs active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </button>
              )}
              {onSendWorkout && (
                <button
                  onClick={onSendWorkout}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-sm cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Workout
                </button>
              )}
              {onMessage && (
                <button
                  onClick={onMessage}
                  className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}

          {/* Own profile: share button */}
          {isOwnProfile && (
            <button
              onClick={() => {
                const text = `Check out my profile on O1FC! ${handle || ''}\n${window.location.origin}`;
                if (navigator.share) {
                  navigator.share({ title: 'My O1FC Profile', text });
                } else {
                  navigator.clipboard.writeText(text);
                  showToast('Profile link copied!', 'success');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-sm cursor-pointer hover:bg-white/15 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
