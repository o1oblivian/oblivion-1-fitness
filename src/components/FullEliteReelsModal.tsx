import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Heart,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  MessageCircle,
  Play,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Star,
  Users,
  ChevronRight,
  ExternalLink,
  Search,
  LayoutGrid,
  Film,
} from 'lucide-react';
import { CoachProfileSheet } from '@/components/CoachProfileSheet';
import { ConsultationRequestModal } from '@/components/ConsultationRequestModal';
import { CoachShowcaseSlotModal } from '@/components/CoachShowcaseSlotModal';
import { getCoachShowcase } from '@/utils/coachShowcaseStore';
import { Sliders } from 'lucide-react';
import { useModalBackHandler } from '@/utils/modalHistory';
import { ReelsExploreGrid } from '@/components/ReelsExploreGrid';

export interface MiniMediaWindow {
  type: 'video' | 'photo';
  title: string;
  badge: string;
  url: string;
  poster: string;
}

export interface CoachProgramItem {
  id: string;
  title: string;
  duration: string;
  level: string;
  price: string;
  tag: string;
  tagColor: string;
  description: string;
}

export interface EliteReelData {
  id: string;
  coachName: string;
  displayName?: string;
  credential: string;
  avatar: string;
  thumbnail: string;
  title: string;
  category: string;
  tier: 'world' | 'proven' | 'rising';
  athletes?: string;
  price?: string;
  handle?: string;
  description?: string;
  rating?: string;
  reviewsCount?: number;
  consultPrice?: string;
  specialtyPills?: string[];
  
  // High-def background reel
  videoUrl?: string;
  
  // The 4 Mini Windows
  window1?: MiniMediaWindow; // Workout Reel (auto-playing)
  window2?: MiniMediaWindow; // Form Cue / Pitch Reel (auto-playing)
  window3?: MiniMediaWindow; // Coach Photo / Transformation
  programs?: CoachProgramItem[];
}

export const DEFAULT_ELITE_REELS: EliteReelData[] = [
  {
    id: 'coach-elena-mobility',
    coachName: 'Mobility Coach Elena Vasquez',
    displayName: 'Elena Vasquez, DPT',
    credential: 'DOCTOR OF PHYSICAL THERAPY • FRCMS LEVEL 3',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-her-body-on-a-mat-41483-large.mp4',
    title: 'Deep Hip 90/90 Kinetic Rotation & Thoracic Decompression',
    category: 'Mobility',
    tier: 'world',
    athletes: '68 Active Athletes',
    price: '$79/mo',
    consultPrice: '$120 / 45m Consult',
    rating: '4.99',
    reviewsCount: 148,
    handle: '@elena.mobility',
    description: 'Specialized clinical mobility protocols designed to unlock tight hip capsules, optimize ankle dorsiflexion, and bulletproof your spine under heavy loads.',
    specialtyPills: ['HIP CAPSULE', 'THORACIC FLOW', 'INJURY REHAB'],
    window1: {
      type: 'video',
      title: 'Hip 90/90 Flow',
      badge: 'DRILL',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-fitness-exercise-with-dumbbells-41485-large.mp4',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
    },
    window2: {
      type: 'video',
      title: 'Scapular Pitch',
      badge: 'CUE',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-elastic-resistance-bands-41484-large.mp4',
      poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
    },
    window3: {
      type: 'photo',
      title: 'Clinical Lab',
      badge: 'PHOTO',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    },
    programs: [
      {
        id: 'prog-elena-spine',
        title: '30-Day Bulletproof Spine & Hips',
        duration: '4 Weeks',
        level: 'All Levels',
        price: '$69',
        tag: 'BESTSELLER',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        description: 'Comprehensive daily mobility flows to eliminate lower-back stiffness and maximize squat depth.',
      },
      {
        id: 'prog-elena-oly',
        title: 'Olympic Squat Mobility Blueprint',
        duration: '6 Weeks',
        level: 'Advanced',
        price: '$89',
        tag: 'PRO TIER',
        tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        description: 'Targeted ankle dorsiflexion and thoracic extension protocols for deep, upright snatch and clean catches.',
      },
    ],
  },
  {
    id: 'coach-marcus-biomechanics',
    coachName: 'Biomechanics Coach Marcus Vance',
    displayName: 'Marcus Vance, CSCS',
    credential: 'OLYMPIC S&C COACH • EXOS LEVEL 3 • USAW',
    avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=240&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-man-lifting-a-barbell-in-the-gym-41487-large.mp4',
    title: 'Kinetic Chain Deadlift Floor Break & 360 Intra-Abdominal Bracing',
    category: 'Biomechanics',
    tier: 'world',
    athletes: '54 Active Athletes',
    price: '$89/mo',
    consultPrice: '$145 / 45m Consult',
    rating: '4.98',
    reviewsCount: 212,
    handle: '@marcus.strength',
    description: 'Precision bar-path telemetry, force-coupling analysis, and neuromuscular rate of force development for elite lifters.',
    specialtyPills: ['KINETIC CHAIN', 'BAR PATH', 'CNS PEAKING'],
    window1: {
      type: 'video',
      title: 'Power Floor Break',
      badge: 'DRILL',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-with-battle-ropes-at-the-gym-41489-large.mp4',
      poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    },
    window2: {
      type: 'video',
      title: 'Lat Tension Pitch',
      badge: 'CUE',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-man-lifting-a-barbell-in-the-gym-41487-large.mp4',
      poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    },
    window3: {
      type: 'photo',
      title: 'Platform Lab',
      badge: 'PHOTO',
      url: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&w=600&q=80',
      poster: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&w=600&q=80',
    },
    programs: [
      {
        id: 'prog-marcus-strength',
        title: '12-Week Kinetic Strength Engine',
        duration: '12 Weeks',
        level: 'Intermediate/Pro',
        price: '$99',
        tag: 'FLAGSHIP',
        tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Autoregulated RPE power cycle with live bar-path cues to add 20-40kg to your total safely.',
      },
      {
        id: 'prog-marcus-peak',
        title: 'Competition Peaking & Deload Protocol',
        duration: '4 Weeks',
        level: 'Advanced',
        price: '$79',
        tag: 'SPECIALIZED',
        tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        description: 'Exact central nervous system taper equations and taper timing for meet-day execution.',
      },
    ],
  },
  {
    id: 'coach-maya-hypertrophy',
    coachName: 'Hypertrophy Coach Maya Lin',
    displayName: 'Maya Lin, MSc',
    credential: 'MSc EXERCISE PHYSIOLOGY • IFBB PRO COACH',
    avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=240&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-elastic-resistance-bands-41484-large.mp4',
    title: 'Lengthened-Position Muscle Overload & Metabolic Rate Optimization',
    category: 'Hypertrophy',
    tier: 'world',
    athletes: '82 Active Athletes',
    price: '$85/mo',
    consultPrice: '$130 / 45m Consult',
    rating: '5.0',
    reviewsCount: 189,
    handle: '@maya.hypertrophy',
    description: 'Evidence-based physique engineering, high mechanical tension at long muscle lengths, and tailored metabolic nutrient timing.',
    specialtyPills: ['LENGTHENED ROM', 'METABOLIC FLOW', 'PHYSIQUE PRO'],
    window1: {
      type: 'video',
      title: 'Lat Overload Flow',
      badge: 'DRILL',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-fitness-exercise-with-dumbbells-41485-large.mp4',
      poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
    },
    window2: {
      type: 'video',
      title: 'Eccentric Pitch',
      badge: 'CUE',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-her-body-on-a-mat-41483-large.mp4',
      poster: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80',
    },
    window3: {
      type: 'photo',
      title: 'Physique Proof',
      badge: 'PHOTO',
      url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
      poster: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    },
    programs: [
      {
        id: 'prog-maya-physique',
        title: '16-Week Pro Hypertrophy Blueprint',
        duration: '16 Weeks',
        level: 'All Levels',
        price: '$89',
        tag: 'FLAGSHIP',
        tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        description: 'Scientific upper/lower split maximizing stimulus-to-fatigue ratio and lengthened muscle tension.',
      },
      {
        id: 'prog-maya-recomp',
        title: 'Metabolic Partitioning & Recomp',
        duration: '8 Weeks',
        level: 'Intermediate',
        price: '$99',
        tag: 'POPULAR',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        description: 'Metabolic cycling protocol to drop body fat while maintaining full contractile glycogen volume.',
      },
    ],
  },
];

interface FullEliteReelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reels?: EliteReelData[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onViewProfile?: (reel: EliteReelData) => void;
}

const CATEGORIES = [
  'All',
  'Mobility',
  'Biomechanics',
  'Hypertrophy',
  'Strength',
  'Rehab',
  'Cardio & HIIT',
];

export const FullEliteReelsModal: React.FC<FullEliteReelsModalProps> = ({
  isOpen,
  onClose,
  reels = [],
  showToast,
}) => {
  useModalBackHandler(isOpen, onClose, 'full_elite_reels_modal');
  const activeReels = reels && reels.length > 0 ? reels : DEFAULT_ELITE_REELS;

  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'stream' | 'explore'>('explore');
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeMediaOverride, setActiveMediaOverride] = useState<Record<string, { type: 'video' | 'photo'; url: string; poster?: string }>>({});
  const [selectedProgramsModalCoach, setSelectedProgramsModalCoach] = useState<EliteReelData | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const touchStartY = useRef(0);

  const [profileCoach, setProfileCoach] = useState<EliteReelData | null>(null);
  const [consultCoach, setConsultCoach] = useState<EliteReelData | null>(null);
  const clientEmail = typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') || 'athlete@o1fc.app' : 'athlete@o1fc.app';

  const handleSelectFromExplore = (reelId: string, mediaWindow?: MiniMediaWindow) => {
    setViewMode('stream');
    const targetIdx = activeReels.findIndex((r) => r.id === reelId);
    if (targetIdx !== -1) {
      setActiveIdx(targetIdx);
      if (mediaWindow) {
        setActiveMediaOverride((prev) => ({
          ...prev,
          [reelId]: { type: mediaWindow.type, url: mediaWindow.url, poster: mediaWindow.poster },
        }));
      }
      setTimeout(() => {
        const targetEl = scrollRef.current?.querySelector(`[data-idx="${targetIdx}"]`);
        targetEl?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    setLikeCounts(prev => {
      const counts: Record<string, number> = { ...prev };
      activeReels.forEach((r) => {
        if (!(r.id in counts)) {
          counts[r.id] = (r.reviewsCount ? r.reviewsCount * 4 : 500) + 120;
        }
      });
      return counts;
    });
  }, [activeReels]);

  const filteredReels = activeFilter === 'All'
    ? activeReels
    : activeReels.filter((r) => r.category.toLowerCase().includes(activeFilter.toLowerCase()));

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIdx(0);
      setActiveFilter('All');
      setActiveMediaOverride({});
      setViewMode('explore');
    }
  }, [isOpen]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isOpen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-idx') || '0');
            setActiveIdx(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    container.querySelectorAll('[data-idx]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isOpen, filteredReels.length]);

  const handleLike = (id: string) => {
    setLiked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setLikeCounts((c) => ({
        ...c,
        [id]: next[id] ? (c[id] || 0) + 1 : Math.max(0, (c[id] || 0) - 1),
      }));
      return next;
    });
  };

  const handleSave = (id: string) => {
    setSaved((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      showToast?.(next[id] ? 'Coach saved to Vault' : 'Removed from Vault', 'success');
      return next;
    });
  };

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 120) handleClose();
  };

  const handleShare = async (reel: EliteReelData) => {
    const shareUrl = `${window.location.origin}/reels/${reel.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: reel.coachName, url: shareUrl }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast?.('Coach link copied', 'success');
      } catch {
        showToast?.('Could not copy link', 'error');
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] bg-black transition-transform duration-300 ease-out select-none ${closing ? 'translate-y-full' : 'translate-y-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Elite Coaches Showcase"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Rail - Only shown during vertical swipe stream mode */}
      {viewMode === 'stream' && (
        <div className="absolute top-0 left-0 right-0 z-40 pt-[max(env(safe-area-inset-top),8px)] px-3 pointer-events-none">
          <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-lg mx-auto pointer-events-auto">
            {/* Close Button - Frameless Pure Vector Glyph */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="p-2 flex items-center justify-center text-white active:scale-90 hover:text-white/80 transition-transform cursor-pointer shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            >
              <X className="w-6 h-6 stroke-[2]" />
            </button>

            {/* Central Categories Rail in Stream Mode */}
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center justify-center gap-3 sm:gap-5 min-w-max px-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`text-[11px] uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer active:scale-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
                        isActive
                          ? 'text-white font-black underline underline-offset-4 decoration-2 decoration-white'
                          : 'text-white/70 hover:text-white font-bold'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setViewMode('explore')}
                aria-label="Explore Exercises Grid"
                className="p-2 flex items-center justify-center text-white active:scale-90 hover:text-white/80 transition-transform cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                title="Search & Explore Grid"
              >
                <LayoutGrid className="w-5 h-5 stroke-[2]" />
              </button>

              <button
                onClick={() => setMuted(!muted)}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="p-2 flex items-center justify-center text-white active:scale-90 hover:text-white/80 transition-transform cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              >
                {muted ? <VolumeX className="w-6 h-6 stroke-[2]" /> : <Volume2 className="w-6 h-6 stroke-[2]" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area: Explore Grid vs Vertical Snap Reel Feed */}
      {viewMode === 'explore' ? (
        <div className="h-full w-full">
          <ReelsExploreGrid
            reels={activeReels}
            onSelectReel={(id, window) => handleSelectFromExplore(id, window)}
            onOpenCoachProfile={(coachId) => {
              const coach = activeReels.find((r) => r.id === coachId);
              if (coach) setProfileCoach(coach);
            }}
            onClose={handleClose}
            onSwitchToStream={() => setViewMode('stream')}
          />
        </div>
      ) : (
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {filteredReels.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/40 font-mono text-sm uppercase tracking-widest">No verified coaches in this category</p>
          </div>
        )}

        {filteredReels.map((reel, idx) => {
          const currentOverride = activeMediaOverride[reel.id];
          const activeVideo = currentOverride?.type === 'video' ? currentOverride.url : (reel.videoUrl || '');
          const isPhotoOverride = currentOverride?.type === 'photo';

          return (
            <div
              key={reel.id}
              data-idx={idx}
              className="relative h-full w-full snap-start snap-always shrink-0 bg-black overflow-hidden flex flex-col justify-between"
            >
              {/* Main Full-Bleed Media Canvas */}
              <div className="absolute inset-0 z-0 bg-black">
                {isPhotoOverride ? (
                  <img
                    src={currentOverride.url}
                    alt={reel.coachName}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                ) : (
                  <>
                    <video
                      key={activeVideo}
                      src={activeVideo}
                      poster={reel.thumbnail}
                      autoPlay
                      loop
                      muted={muted}
                      playsInline
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback gracefully to poster image if video network is restricted
                        (e.currentTarget as HTMLVideoElement).style.display = 'none';
                      }}
                    />
                    {/* Fallback image behind video */}
                    <img
                      src={reel.thumbnail}
                      alt={reel.coachName}
                      className="w-full h-full object-cover absolute inset-0 -z-10"
                    />
                  </>
                )}

                {/* Subtle Cinematic Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none opacity-95" />
              </div>

              {/* Right Interactive Action Rail - 50% Glassmorphic Translucent Glyphs, Compact Size, Pushed to Right Edge */}
              <div className="absolute right-1.5 bottom-32 z-30 flex flex-col items-center gap-5 pointer-events-auto">
                {/* Like Button */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => handleLike(reel.id)}
                    className="p-1 text-white/50 hover:text-white transition-all cursor-pointer active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    title="Like"
                  >
                    <Heart className={`w-5 h-5 transition-all stroke-[1.75] ${liked[reel.id] ? 'text-red-500 fill-red-500 stroke-[2] opacity-100' : 'text-white/50 hover:text-white'}`} />
                  </button>
                  <span className="text-[9.5px] font-mono font-bold text-white/60 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
                    {formatCount(likeCounts[reel.id] || 0)}
                  </span>
                </div>

                {/* Direct 1-on-1 Consultation */}
                <button
                  onClick={() => setConsultCoach(reel)}
                  title="Book Consultation"
                  className="p-1 text-white/50 hover:text-amber-300 transition-all cursor-pointer active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <MessageCircle className="w-5 h-5 stroke-[1.75]" />
                </button>

                {/* Save to Vault */}
                <button
                  onClick={() => handleSave(reel.id)}
                  title="Save to Vault"
                  className="p-1 text-white/50 hover:text-amber-400 transition-all cursor-pointer active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <Bookmark className={`w-5 h-5 transition-all stroke-[1.75] ${saved[reel.id] ? 'text-amber-400 fill-amber-400 opacity-100' : 'text-white/50 hover:text-amber-400'}`} />
                </button>

                {/* Share */}
                <button
                  onClick={() => handleShare(reel)}
                  title="Share"
                  className="p-1 text-white/50 hover:text-sky-400 transition-all cursor-pointer active:scale-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                >
                  <Share2 className="w-5 h-5 stroke-[1.75]" />
                </button>
              </div>

              {/* Bottom Section: Fixed to Absolute Bottom (Zero Gaps, Square Edges, 4 Media Windows) */}
              <div className="absolute bottom-0 left-0 right-0 z-30 w-full pb-[env(safe-area-inset-bottom)] pointer-events-none">
                {/* Coach Info Badge & Hierarchy */}
                <div className="px-3 pb-2.5 max-w-[82%] pointer-events-auto space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => setProfileCoach(reel)}
                      className="text-base sm:text-lg font-bold text-white tracking-tight cursor-pointer hover:underline flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    >
                      {reel.coachName}
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 inline" />
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-amber-300 drop-shadow-md">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {reel.rating || '4.99'}
                    </span>
                  </div>

                  {reel.credential && (
                    <p className="text-[10px] font-mono text-zinc-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-1 uppercase tracking-wider">
                      {reel.credential}
                    </p>
                  )}
                </div>

              {/* 4 SEAMLESS FLUSH WINDOWS (Zero Gaps, Crisp Square Edges, Flush to screen bottom) */}
              {(() => {
                const sc = getCoachShowcase(reel.id || reel.coachName);
                const w1 = sc?.slot2 || reel.window1;
                const w2 = sc?.slot3 || reel.window2;
                const w3 = sc?.slot4 || reel.window3;
                const w4 = sc?.slot5;

                return (
                  <div className="grid grid-cols-4 w-full h-24 sm:h-28 bg-black border-t border-white/15 divide-x divide-white/15 pointer-events-auto">
                    {/* Mini Window 1 (Slot 2) */}
                    {w1 ? (
                      <button
                        onClick={() => {
                          setActiveMediaOverride((prev) => ({
                            ...prev,
                            [reel.id]: { type: w1.type === 'video' ? 'video' : 'photo', url: w1.url, poster: w1.poster },
                          }));
                          showToast?.(`${w1.badge || 'Slot 2'}: ${w1.title}`, 'success');
                        }}
                        className={`relative w-full h-full overflow-hidden bg-black cursor-pointer active:opacity-80 transition-all text-left group ${
                          currentOverride?.url === w1.url ? 'ring-2 ring-inset ring-red-500' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {w1.type === 'video' ? (
                          <video src={w1.url} poster={w1.poster} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={w1.url} alt={w1.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30 pointer-events-none" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[8px] font-mono font-bold text-zinc-200 uppercase tracking-widest border border-white/15 rounded-sm">
                          {w1.badge || 'DRILL'}
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[8.5px] font-mono font-bold text-white truncate leading-none drop-shadow-md">
                          {w1.title}
                        </span>
                      </button>
                    ) : null}

                    {/* Mini Window 2 (Slot 3) */}
                    {w2 ? (
                      <button
                        onClick={() => {
                          setActiveMediaOverride((prev) => ({
                            ...prev,
                            [reel.id]: { type: w2.type === 'video' ? 'video' : 'photo', url: w2.url, poster: w2.poster },
                          }));
                          showToast?.(`${w2.badge || 'Slot 3'}: ${w2.title}`, 'success');
                        }}
                        className={`relative w-full h-full overflow-hidden bg-black cursor-pointer active:opacity-80 transition-all text-left group ${
                          currentOverride?.url === w2.url ? 'ring-2 ring-inset ring-red-500' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {w2.type === 'video' ? (
                          <video src={w2.url} poster={w2.poster} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={w2.url} alt={w2.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30 pointer-events-none" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[8px] font-mono font-bold text-zinc-200 uppercase tracking-widest border border-white/15 rounded-sm">
                          {w2.badge || 'CUE'}
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[8.5px] font-mono font-bold text-white truncate leading-none drop-shadow-md">
                          {w2.title}
                        </span>
                      </button>
                    ) : null}

                    {/* Mini Window 3 (Slot 4) */}
                    {w3 ? (
                      <button
                        onClick={() => {
                          setActiveMediaOverride((prev) => ({
                            ...prev,
                            [reel.id]: { type: w3.type === 'video' ? 'video' : 'photo', url: w3.url, poster: w3.poster },
                          }));
                          showToast?.(`${w3.badge || 'Slot 4'}: ${w3.title}`, 'success');
                        }}
                        className={`relative w-full h-full overflow-hidden bg-black cursor-pointer active:opacity-80 transition-all text-left group ${
                          currentOverride?.url === w3.url ? 'ring-2 ring-inset ring-red-500' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <img src={w3.url || w3.poster} alt={w3.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30 pointer-events-none" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[8px] font-mono font-bold text-zinc-200 uppercase tracking-widest border border-white/15 rounded-sm">
                          {w3.badge || 'PHOTO'}
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[8.5px] font-mono font-bold text-white truncate leading-none drop-shadow-md">
                          {w3.title}
                        </span>
                      </button>
                    ) : null}

                    {/* Mini Window 4 (Slot 5): Programs & Consult */}
                    <button
                      onClick={() => setSelectedProgramsModalCoach(reel)}
                      className="relative w-full h-full overflow-hidden cursor-pointer active:opacity-80 transition-all flex items-center justify-center p-0 m-0 group"
                    >
                      <img
                        src={w4?.poster || reel.avatar || reel.thumbnail}
                        alt={reel.coachName}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors" />
                      <div className="relative z-10 flex flex-col items-center justify-center text-center px-1 pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-tight">
                          {w4?.title || 'PROGRAMS'}
                        </span>
                        <span className="text-[8px] font-mono font-medium text-zinc-200 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] leading-tight">
                          {w4?.subLabel || '& Consult'}
                        </span>
                        <span className="text-[7.5px] font-mono text-amber-300 font-bold mt-1 px-1 py-0.2 rounded bg-black/60 border border-amber-400/30 drop-shadow-md">
                          {w4?.highlightPrice || (reel.programs?.length ? `${reel.programs.length} Plans` : '2 Plans')}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })()}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Interactive Programs & Consultation Drawer Modal - Apple Light Theme */}
      {selectedProgramsModalCoach && (
        <div
          className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedProgramsModalCoach(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200/80 text-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Coach info */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200/80">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProgramsModalCoach.avatar}
                  alt={selectedProgramsModalCoach.coachName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
                <div>
                  <h3 className="text-base font-black text-zinc-900 leading-tight">
                    {selectedProgramsModalCoach.coachName}
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-500 font-semibold">
                    {selectedProgramsModalCoach.credential}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProgramsModalCoach(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct 1-on-1 Consultation Action Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 via-stone-50 to-white border border-red-200/80 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-widest text-red-600 uppercase">
                  1-on-1 Telemetry Consultation
                </span>
                <span className="text-xs font-mono font-bold text-white bg-red-600 px-2 py-0.5 rounded-full shadow-sm">
                  {selectedProgramsModalCoach.consultPrice || '$120 / Session'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Direct 45-minute live telemetry, kinetic form audit, customized periodization dispatch, and private messaging channel.
              </p>
              <button
                onClick={() => {
                  const coach = selectedProgramsModalCoach;
                  setSelectedProgramsModalCoach(null);
                  setConsultCoach(coach);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md shadow-red-600/20"
              >
                <span>Book 1-on-1 Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Curated Programs List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold tracking-wider text-zinc-500 uppercase">
                Curated Training Programs ({selectedProgramsModalCoach.programs?.length || 2})
              </h4>

              {selectedProgramsModalCoach.programs?.map((prog) => (
                <div
                  key={prog.id}
                  className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {prog.tag}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 font-semibold">
                          {prog.duration} • {prog.level}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-zinc-900 pt-1">
                        {prog.title}
                      </h5>
                    </div>
                    <span className="text-sm font-black text-zinc-900 font-mono shrink-0">
                      {prog.price}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {prog.description}
                  </p>

                  <button
                    onClick={() => {
                      showToast(`Enrolled in ${prog.title} by ${selectedProgramsModalCoach.coachName}! Added to your Training Vault.`, 'success');
                      setSelectedProgramsModalCoach(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-stone-300" />
                    <span>Instant Program Access ({prog.price})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coach Profile Sheet */}
      <CoachProfileSheet
        isOpen={!!profileCoach}
        onClose={() => setProfileCoach(null)}
        coach={profileCoach}
        allReels={activeReels}
        showToast={showToast}
        onOpenMessage={(coach) => {
          setProfileCoach(null);
          setTimeout(() => setConsultCoach(coach), 300);
        }}
        onPurchaseProgram={(prog) => showToast(`Enrolled in ${prog.title} (${prog.price})`, 'success')}
      />

      {/* Consultation Request Modal */}
      <ConsultationRequestModal
        isOpen={!!consultCoach}
        onClose={() => setConsultCoach(null)}
        coachName={consultCoach?.coachName || ''}
        coachEmail={consultCoach?.coachName?.toLowerCase().replace(/\s+/g, '.') + '@o1fc.app' || ''}
        clientEmail={clientEmail}
        showToast={showToast}
      />
    </div>,
    document.body,
  );
};
