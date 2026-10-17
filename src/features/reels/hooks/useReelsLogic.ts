import { useState, useRef, useMemo, useEffect } from 'react';
import { ExploreReelItem, ExploreCoach, FilmstripClip } from '../reelTypes';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { workingLoadKg } from '../../workout/services/dayRoutineService';
import { tactileEngine } from '../../../services/tactileEngine';
import { fetchCoachCards, toExploreCoach } from '../../coach/services/coachDirectory';
import { filterReelsCatalog } from './reelsFilterHelper';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { loadVaultBookmarks, saveVaultBookmark } from '../services/vaultBookmarks';
import { useConsultationStore } from '../../induction/useConsultationStore';
import { chipHit, textHitsDiscipline } from '../../induction/consultationTypes';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { reelUrl, shareLink } from '../services/reelLinks';
import type { ShareLinkTarget } from '../components/ShareLinkSheet';
import { fetchLikeCount, loadMyLikes, setReelLike } from '../services/reelLikes';
import { useReelViewsStore } from '../services/reelViews';
import { isReelVisible, useReelSafetyStore, useVisibleReels } from '../services/reelSafety';
import { reelCategoryLabel } from '../reelCategories';

export { CATEGORIES } from './reelsFilterHelper';

function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/(^|[\s/&-])([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase());
}

export function useReelsLogic(
  initialCategory: ExploreReelItem['category'] = 'ALL',
  initialFilter: string = 'ALL',
) {
  const allReels = useVisibleReels(useReelsStore((s) => s.reels));
  const blockedCoaches = useReelSafetyStore((s) => s.blockedCoaches);
  const hiddenReels = useReelSafetyStore((s) => s.hiddenReels);
  const hydrateSafety = useReelSafetyStore((s) => s.hydrate);
  useEffect(() => {
    void hydrateSafety();
  }, [hydrateSafety]);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [selectedCategory, setSelectedCategory] =
    useState<ExploreReelItem['category']>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteCoaches, setRemoteCoaches] = useState<ExploreCoach[]>([]);

  useEffect(() => {
    let isMounted = true;
    void fetchCoachCards().then((cards) => {
      if (isMounted) setRemoteCoaches(cards.map(toExploreCoach));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const discipline = useConsultationStore((state) => state.primaryDiscipline);
  const filteredReels = useMemo(() => {
    const rows = filterReelsCatalog(allReels, selectedFilter, selectedCategory, searchQuery);
    return [...rows].sort(
      (a, b) =>
        Number(textHitsDiscipline(`${b.title} ${b.filterTag || ''}`, discipline)) -
        Number(textHitsDiscipline(`${a.title} ${a.filterTag || ''}`, discipline)),
    );
  }, [allReels, selectedFilter, selectedCategory, searchQuery, discipline]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ExploreReelItem['category'], number>> = {};
    for (const reel of filterReelsCatalog(allReels, selectedFilter, 'ALL', searchQuery)) {
      counts[reel.category] = (counts[reel.category] ?? 0) + 1;
      counts.ALL = (counts.ALL ?? 0) + 1;
    }
    return counts;
  }, [allReels, selectedFilter, searchQuery]);

  const [activeReel, setActiveReel] = useState<ExploreReelItem | null>(null);
  const [activeClip, setActiveClip] = useState<FilmstripClip | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number | null>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const userRef = useRef('');

  useEffect(() => {
    let live = true;
    void getAuthenticatedUserId().then(async (userId) => {
      userRef.current = userId || '';
      const [saved, liked] = await Promise.all([
        loadVaultBookmarks(userRef.current),
        loadMyLikes(userRef.current),
      ]);
      if (!live) return;
      setSavedReels(saved);
      setLikedReels(liked);
    });
    return () => {
      live = false;
    };
  }, []);

  const activeReelId = activeReel?.id || '';
  const markViewed = useReelViewsStore((s) => s.markViewed);
  useEffect(() => {
    if (!activeReelId) return;
    markViewed(activeReelId);
    let live = true;
    void fetchLikeCount(activeReelId).then((count) => {
      if (live) setLikeCounts((prev) => ({ ...prev, [activeReelId]: count }));
    });
    return () => {
      live = false;
    };
  }, [activeReelId, markViewed]);

  const [toast, setToast] = useState<string | null>(null);
  const [linkSheet, setLinkSheet] = useState<ShareLinkTarget | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (message: string | null) => {
    if (!message) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

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
    const ownQueue = playlist?.filter((r) => isReelVisible(r, hiddenReels, blockedCoaches)) ?? [];
    const queue = ownQueue.length > 0 ? ownQueue : filteredReels;
    if (!activeReel || queue.length === 0) return;
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
      setLikeCounts((prev) =>
        prev[id] == null ? prev : { ...prev, [id]: Math.max(0, (prev[id] as number) + delta) },
      );
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
      text: activeReel.coach?.name
        ? `${activeReel.title} by ${activeReel.coach.name}`
        : activeReel.title,
      url: reelUrl(activeReel.id),
    };
    if ((await shareLink(target)) === 'options') setLinkSheet(target);
  };

  const handleAddExerciseToWorkout = (reel: ExploreReelItem, clip?: FilmstripClip | null) => {
    if (addedExercises[reel.id]) {
      flash('Already in today\u2019s log');
      return;
    }
    const stamp = Date.now();
    const name = clip ? `${reel.title} (${clip.title})` : reel.title;
    const reps = 10;
    const load = workingLoadKg(reel.title, reps);
    addExerciseToActiveLog({
      id: `reel-${reel.id}-${stamp}`,
      name,
      exerciseName: reel.title,
      targetMuscle: titleCase(reel.filterTag || reelCategoryLabel(reel.category)),
      restSecs: readAthleteSettingsSnapshot().defaultRestSeconds || 90,
      sets: [1, 2, 3].map((setNumber) => ({
        id: `set-${stamp}-${setNumber}`,
        setNumber,
        weightKg: load,
        reps: load > 0 ? reps : 0,
        rpe: 0,
        completed: false,
      })),
    });
    flash(
      load > 0 ? 'Added to today\u2019s log with your working load' : 'Added to today\u2019s log',
    );
  };

  const coachesList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const rows = remoteCoaches.filter((coach) => {
      if (blockedCoaches[coach.id]) return false;
      const blob = `${coach?.name ?? ''} ${coach?.specialtyTitle ?? ''} ${coach?.specialty ?? ''}`;
      const matchesQuery = !q || blob.toLowerCase().includes(q);
      return matchesQuery && chipHit(blob, selectedFilter);
    });
    return [...rows].sort(
      (a, b) =>
        Number(textHitsDiscipline(`${b.specialtyTitle} ${b.specialty}`, discipline)) -
        Number(textHitsDiscipline(`${a.specialtyTitle} ${a.specialty}`, discipline)),
    );
  }, [searchQuery, remoteCoaches, selectedFilter, discipline, blockedCoaches]);

  return {
    selectedFilter,
    setSelectedFilter,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeReel,
    setActiveReel,
    activeClip,
    setActiveClip,
    isPlaying,
    setIsPlaying,
    videoRef,
    likedReels,
    likeCounts,
    savedReels,
    addedExercises,
    bookingCoach,
    setBookingCoach,
    messageCoach,
    setMessageCoach,
    setPlaylist,
    handleNextReel,
    handlePrevReel,
    handleToggleLike,
    handleToggleSave,
    handleTogglePlay,
    handleShare,
    handleAddExerciseToWorkout,
    filteredReels,
    categoryCounts,
    coachesList,
    toast,
    flash,
    linkSheet,
    setLinkSheet,
  };
}
