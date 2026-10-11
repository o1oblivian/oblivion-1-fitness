import { useState, useRef, useMemo, useEffect } from 'react';
import { ExploreReelItem, ExploreCoach, FilmstripClip } from '../reelTypes';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { supabase } from '../../../services/supabaseClient';
import { filterReelsCatalog } from './reelsFilterHelper';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { loadVaultBookmarks, saveVaultBookmark } from '../services/vaultBookmarks';
import { useConsultationStore } from '../../induction/useConsultationStore';
import { chipHit, textHitsDiscipline } from '../../induction/consultationTypes';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { reelUrl, shareLink } from '../services/reelLinks';
import type { ShareLinkTarget } from '../components/ShareLinkSheet';
import { fetchLikeCount, loadMyLikes, setReelLike } from '../services/reelLikes';

export { CATEGORIES, FILTER_TAGS } from './reelsFilterHelper';

function titleCase(raw: string): string {
  return raw.toLowerCase().replace(/(^|[\s/&-])([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase());
}

export function useEliteReelsLogic(
  initialCategory: ExploreReelItem['category'] = 'ALL',
  initialFilter: string = 'ALL'
) {
  const allReels = useReelsStore((s) => s.reels);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState<ExploreReelItem['category']>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteCoaches, setRemoteCoaches] = useState<ExploreCoach[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadVerifiedCoaches() {
      try {
        const [coachesRes, profilesRes] = await Promise.all([
          supabase.from('coaches').select('*'),
          supabase.from('coach_profiles').select('id, display_name, avatar_url, specialties, bio, is_id_verified'),
        ]);
        const rows = [...(coachesRes.data || []), ...(profilesRes.data || [])];
        const mapped: ExploreCoach[] = rows.map((row: any, idx: number) => ({
          id: String(row.id || row.coach_id || `coach-${idx}`),
          name: row.name || row.display_name || 'Coach',
          handle: row.handle || `@${String(row.name || 'coach').toLowerCase().replace(/\s+/g, '')}`,
          avatar: row.avatar || row.avatar_url || '',
          verified: Boolean(row.verified ?? row.is_id_verified),
          specialtyTitle: row.specialtyTitle || row.specialty || row.discipline || (Array.isArray(row.specialties) ? row.specialties[0] : row.specialties) || 'Coach',
          specialty: row.specialty,
          rating: Number(row.rating || 0),
          reviewCount: Number(row.review_count || row.reviewCount || 0),
          certificationPill: row.certificationPill || row.certification || '',
          rate: row.rate || row.price || '',
          slotsRemaining: Number(row.slotsRemaining || row.slots || 0),
          bio: row.bio || '',
          disciplines: Array.isArray(row.disciplines) ? row.disciplines : [],
          physiquePhotos: row.physiquePhotos || row.photos || [],
        }));
        const seen = new Set<string>();
        const unique = mapped.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        if (isMounted) setRemoteCoaches(unique);
      } catch {
        // Fallback: remote coaches remains empty, triggering the clean verified directory state
      }
    }
    loadVerifiedCoaches();
    return () => { isMounted = false; };
  }, []);

  const discipline = useConsultationStore((state) => state.primaryDiscipline);
  const filteredReels = useMemo(() => {
    const rows = filterReelsCatalog(allReels, selectedFilter, selectedCategory, searchQuery);
    return [...rows].sort((a, b) => Number(textHitsDiscipline(`${b.title} ${b.filterTag || ''}`, discipline)) - Number(textHitsDiscipline(`${a.title} ${a.filterTag || ''}`, discipline)));
  }, [allReels, selectedFilter, selectedCategory, searchQuery, discipline]);

  const [activeReel, setActiveReel] = useState<ExploreReelItem | null>(null);
  const [activeClip, setActiveClip] = useState<FilmstripClip | null>(null);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialFilter) setSelectedFilter(initialFilter);
  }, [initialCategory, initialFilter]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number | null>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const userRef = useRef('');

  useEffect(() => {
    let live = true;
    void getAuthenticatedUserId().then(async (userId) => {
      userRef.current = userId || '';
      const [saved, liked] = await Promise.all([loadVaultBookmarks(userRef.current), loadMyLikes(userRef.current)]);
      if (!live) return;
      setSavedReels(saved);
      setLikedReels(liked);
    });
    return () => { live = false; };
  }, []);

  const activeReelId = activeReel?.id || '';
  useEffect(() => {
    if (!activeReelId) return;
    let live = true;
    void fetchLikeCount(activeReelId).then((count) => {
      if (live) setLikeCounts((prev) => ({ ...prev, [activeReelId]: count }));
    });
    return () => { live = false; };
  }, [activeReelId]);

  const [toast, setToast] = useState<string | null>(null);
  const [linkSheet, setLinkSheet] = useState<ShareLinkTarget | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (message: string | null) => {
    if (!message) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const exercises = useWorkoutStore((s) => s.exercises);
  const addedExercises = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const ex of exercises) {
      const match = /^reel-(.+)-\d+$/.exec(ex.id);
      if (match) map[match[1]] = true;
    }
    return map;
  }, [exercises]);
  const [bookingCoach, setBookingCoach] = useState<ExploreCoach | null>(null);
  const [messageCoach, setMessageCoach] = useState<ExploreCoach | null>(null);
  const [playlist, setPlaylist] = useState<ExploreReelItem[] | null>(null);
  const addExerciseToActiveLog = useWorkoutStore((s) => s.addExerciseToActiveLog);

  const stepReel = (direction: 1 | -1) => {
    const queue = playlist && playlist.length > 0 ? playlist : filteredReels;
    if (!activeReel || queue.length < 2) return;
    const idx = queue.findIndex((r) => r.id === activeReel.id);
    const nextIdx = idx < 0 ? 0 : (idx + direction + queue.length) % queue.length;
    const next = queue[nextIdx];
    if (next.id === activeReel.id) return;
    setActiveReel(next);
    setActiveClip(next.filmstripClips?.[0] || null);
  };
  const handleNextReel = () => stepReel(1);
  const handlePrevReel = () => stepReel(-1);

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!userRef.current) {
      flash('Sign in to like reels');
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    const liked = !likedReels[id];
    const bump = (delta: number) =>
      setLikeCounts((prev) => (prev[id] == null ? prev : { ...prev, [id]: Math.max(0, (prev[id] as number) + delta) }));
    setLikedReels((prev) => ({ ...prev, [id]: liked }));
    bump(liked ? 1 : -1);
    void setReelLike(userRef.current, id, liked).then((ok) => {
      if (ok) return;
      setLikedReels((prev) => ({ ...prev, [id]: !liked }));
      bump(liked ? -1 : 1);
      flash('Could not save your like');
    });
  };
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    tactileEngine.triggerLightTick();
    const saved = !savedReels[id];
    setSavedReels((prev) => ({ ...prev, [id]: saved }));
    void saveVaultBookmark(userRef.current, id, saved);
    flash(saved ? 'Saved to your vault' : 'Removed from your vault');
  };
  const handleToggleMute = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    tactileEngine.triggerLightTick();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    tactileEngine.triggerLightTick();
    if (video.paused) void video.play().catch(() => setIsPlaying(false));
    else video.pause();
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeReel) return;
    tactileEngine.triggerLightTick();
    const target = {
      title: activeReel.title,
      text: activeReel.coach?.name ? `${activeReel.title} by ${activeReel.coach.name}` : activeReel.title,
      url: reelUrl(activeReel.id),
    };
    if ((await shareLink(target)) === 'options') setLinkSheet(target);
  };

  const handleAddExerciseToWorkout = (reel: ExploreReelItem, clip?: FilmstripClip | null) => {
    if (addedExercises[reel.id]) {
      flash('Already in today\u2019s log');
      return;
    }
    tactileEngine.playPRCelebration();
    const stamp = Date.now();
    addExerciseToActiveLog({
      id: `reel-${reel.id}-${stamp}`,
      name: clip ? `${reel.title} (${clip.title})` : reel.title,
      targetMuscle: titleCase(reel.filterTag || reel.category),
      restSecs: readAthleteSettingsSnapshot().defaultRestSeconds || 90,
      sets: [1, 2, 3].map((setNumber) => ({ id: `set-${stamp}-${setNumber}`, setNumber, weightKg: 0, reps: 0, rpe: 0, completed: false })),
    });
    flash('Added to today\u2019s log');
  };

  const coachesList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const rows = remoteCoaches.filter((coach) => {
      const blob = `${coach?.name ?? ''} ${coach?.specialtyTitle ?? ''} ${coach?.specialty ?? ''}`;
      const matchesQuery = !q || blob.toLowerCase().includes(q);
      return matchesQuery && chipHit(blob, selectedFilter);
    });
    return [...rows].sort((a, b) => Number(textHitsDiscipline(`${b.specialtyTitle} ${b.specialty}`, discipline)) - Number(textHitsDiscipline(`${a.specialtyTitle} ${a.specialty}`, discipline)));
  }, [searchQuery, remoteCoaches, selectedFilter, discipline]);

  return {
    selectedFilter, setSelectedFilter, selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery, activeReel, setActiveReel, activeClip, setActiveClip,
    isPlaying, setIsPlaying, isMuted, videoRef, likedReels, likeCounts, savedReels, addedExercises,
    bookingCoach, setBookingCoach, messageCoach, setMessageCoach, setPlaylist, handleNextReel, handlePrevReel,
    handleToggleLike, handleToggleSave, handleToggleMute, handleTogglePlay,
    handleShare, handleAddExerciseToWorkout, filteredReels, coachesList, toast, flash, linkSheet, setLinkSheet,
  };
}
