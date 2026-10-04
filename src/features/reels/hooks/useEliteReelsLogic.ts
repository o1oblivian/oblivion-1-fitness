import { useState, useRef, useMemo, useEffect } from 'react';
import { ExploreReelItem, ExploreCoach, FilmstripClip } from '../../../data/reelsExploreCatalog';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { supabase } from '../../../services/supabaseClient';
import { filterReelsCatalog } from './reelsFilterHelper';

export { CATEGORIES, FILTER_TAGS } from './reelsFilterHelper';

export function useEliteReelsLogic(
  initialCategory: ExploreReelItem['category'] = 'ALL',
  initialFilter: string = 'ALL'
) {
  const allReels = useReelsStore((s) => s.reels);
  const [tabMode, setTabMode] = useState<'reels' | 'coaches'>('reels');
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState<ExploreReelItem['category']>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteCoaches, setRemoteCoaches] = useState<ExploreCoach[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadVerifiedCoaches() {
      try {
        const { data, error } = await supabase
          .from('coaches')
          .select('*')
          .eq('verified', true);
        if (!error && data && data.length > 0 && isMounted) {
          setRemoteCoaches(data as ExploreCoach[]);
        }
      } catch {
        // Fallback: remote coaches remains empty, triggering the clean verified directory state
      }
    }
    loadVerifiedCoaches();
    return () => { isMounted = false; };
  }, []);

  const filteredReels = useMemo(() => filterReelsCatalog(allReels, selectedFilter, selectedCategory, searchQuery), [allReels, selectedFilter, selectedCategory, searchQuery]);

  const [activeReel, setActiveReel] = useState<ExploreReelItem | null>(null);
  const [activeClip, setActiveClip] = useState<FilmstripClip | null>(null);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialFilter) setSelectedFilter(initialFilter);
  }, [initialCategory, initialFilter]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [followedCoaches, setFollowedCoaches] = useState<Record<string, boolean>>({});
  const [addedExercises, setAddedExercises] = useState<Record<string, boolean>>({});
  const [bookingCoach, setBookingCoach] = useState<ExploreCoach | null>(null);
  const [messageCoach, setMessageCoach] = useState<ExploreCoach | null>(null);
  const addExerciseToActiveLog = useWorkoutStore((s) => s.addExerciseToActiveLog);

  const handleNextReel = () => {
    if (!activeReel || filteredReels.length === 0) return;
    const nextIdx = (filteredReels.findIndex((r) => r.id === activeReel.id) + 1) % filteredReels.length;
    const next = filteredReels[nextIdx];
    setActiveReel(next);
    setActiveClip(next.filmstripClips?.[0] || null);
    setIsPlaying(true);
  };

  const handlePrevReel = () => {
    if (!activeReel || filteredReels.length === 0) return;
    const prevIdx = (filteredReels.findIndex((r) => r.id === activeReel.id) - 1 + filteredReels.length) % filteredReels.length;
    const prev = filteredReels[prevIdx];
    setActiveReel(prev);
    setActiveClip(prev.filmstripClips?.[0] || null);
    setIsPlaying(true);
  };

  const handleToggleLike = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); tactileEngine.triggerSelectionBuzz(); setLikedReels((p) => ({ ...p, [id]: !p[id] })); };
  const handleToggleSave = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); tactileEngine.triggerLightTick(); setSavedReels((p) => ({ ...p, [id]: !p[id] })); };
  const handleToggleFollow = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); tactileEngine.triggerSelectionBuzz(); setFollowedCoaches((p) => ({ ...p, [id]: !p[id] })); };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerLightTick();
    setIsMuted((prev) => !prev);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    tactileEngine.triggerLightTick();
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    tactileEngine.triggerLightTick();
    const shareData = {
      title: activeReel?.title || 'Oblivion 1 Protocol',
      text: `Check out ${activeReel?.coach?.name || 'Coach'}'s protocol: ${activeReel?.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareToast('Link copied to clipboard');
        setTimeout(() => setShareToast(null), 2500);
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareToast('Link copied to clipboard');
        setTimeout(() => setShareToast(null), 2500);
      }
    }
  };

  const handleAddExerciseToWorkout = (reel: ExploreReelItem, clip?: FilmstripClip | null) => {
    tactileEngine.playPRCelebration();
    addExerciseToActiveLog({
      id: `reel-${reel.id}-${Date.now()}`,
      name: clip ? `${reel.title} (${clip.title})` : reel.title,
      targetMuscle: 'Core',
      restSecs: 60,
      equipment: 'Bodyweight',
      sets: [1, 2, 3].map((setNumber) => ({ setNumber, weightKg: 0, reps: 10, rpe: 7, completed: false })),
    });
    setAddedExercises((p) => ({ ...p, [reel.id]: true }));
  };

  const coachesList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return remoteCoaches;
    return remoteCoaches.filter((c) => (c?.name ?? '').toLowerCase().includes(q) || (c?.specialtyTitle ?? c?.specialty ?? '').toLowerCase().includes(q));
  }, [searchQuery, remoteCoaches]);

  return {
    tabMode, setTabMode, selectedFilter, setSelectedFilter, selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery, activeReel, setActiveReel, activeClip, setActiveClip,
    isPlaying, isMuted, videoRef, likedReels, savedReels, followedCoaches, addedExercises,
    bookingCoach, setBookingCoach, messageCoach, setMessageCoach, handleNextReel, handlePrevReel,
    handleToggleLike, handleToggleSave, handleToggleFollow, handleToggleMute, handleTogglePlay,
    handleShare, handleAddExerciseToWorkout, filteredReels, coachesList, shareToast,
  };
}
