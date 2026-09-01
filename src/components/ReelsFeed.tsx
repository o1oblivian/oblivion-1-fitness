import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Heart,
  Play,
  Pause,
  Plus,
  X,
  Dumbbell,
  Check,
  Video,
  Camera,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Clock,
  Star,
  Sparkles,
  User,
  VolumeX,
  Volume2,
  Bookmark,
  Share2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { Reel } from '@/utils/reelsTypes';
import { ReelUploadModal } from './ReelUploadModal';
import { CoachProfileSheet } from './CoachProfileSheet';
import { ConsultationRequestModal } from './ConsultationRequestModal';
import type { EliteReelData } from './FullEliteReelsModal';

interface ReelsFeedProps {
  currentUserEmail: string;
  showToast: (msg: string) => void;
}

type FilterCategory = 'All' | 'Form Cues' | 'Mobility' | 'Hypertrophy' | 'Recovery' | 'Conditioning';
type SortOption = 'trending' | 'newest' | 'popular';
type DifficultyFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

const FILTERS: FilterCategory[] = ['All', 'Form Cues', 'Mobility', 'Hypertrophy', 'Recovery', 'Conditioning'];
const SORT_OPTIONS: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: 'trending', label: 'Trending', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'newest', label: 'Newest', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'popular', label: 'Most Liked', icon: <Star className="w-3.5 h-3.5" /> },
];
const DIFFICULTIES: DifficultyFilter[] = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

const SPECIALIZATION_MAP: Record<string, string> = {
  Hypertrophy: 'Hypertrophy & Biomechanics',
  Powerlifting: 'Strength & Powerlifting',
  Conditioning: 'Conditioning & Hybrid Athlete',
  Mobility: 'Mobility & Recovery',
  Olympic: 'Olympic Lifting',
  'Form Cues': 'Form & Technique',
  Recovery: 'Recovery & Longevity',
};

const MOCK_EDUCATIONAL_REELS: Reel[] = [
  {
    id: 'edu-reel-1',
    coach_email: 'coach.marcus@o1fc.app',
    coach_name: 'Marcus Chen',
    coach_avatar: 'https://images.pexels.com/photos/36085104/pexels-photo-36085104.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
    caption: 'Tandem Radar Mode: How to spot and match with workout partners at your exact gym floor in real time. Never lift alone again.',
    media_url: 'https://videos.pexels.com/video-files/4761434/4761434-uhd_1440_2560_25fps.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    program_id: null,
    workout_type: 'Form Cues',
    tags: ['radar', 'tandem', 'training partner', 'intermediate'],
    like_count: 3840,
    view_count: 48200,
    created_at: '2026-08-28T09:00:00Z',
    program: null,
  },
  {
    id: 'edu-reel-2',
    coach_email: 'coach.elena@o1fc.app',
    coach_name: 'Elena Vasquez',
    coach_avatar: 'https://images.pexels.com/photos/7900679/pexels-photo-7900679.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
    caption: 'Rotary Dial OS: Zero-friction set and rep logging between drop sets. Dial your resistance in 2 seconds without typing.',
    media_url: 'https://videos.pexels.com/video-files/4754031/4754031-uhd_1440_2560_25fps.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    program_id: null,
    workout_type: 'Hypertrophy',
    tags: ['rotary dial', 'workout os', 'strength', 'advanced'],
    like_count: 2950,
    view_count: 36100,
    created_at: '2026-08-27T14:30:00Z',
    program: null,
  },
  {
    id: 'edu-reel-3',
    coach_email: 'coach.aiden@o1fc.app',
    coach_name: 'Aiden Park',
    coach_avatar: 'https://images.pexels.com/photos/13951271/pexels-photo-13951271.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
    caption: 'Coach Dispatch Live: 1-Click routine push directly to athlete watches and telemetry dials. Real-time form checks with video review.',
    media_url: 'https://videos.pexels.com/video-files/4753879/4753879-uhd_1440_2560_25fps.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    program_id: null,
    workout_type: 'Mobility',
    tags: ['coach hub', 'dispatch', 'telemetry', 'athlete review'],
    like_count: 4210,
    view_count: 51800,
    created_at: '2026-08-26T11:00:00Z',
    program: null,
  },
  {
    id: 'edu-reel-4',
    coach_email: 'coach.sophia@o1fc.app',
    coach_name: 'Sophia Laurent',
    coach_avatar: 'https://images.pexels.com/photos/14055666/pexels-photo-14055666.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
    caption: 'Fuel OS & Metabolic Intelligence: Live macro periodization and AI meal scanning built for elite body composition.',
    media_url: 'https://videos.pexels.com/video-files/4761449/4761449-uhd_1440_2560_25fps.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    program_id: null,
    workout_type: 'Hypertrophy',
    tags: ['fuel os', 'macros', 'nutrition', 'advanced'],
    like_count: 5180,
    view_count: 64900,
    created_at: '2026-08-25T16:45:00Z',
    program: null,
  },
  {
    id: 'edu-reel-5',
    coach_email: 'coach.derek@o1fc.app',
    coach_name: 'Derek Okafor',
    coach_avatar: 'https://images.pexels.com/photos/8612474/pexels-photo-8612474.jpeg?auto=compress&cs=tinysrgb&h=100&w=100',
    caption: 'Founder Launch Protocol: How the first 5,000 athletes unlock the Lifetime All-Access VIP Pass for only $24.',
    media_url: 'https://videos.pexels.com/video-files/4536388/4536388-uhd_1440_2560_25fps.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    program_id: null,
    workout_type: 'Recovery',
    tags: ['founder pass', 'vip', 'launch week', 'all-access'],
    like_count: 6720,
    view_count: 89300,
    created_at: '2026-08-24T08:15:00Z',
    program: null,
  },
];

const PAGE_SIZE = 20;

function engagementScore(reel: Reel): number {
  return reel.like_count * 2 + reel.view_count;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ currentUserEmail, showToast }) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [fullScreenReel, setFullScreenReel] = useState<Reel | null>(null);
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const loadReels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase || !isSupabaseConfigured()) {
        setReels(MOCK_EDUCATIONAL_REELS);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const { data, error: fetchError } = await supabase
        .from('coach_reels')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(200)
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (fetchError) throw fetchError;

      const mapped: Reel[] = (data || []).map((r: any) => ({
        id: r.id,
        coach_email: r.coach_email,
        coach_name: r.coach_name || r.coach_email?.split('@')[0] || 'User',
        coach_avatar: r.coach_avatar || '',
        caption: r.caption || '',
        media_url: r.media_url,
        media_type: r.media_type || 'image',
        thumbnail_url: r.thumbnail_url || '',
        program_id: r.program_id,
        workout_type: r.workout_type || '',
        tags: r.tags || [],
        like_count: r.like_count || 0,
        view_count: r.view_count || 0,
        created_at: r.created_at,
        program: null,
      }));

      setReels(mapped.length > 0 ? mapped : MOCK_EDUCATIONAL_REELS);
      setHasMore(mapped.length > PAGE_SIZE);
    } catch (err: any) {
      setReels(MOCK_EDUCATIONAL_REELS);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortMenuOpen]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter, difficultyFilter, sortBy, searchQuery]);

  useEffect(() => {
    const container = feedRef.current;
    if (!container) return;
    const items = container.querySelectorAll('[data-reel-id]');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const id = entry.target.getAttribute('data-reel-id');
            if (id) setActiveReelId(id);
          }
        });
      },
      { threshold: [0.6] }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reels, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, visibleCount]);

  const featuredReels = useMemo(() => {
    return [...reels]
      .sort((a, b) => engagementScore(b) - engagementScore(a))
      .slice(0, 8);
  }, [reels]);

  const filteredReels = useMemo(() => {
    let result = reels;

    if (activeFilter !== 'All') {
      result = result.filter(
        (r) =>
          r.workout_type.toLowerCase().includes(activeFilter.toLowerCase()) ||
          r.tags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase()))
      );
    }

    if (difficultyFilter !== 'All') {
      result = result.filter(
        (r) => r.tags.some((t) => t.toLowerCase() === difficultyFilter.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.coach_name.toLowerCase().includes(q) ||
          r.caption.toLowerCase().includes(q) ||
          r.workout_type.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const sorted = [...result];
    switch (sortBy) {
      case 'trending':
        sorted.sort((a, b) => engagementScore(b) - engagementScore(a));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'popular':
        sorted.sort((a, b) => b.like_count - a.like_count);
        break;
    }

    return sorted;
  }, [reels, activeFilter, difficultyFilter, searchQuery, sortBy]);

  const visibleReels = filteredReels.slice(0, visibleCount);
  const activeSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label || 'Trending';

  const handleLike = (reelId: string) => {
    setLikedReels((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) next.delete(reelId);
      else next.add(reelId);
      return next;
    });
  };

  const handleSave = (reelId: string) => {
    setSavedReels((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) {
        next.delete(reelId);
        showToast('Removed from saved');
      } else {
        next.add(reelId);
        showToast('Reel saved to collection');
      }
      return next;
    });
  };

  const handleShare = (reel: Reel) => {
    if (navigator.share) {
      navigator.share({ title: reel.caption, text: `Check out this reel by ${reel.coach_name}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    }
  };

  const [profileCoach, setProfileCoach] = useState<EliteReelData | null>(null);
  const [consultCoach, setConsultCoach] = useState<EliteReelData | null>(null);

  const handleViewProfile = (reel: Reel) => {
    setProfileCoach({
      id: reel.id,
      coachName: reel.coach_name,
      credential: reel.workout_type || 'Coach',
      avatar: reel.coach_avatar,
      thumbnail: reel.thumbnail_url || reel.media_url,
      title: reel.caption,
      category: reel.workout_type || 'General',
      tier: 'proven',
      handle: `@${reel.coach_name.toLowerCase().replace(/\s+/g, '')}`,
    });
  };

  const activeFilterCount =
    (activeFilter !== 'All' ? 1 : 0) +
    (difficultyFilter !== 'All' ? 1 : 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-[#C4121A] dark:border-[#D91F28] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-mono text-black/60 dark:text-white/60 font-bold">Loading reels...</span>
      </div>
    );
  }

  if (error && reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6 text-center">
        <Camera className="w-8 h-8 text-gray-400" />
        <span className="text-sm font-mono text-black/60 dark:text-white/60 font-bold">{error}</span>
        <button onClick={loadReels} className="text-sm font-black text-[#C4121A] dark:text-[#D91F28] cursor-pointer">
          Tap to retry
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#C4121A]/10 dark:bg-[#D91F28]/10 flex items-center justify-center border border-[#C4121A]/20 dark:border-[#D91F28]/20">
          <Video className="w-7 h-7 text-[#C4121A] dark:text-[#D91F28]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#000000] dark:text-white mb-1">No reels yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Be the first to post a workout reel and inspire the community.
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-5 py-3 bg-[#C4121A] dark:bg-[#D91F28] text-white font-black text-sm rounded-xl hover:bg-[#B8121A] active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Post Your First Reel
        </button>
        <ReelUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          currentUserEmail={currentUserEmail}
          onPosted={() => {
            setIsUploadOpen(false);
            loadReels();
            showToast('Reel posted to the feed!');
          }}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto pb-[max(7rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))] relative">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-black/5 dark:bg-black/40 border-b border-black/15 dark:border-white/20 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C4121A] dark:text-[#D91F28]" />
            <h2 className="text-base font-black text-black dark:text-white tracking-tight">Reels</h2>
            <span className="text-[10px] font-mono font-black bg-[#C4121A]/10 dark:bg-[#D91F28]/10 text-[#C4121A] dark:text-[#D91F28] px-1.5 py-0.5 rounded-md">
              {reels.length} POSTS
            </span>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-8 h-8 rounded-full bg-[#C4121A] dark:bg-[#D91F28] text-white flex items-center justify-center hover:bg-[#B8121A] active:scale-90 transition-all cursor-pointer shadow-sm"
            title="Post a reel"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reels, coaches, exercises..."
            className="w-full pl-9 pr-9 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:border-[#C4121A]/40 focus:ring-2 focus:ring-[#C4121A]/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center cursor-pointer active:scale-90"
            >
              <X className="w-3 h-3 text-black/60 dark:text-white/60" />
            </button>
          )}
        </div>

        {/* Category Filters + Sort + Filter toggle */}
        <div className="flex items-center gap-2">
          <div className="pill-strip flex-1 min-w-0 -mx-1 px-1 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`py-1 px-2.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[#1A1E1D] text-white'
                    : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Filter panel toggle */}
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              filterPanelOpen || activeFilterCount > 0
                ? 'bg-[#C4121A] dark:bg-[#D91F28] text-white'
                : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFilterCount > 0 && (
              <span className="text-[10px] bg-white text-[#C4121A] dark:text-[#D91F28] rounded-full w-4 h-4 flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div ref={sortMenuRef} className="relative shrink-0">
            <button
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              {SORT_OPTIONS.find((s) => s.key === sortBy)?.icon}
              <ChevronDown className={`w-3 h-3 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#161A1F] shadow-2xl overflow-hidden z-50 animate-slideDownFade">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSortBy(opt.key);
                      setSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      sortBy === opt.key
                        ? 'bg-[#EA4335]/10 text-[#EA4335]'
                        : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                    {sortBy === opt.key && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expandable filter panel */}
        {filterPanelOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-black/10 dark:border-white/10 space-y-2 animate-slideDownFade">
            <div>
              <div className="text-[10px] font-mono font-black text-black/50 dark:text-white/50 uppercase tracking-wider mb-1.5">Difficulty</div>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-all cursor-pointer ${
                      difficultyFilter === d
                        ? 'bg-red-600 text-white'
                        : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setDifficultyFilter('All');
                }}
                className="text-[10px] font-black text-[#EA4335] cursor-pointer hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* FEATURED REELS CAROUSEL */}
      {featuredReels.length > 0 && !searchQuery && activeFilter === 'All' && activeFilterCount === 0 && (
        <div className="pt-4">
          <div className="flex items-center gap-2 px-4 mb-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-black dark:text-white tracking-tight">Featured</h3>
            <span className="text-[10px] font-mono font-black text-amber-400/80">TOP RATED</span>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-1 snap-x snap-mandatory">
            {featuredReels.map((reel) => {
              const isLiked = likedReels.has(reel.id);
              const spec = SPECIALIZATION_MAP[reel.workout_type] || '';
              return (
                <div
                  key={`featured_${reel.id}`}
                  className="snap-start shrink-0 w-[150px] relative rounded-2xl overflow-hidden bg-[#1A1E1D] shadow-lg cursor-pointer card-lift"
                  style={{ aspectRatio: '9/13' }}
                  onClick={() => handleViewProfile(reel)}
                >
                  <div className="absolute inset-0 bg-[#1A1E1D] flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-white/20" />
                  </div>
                  {reel.media_type === 'video' ? (
                    <video
                      src={reel.media_url}
                      poster={reel.thumbnail_url || undefined}
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={reel.media_url}
                      alt={reel.caption}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}

                  {/* Featured badge */}
                  <div className="absolute top-2 left-2 z-20">
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black bg-amber-400/90 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Flame className="w-2.5 h-2.5" />
                      Hot
                    </span>
                  </div>

                  {/* Like count */}
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 bg-black/40 rounded-full px-1.5 py-0.5">
                    <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-[#EA4335] text-[#EA4335]' : 'text-white'}`} />
                    <span className="text-[9px] font-mono font-black text-white">
                      {reel.like_count + (isLiked ? 1 : 0)}
                    </span>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 z-20 min-w-0 bg-gradient-to-t from-black via-black/70 to-transparent">
                    {spec && (
                      <div className="text-[8px] font-mono font-bold text-red-400 mb-1 uppercase tracking-wider truncate max-w-full">
                        {spec}
                      </div>
                    )}
                    <div className="text-[11px] font-black leading-tight text-white line-clamp-2 max-h-[26px] overflow-hidden">
                      {reel.coach_name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULTS HEADER */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <div className="text-xs font-black text-black/60 dark:text-white/60">
          {filteredReels.length} {filteredReels.length === 1 ? 'reel' : 'reels'}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
        <div className="text-[10px] font-mono font-bold text-black/40 dark:text-white/40 flex items-center gap-1">
          {SORT_OPTIONS.find((s) => s.key === sortBy)?.icon}
          {activeSortLabel}
        </div>
      </div>

      {/* MAIN GRID */}
      {visibleReels.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 px-6 text-center">
          <Search className="w-8 h-8 text-black/20 dark:text-white/20" />
          <span className="text-sm font-mono text-black/50 dark:text-white/50 font-bold">
            No reels match your filters. Try adjusting your search.
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setActiveFilter('All');
                setDifficultyFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-black text-[#EA4335] cursor-pointer hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div ref={feedRef} className="grid grid-cols-2 gap-2 pt-2 px-3">
          {visibleReels.map((reel) => {
            const isLiked = likedReels.has(reel.id);
            const isActive = activeReelId === reel.id;
            const spec = SPECIALIZATION_MAP[reel.workout_type] || '';

            return (
              <article
                key={reel.id}
                data-reel-id={reel.id}
                className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#161A1F] cursor-pointer"
                onClick={() => setFullScreenReel(reel)}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <div className="absolute inset-0 bg-[#1A1E1D] flex items-center justify-center">
                    <Dumbbell className="w-10 h-10 text-white/15" />
                  </div>
                  {reel.media_type === 'video' ? (
                    <video
                      src={reel.media_url}
                      poster={reel.thumbnail_url || undefined}
                      autoPlay={isActive}
                      muted
                      loop
                      playsInline
                      controls
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={reel.media_url}
                      alt={reel.caption || 'Workout reel'}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}

                  {reel.media_type === 'video' && !isActive && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                        <Play className="ml-0.5 h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between gap-2 p-2 bg-gradient-to-t from-black via-black/70 to-transparent">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black leading-tight text-white line-clamp-1">
                        {reel.coach_name}
                      </div>
                      {spec && (
                        <div className="text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider truncate">
                          {spec}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleLike(reel.id);
                      }}
                      className="flex shrink-0 items-center gap-1 cursor-pointer active:scale-90 transition-transform"
                      aria-label={isLiked ? 'Unlike reel' : 'Like reel'}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-[#EA4335] text-[#EA4335]' : 'text-white'}`} />
                      <span className="text-[10px] font-black text-white font-mono">
                        {reel.like_count + (isLiked ? 1 : 0)}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 p-2 min-w-0">
                  {reel.caption && (
                    <p className="line-clamp-2 text-[11px] font-bold leading-relaxed text-black dark:text-white">
                      {reel.caption}
                    </p>
                  )}

                  <button
                    onClick={() => handleViewProfile(reel)}
                    className="flex w-full items-center justify-center gap-1 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-black/70 dark:text-white/70 transition-all hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 cursor-pointer"
                  >
                    <User className="h-3 w-3" />
                    View Profile
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {visibleReels.length < filteredReels.length && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black/40 dark:text-white/40">
            <div className="w-4 h-4 border-2 border-[#EA4335] border-t-transparent rounded-full animate-spin" />
            Loading more reels...
          </div>
        </div>
      )}

      {/* End of results */}
      {visibleReels.length > 0 && visibleReels.length >= filteredReels.length && filteredReels.length > PAGE_SIZE && (
        <div className="flex items-center justify-center py-4">
          <span className="text-[10px] font-mono font-bold text-black/30 dark:text-white/30">
            You've seen all {filteredReels.length} reels
          </span>
        </div>
      )}

      {/* Upload Modal */}
      <ReelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUserEmail={currentUserEmail}
        onPosted={() => {
          setIsUploadOpen(false);
          loadReels();
          showToast('Reel posted to the feed!');
        }}
        showToast={showToast}
      />
      <CoachProfileSheet
        isOpen={!!profileCoach}
        onClose={() => setProfileCoach(null)}
        coach={profileCoach}
        allReels={profileCoach ? reels
          .filter(r => r.coach_name === profileCoach.coachName)
          .map(r => ({
            id: r.id,
            coachName: r.coach_name,
            credential: r.workout_type || 'Coach',
            avatar: r.coach_avatar,
            thumbnail: r.thumbnail_url || r.media_url,
            title: r.caption,
            category: r.workout_type || 'General',
            tier: 'proven' as const,
          })) : []}
        showToast={showToast}
        onOpenMessage={(c) => { setProfileCoach(null); setConsultCoach(c); }}
        onPurchaseProgram={(prog) => showToast(`Opening ${prog.title} by ${prog.coachName} (${prog.price})`)}
      />
      <ConsultationRequestModal
        isOpen={!!consultCoach}
        onClose={() => setConsultCoach(null)}
        coachName={consultCoach?.coachName || ''}
        coachEmail={consultCoach?.coachName?.toLowerCase().replace(/\s+/g, '.') + '@o1fc.app' || ''}
        clientEmail={currentUserEmail}
        showToast={showToast}
      />

      {/* Full-Screen Reel Viewer */}
      {fullScreenReel && (
        <FullScreenReelViewer
          reel={fullScreenReel}
          isLiked={likedReels.has(fullScreenReel.id)}
          isSaved={savedReels.has(fullScreenReel.id)}
          onLike={() => handleLike(fullScreenReel.id)}
          onSave={() => handleSave(fullScreenReel.id)}
          onShare={() => handleShare(fullScreenReel)}
          onClose={() => setFullScreenReel(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
};

/* ═══════════════════ Full-Screen Reel Viewer ═══════════════════ */
const FullScreenReelViewer: React.FC<{
  reel: Reel;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}> = ({ reel, isLiked, isSaved, onLike, onSave, onShare, onClose, showToast }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
    }
    return () => { if (video) video.pause(); };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 800);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 800);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      onLike();
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  };

  let lastTap = 0;
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      handleDoubleTap();
    } else {
      setTimeout(() => {
        if (Date.now() - now >= 300) togglePlay();
      }, 300);
    }
    lastTap = now;
  };

  const spec = SPECIALIZATION_MAP[reel.workout_type] || reel.workout_type;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 safe-top flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="btn-nude-close !text-white hover:!text-white" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          {spec && (
            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
              {spec}
            </span>
          )}
          <button onClick={toggleMute} className="btn-nude-close !text-white hover:!text-white" aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative" onClick={handleTap}>
        <video
          ref={videoRef}
          src={reel.media_url}
          poster={reel.thumbnail_url || undefined}
          muted={isMuted}
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Play/Pause center icon */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? <Play className="w-7 h-7 text-white ml-1" /> : <Pause className="w-7 h-7 text-white" />}
            </div>
          </div>
        )}

        {/* Double-tap heart animation */}
        {likeAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart className="w-20 h-20 fill-red-500 text-red-500 animate-ping" />
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
      </div>

      {/* Bottom info + actions */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-8 safe-bottom">
        <div className="flex items-end gap-3">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {reel.coach_avatar ? (
                <img src={reel.coach_avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                  {reel.coach_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white text-sm font-bold">{reel.coach_name}</p>
                <p className="text-white/50 text-[10px] font-medium">{reel.workout_type}</p>
              </div>
            </div>
            <p className="text-white/90 text-xs leading-relaxed line-clamp-3">{reel.caption}</p>
            {reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {reel.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[9px] font-bold bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/30' : 'bg-white/10 backdrop-blur-sm'}`}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </div>
              <span className="text-[10px] font-bold text-white">{reel.like_count + (isLiked ? 1 : 0)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onSave(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-amber-500/30' : 'bg-white/10 backdrop-blur-sm'}`}>
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
              </div>
              <span className="text-[10px] font-bold text-white">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
