import React, { useState, useMemo, useEffect } from 'react';
import { ExerciseLog, SetData, TrackingType } from '../types';
import {
  EXERCISE_DATABASE,
  ROUTINE_TEMPLATES,
  LIFT_CATEGORIES,
  SPORTS_CATEGORIES,
  RECOVERY_CATEGORIES,
} from '../data/exerciseDatabase';
import { WeeklyProgressChart } from './WeeklyProgressChart';
import { WatchDial } from './WatchDial';
import { playRealBellSound, playPRBreakthroughChime } from '../utils/audio';
import { getSmartDefault, recordSmartInput } from '../utils/frequencyDefaults';
import { getDispatchedWorkouts, DispatchedWorkout } from '../utils/dispatchStore';
import { Zap, Trash2, Share2, ChevronDown, Dumbbell, Plus, Save, Check, Sparkles, ChevronRight, Play, Pause, Square, X, Trophy, TrendingUp, Disc, Flame, Search, Activity } from 'lucide-react';
import { DualLaneLauncher } from './DualLaneLauncher';
import { VictoryShareModal } from './VictoryShareModal';
import { PlateMathModal } from './PlateMathModal';
import { haptic, triggerHaptic } from '../utils/haptics';
import { evaluateSetProgression, recordPersonalRecord, calculate1RM, getExerciseHistoryStats } from '../utils/prIntelligence';

import { loadSocialProfiles, getSocialHandle } from '@/utils/socialProfilesStore';
import { WeeklyReportCardModal } from './WeeklyReportCardModal';


interface SoloViewProps {
  weeklySchedule: Record<string, string>;
  onUpdateWeeklySchedule?: (newSchedule: Record<string, string>) => void;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onOpenScheduleModal: () => void;
  onOpenRoutineSwapper: () => void;
  onOpenCommitModal: () => void;
  onOpenDial: (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  activeLogs: ExerciseLog[];
  setActiveLogs: React.Dispatch<React.SetStateAction<ExerciseLog[]>>;
  stepTarget: number;
  setStepTarget: (val: number) => void;
  restTimerSecs: number;
  setRestTimerSecs: React.Dispatch<React.SetStateAction<number>>;
  restTimerRunning: boolean;
  onToggleRestTimer: () => void;
  onStartRestTimer: (secs: number) => void;
  syncStatus?: { isOnline: boolean; pendingCount: number };
  onSyncPendingLogs?: () => void;
  onOpenShareGoalCard?: () => void;
  currentUserEmail?: string;
  profileImage?: string;
  onOpenProfile?: () => void;
  onOpenAIInsights?: () => void;
  onOpenPayPlan?: () => void;
}

export const SoloView: React.FC<SoloViewProps> = ({
  weeklySchedule,
  onUpdateWeeklySchedule,
  selectedDay,
  onSelectDay,
  onOpenScheduleModal,
  onOpenRoutineSwapper,
  onOpenCommitModal,
  onOpenDial,
  showToast,
  theme,
  onToggleTheme,
  activeLogs,
  setActiveLogs,
  stepTarget,
  setStepTarget,
  restTimerSecs,
  setRestTimerSecs,
  restTimerRunning,
  onToggleRestTimer,
  onStartRestTimer,
  syncStatus,
  onSyncPendingLogs,
  onOpenShareGoalCard,
  currentUserEmail = 'athlete@o1fc.app',
  profileImage,
  onOpenProfile,
  onOpenAIInsights,
  onOpenPayPlan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Chest & Triceps');
  const [exerciseBtnText, setExerciseBtnText] = useState<string>('Barbell Bench Press');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categoryTypeGroup, setCategoryTypeGroup] = useState<'weights' | 'sports' | 'recovery'>('weights');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [activeSetTimers, setActiveSetTimers] = useState<Record<string, number>>({});
  const [activeSetRemaining, setActiveSetRemaining] = useState<Record<string, number>>({});
  const [dispatchedWorkouts, setDispatchedWorkouts] = useState<DispatchedWorkout[]>([]);
  const [isVictoryShareOpen, setIsVictoryShareOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [plateMathModal, setPlateMathModal] = useState<{
    isOpen: boolean;
    exerciseName: string;
    weight: number;
    logId: string;
    setId: string;
  } | null>(null);

  const handleUpdateSetWeight = (log: ExerciseLog, setId: string, newWeight: number) => {
    recordSmartInput('exercise_weight_' + log.exerciseName, newWeight);
    const targetSet = log.sets.find((s) => s.id === setId);
    const reps = targetSet ? targetSet.reps : 0;
    
    // Evaluate PR intelligence
    const evalRes = evaluateSetProgression(log.exerciseName, newWeight, reps, log.sets, currentUserEmail);
    if (evalRes.isNewPR && evalRes.current1RM > 0) {
      haptic.pulse();
      playPRBreakthroughChime();
      const numReps = typeof reps === 'number' ? reps : parseInt(String(reps)) || 1;
      recordPersonalRecord(log.exerciseName, newWeight, numReps, currentUserEmail);
      showToast(`NEW ALL-TIME PR! ${log.exerciseName}: ${newWeight}kg x ${reps} (1RM: ${evalRes.current1RM}kg)`, 'success');
    } else {
      haptic.thump();
    }

    setActiveLogs((prev) =>
      prev.map((l) => {
        if (l.id !== log.id) return l;
        return {
          ...l,
          sets: l.sets.map((set) => (set.id === setId ? { ...set, weight: newWeight } : set)),
        };
      })
    );
  };

  const handleUpdateSetReps = (log: ExerciseLog, setId: string, newReps: number | string) => {
    const trackingType = getTrackingType(log.exerciseName);
    const finalReps = trackingType === 'time_dist' ? `${newReps}s` : newReps;
    recordSmartInput('exercise_reps_' + log.exerciseName, typeof newReps === 'number' ? newReps : parseInt(String(newReps)) || 0);
    const targetSet = log.sets.find((s) => s.id === setId);
    const weight = targetSet ? targetSet.weight : 0;

    // Evaluate PR intelligence
    const evalRes = evaluateSetProgression(log.exerciseName, weight, finalReps, log.sets, currentUserEmail);
    if (evalRes.isNewPR && evalRes.current1RM > 0) {
      haptic.pulse();
      playPRBreakthroughChime();
      const numReps = typeof newReps === 'number' ? newReps : parseInt(String(newReps)) || 1;
      recordPersonalRecord(log.exerciseName, weight, numReps, currentUserEmail);
      showToast(`NEW ALL-TIME PR! ${log.exerciseName}: ${weight}kg x ${finalReps} (1RM: ${evalRes.current1RM}kg)`, 'success');
    } else {
      haptic.thump();
    }

    setActiveLogs((prev) =>
      prev.map((l) => {
        if (l.id !== log.id) return l;
        return {
          ...l,
          sets: l.sets.map((set) => (set.id === setId ? { ...set, reps: finalReps } : set)),
        };
      })
    );
  };







  useEffect(() => {
    async function fetchDispatched() {
      const data = await getDispatchedWorkouts();
      setDispatchedWorkouts(data);
    }
    fetchDispatched();

    const handleUpdate = () => {
      fetchDispatched();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dispatched_workouts_updated', handleUpdate);
      return () => {
        window.removeEventListener('dispatched_workouts_updated', handleUpdate);
      };
    }
  }, []);

  const handleImportDispatchedWorkout = (workout: DispatchedWorkout) => {
    const newLogs: ExerciseLog[] = workout.exercises.map((ex, idx) => {
      const parsedWeight = parseFloat(ex.targetLoad) || 60;
      const parsedReps = parseInt(ex.reps) || 8;
      
      const setsData: SetData[] = Array.from({ length: ex.sets }).map((_, sIdx) => ({
        id: `disp_set_${idx}_${sIdx}_${Date.now()}`,
        weight: parsedWeight,
        reps: parsedReps,
        rpe: 8,
      }));

      return {
        id: `disp_log_${idx}_${Date.now()}`,
        exerciseName: ex.name,
        sets: setsData,
      };
    });

    setActiveLogs((prev) => [...newLogs, ...prev]);
    showToast(`Imported "${workout.title}" (${newLogs.length} exercises) into Active Log!`, 'success');
  };

  const [customExerciseDb, setCustomExerciseDb] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('custom_exercise_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const handleAddExercisePermanently = (newExerciseName: string, targetCat: string) => {
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;

    setCustomExerciseDb((prev) => {
      const currentList = prev[targetCat] || EXERCISE_DATABASE[targetCat] || [];
      if (currentList.some((e) => e.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updatedList = [trimmed, ...currentList];
      const updatedDb = { ...prev, [targetCat]: updatedList };
      try {
        localStorage.setItem('custom_exercise_db', JSON.stringify(updatedDb));
      } catch (e) {}
      return updatedDb;
    });

    handleAddExercise(trimmed);
    setExerciseSearchQuery('');
    showToast(`Permanently saved "${trimmed}" to ${targetCat}!`, 'success');
  };

  // Detect current day of week (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const todayDayName = useMemo(() => {
    const jsDay = new Date().getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return map[jsDay];
  }, []);

  const updateDayWorkout = (day: string, workoutName: string) => {
    const newSched = { ...weeklySchedule, [day]: workoutName };
    if (onUpdateWeeklySchedule) {
      onUpdateWeeklySchedule(newSched);
    }
  };

  const ROUTINE_LABEL_MAP: Record<string, string> = {
    functional_hypertrophy: 'Functional Hypertrophy',
    hybrid_racing: 'Hybrid Racing',
    push_a: 'Push A',
    pull_a: 'Pull A',
    legs_a: 'Legs A',
    push_b: 'Push B',
    pull_b: 'Pull B',
    legs_b: 'Legs B',
    upper: 'Upper',
    lower: 'Lower',
    full: 'Full Body',
    arms: 'Arms',
    core: 'Core',
    cardio: 'Cardio',
    Rest: 'Rest',
    rest: 'Rest',
  };

  const getWorkoutLabel = (val: string | undefined): string => {
    if (!val) return 'Rest';
    if (ROUTINE_LABEL_MAP[val]) return ROUTINE_LABEL_MAP[val];
    if (val.startsWith('custom_')) return 'Custom';
    return val;
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getTrackingType = (exName: string): TrackingType => {
    if (!exName) return 'reps_weight';
    const lower = exName.toLowerCase();
    let foundCat = 'Chest & Triceps';
    for (const cat in EXERCISE_DATABASE) {
      if (EXERCISE_DATABASE[cat].includes(exName)) {
        foundCat = cat;
        break;
      }
    }
    if (SPORTS_CATEGORIES.includes(foundCat)) {
      return 'time_dist';
    }

    if (
      RECOVERY_CATEGORIES.includes(foundCat) ||
      lower.includes('hold') ||
      lower.includes('breath') ||
      lower.includes('meditation') ||
      lower.includes('plank') ||
      lower.includes('sauna') ||
      lower.includes('stretch') ||
      lower.includes('yoga') ||
      lower.includes('nap') ||
      lower.includes('nsdr')
    ) {
      return 'reps_time';
    }

    return 'reps_weight';
  };

  // Helper to find previous set weight for an exercise name
  const findPreviousWeightForExercise = (exName: string) => {
    // Check active logs first for same exercise
    const matchedLog = activeLogs.find((l) => l.exerciseName === exName);
    if (matchedLog && matchedLog.sets.length > 0) {
      const lastSet = matchedLog.sets[matchedLog.sets.length - 1];
      if (Number(lastSet.weight) > 0 || Number(lastSet.reps) > 0) return { weight: lastSet.weight, reps: lastSet.reps, rpe: lastSet.rpe };
    }
    // Personalized defaults (start at 0 across the entire app)
    const smartWeight = getSmartDefault('exercise_weight_' + exName, 0);
    const smartReps = getSmartDefault('exercise_reps_' + exName, 0);
    const smartRpe = getSmartDefault('exercise_rpe_' + exName, 0);
    return { weight: smartWeight, reps: smartReps, rpe: smartRpe };
  };

  const handleLoadExerciseBatch = (exercises: string[], source: string) => {
    const newLogs = exercises.map((name) => {
      const trackingType = getTrackingType(name);
      const prevData = findPreviousWeightForExercise(name);
      return {
        id: 'ex_' + Math.random().toString(36).substring(2, 9),
        exerciseName: name,
        sets: [{
          id: 'set_' + Math.random().toString(36).substring(2, 9),
          reps: prevData.reps || (trackingType === 'time_dist' ? '0s' : 8),
          weight: prevData.weight || 0,
          rpe: prevData.rpe || 8,
          rawVal1: '0',
          rawVal2: '0',
        }],
      } as ExerciseLog;
    });
    setActiveLogs((prev) => [...prev, ...newLogs]);
  };

  const handleAddExercise = (exerciseName?: string) => {
    const nameToUse = exerciseName || exerciseBtnText;
    if (!nameToUse) {
      showToast('Select an exercise first', 'error');
      return;
    }

    const trackingType = getTrackingType(nameToUse);
    const prevData = findPreviousWeightForExercise(nameToUse);

    const newLog: ExerciseLog = {
      id: 'ex_' + Math.random().toString(36).substring(2, 9),
      exerciseName: nameToUse,
      sets: [
        {
          id: 'set_' + Math.random().toString(36).substring(2, 9),
          reps: prevData.reps || (trackingType === 'time_dist' ? '0s' : 8),
          weight: prevData.weight || 0,
          rpe: prevData.rpe || 8,
          rawVal1: '0',
          rawVal2: '0',
        },
      ],
    };

    setActiveLogs((prev) => [...prev, newLog]);
    setOpenDropdown(null);
    haptic.thump();
    showToast(
      prevData.weight > 0
        ? `Added ${nameToUse} (Auto-suggested ${prevData.weight}kg)`
        : `Added ${nameToUse}`,
      'success'
    );
  };

  const handleAddSet = (exerciseId: string) => {
    haptic.tap();
    let suggestedWeight = 0;
    let suggestedReps: string | number = 0;
    let suggestedRpe = 8;

    setActiveLogs((prev) =>
      prev.map((log) => {
        if (log.id !== exerciseId) return log;
        const trackingType = getTrackingType(log.exerciseName);

        if (log.sets.length > 0) {
          const lastSet = log.sets[log.sets.length - 1];
          suggestedWeight = lastSet.weight;
          suggestedReps = lastSet.reps;
          suggestedRpe = lastSet.rpe || 8;
        } else {
          const prev = findPreviousWeightForExercise(log.exerciseName);
          suggestedWeight = prev.weight;
          suggestedReps = prev.reps || (trackingType === 'time_dist' ? '0s' : 8);
          suggestedRpe = prev.rpe || 8;
        }

        const newSet: SetData = {
          id: 'set_' + Math.random().toString(36).substring(2, 9),
          reps: suggestedReps,
          weight: suggestedWeight,
          rpe: suggestedRpe,
          rawVal1: '0',
          rawVal2: '0',
        };
        return { ...log, sets: [...log.sets, newSet] };
      })
    );

    if (suggestedWeight > 0) {
      showToast(`Set added (Suggested: ${suggestedWeight}kg x ${suggestedReps})`, 'success');
    } else {
      showToast('New set added', 'success');
    }
    onStartRestTimer(90);
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    haptic.tap();
    setActiveLogs((prev) =>
      prev
        .map((log) => {
          if (log.id !== exerciseId) return log;
          const filteredSets = log.sets.filter((s) => s.id !== setId);
          return { ...log, sets: filteredSets };
        })
        .filter((log) => log.sets.length > 0)
    );
    onStartRestTimer(90);
  };

  const handleDeleteExerciseCard = (exerciseId: string) => {
    haptic.tap();
    setActiveLogs((prev) => prev.filter((log) => log.id !== exerciseId));
  };

  const toggleSetTimer = (setId: string, initialSecs = 60) => {
    if (activeSetTimers[setId]) {
      clearInterval(activeSetTimers[setId]);
      setActiveSetTimers((prev) => {
        const copy = { ...prev };
        delete copy[setId];
        return copy;
      });
      setActiveSetRemaining((prev) => {
        const copy = { ...prev };
        delete copy[setId];
        return copy;
      });
      return;
    }

    const secsToRun = initialSecs > 0 ? initialSecs : 60;
    setActiveSetRemaining((prev) => ({ ...prev, [setId]: secsToRun }));

    let remaining = secsToRun;
    const interval = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setActiveSetTimers((prev) => {
          const copy = { ...prev };
          delete copy[setId];
          return copy;
        });
        setActiveSetRemaining((prev) => {
          const copy = { ...prev };
          delete copy[setId];
          return copy;
        });
        showToast('Set timer finished!', 'success');
        playRealBellSound();
        triggerHaptic('double');
      } else {
        setActiveSetRemaining((prev) => ({ ...prev, [setId]: remaining }));
      }
    }, 1000);

    setActiveSetTimers((prev) => ({ ...prev, [setId]: interval }));
  };

  // Stats calculation
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  activeLogs.forEach((log) => {
    const trackingType = getTrackingType(log.exerciseName);
    log.sets.forEach((s) => {
      totalSets += 1;
      const r = parseInt(`${s.reps}`) || 0;
      const w = parseInt(`${s.weight}`) || 0;
      if (trackingType === 'reps_weight') {
        totalVolume += r * w;
        totalReps += r;
      }
    });
  });

  const downloadAppOffline = () => {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Lumina_OS.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('App HTML Downloaded Offline!');
  };

  const shareWorkout = () => {
    if (onOpenShareGoalCard) {
      onOpenShareGoalCard();
      return;
    }
    if (activeLogs.length === 0) {
      showToast('No exercises in active log!', 'error');
      return;
    }
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify(activeLogs)));
      const shareText = `O1FC Workout:\no1fc://import?data=${payload}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          showToast('Workout share code copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Workout encoded. Ready to share!', 'success');
        });
      } else {
        showToast('Workout encoded. Ready to share!', 'success');
      }
    } catch {
      showToast('Could not generate share code', 'error');
    }
  };

  const importWorkout = () => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((code) => {
        if (!code) {
          showToast('Clipboard is empty. Copy workout code first.', 'error');
          return;
        }
        try {
          let jsonStr = code.trim();
          if (jsonStr.includes('o1fc://import?data=')) {
            jsonStr = decodeURIComponent(atob(jsonStr.split('o1fc://import?data=')[1]));
          } else if (!jsonStr.startsWith('[')) {
            jsonStr = decodeURIComponent(atob(jsonStr));
          }
          const importedLogs = JSON.parse(jsonStr);
          if (Array.isArray(importedLogs) && importedLogs.length > 0) {
            setActiveLogs(importedLogs);
            showToast('Workout imported from clipboard!', 'success');
          } else {
            showToast('No valid workout logs found in clipboard', 'error');
          }
        } catch {
          showToast('Invalid workout share code in clipboard', 'error');
        }
      }).catch(() => {
        showToast('Clipboard access unavailable. Grant permission or use QR scan.', 'error');
      });
    } else {
      showToast('Clipboard read not supported on this browser', 'error');
    }
  };

  const formatRestTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const liftCategories = LIFT_CATEGORIES;
  const sportsCategories = SPORTS_CATEGORIES;
  const recoveryCategories = RECOVERY_CATEGORIES;

  const currentCategoryList =
    categoryTypeGroup === 'weights'
      ? liftCategories
      : categoryTypeGroup === 'sports'
      ? sportsCategories
      : recoveryCategories;

  const filteredCategories = currentCategoryList.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const [activeFilterTag, setActiveFilterTag] = useState<string>('All');

  const mergedExerciseDb = useMemo(() => {
    const db: Record<string, string[]> = { ...EXERCISE_DATABASE };
    for (const cat in customExerciseDb) {
      const customList = customExerciseDb[cat] || [];
      const baseList = db[cat] || [];
      db[cat] = Array.from(new Set([...customList, ...baseList]));
    }
    return db;
  }, [customExerciseDb]);

  const { availableExercises, isFallbackSearch } = useMemo(() => {
    const q = exerciseSearchQuery.toLowerCase().trim();
    const results: { name: string; category: string }[] = [];

    // Search globally across all categories when typing; otherwise stay in selected category
    const categoriesToScan = q.length > 0
      ? Object.keys(mergedExerciseDb)
      : [selectedCategory];

    for (const cat of categoriesToScan) {
      const list = mergedExerciseDb[cat] || [];
      for (const ex of list) {
        if (!q || ex.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
          if (activeFilterTag !== 'All') {
            const tagLower = activeFilterTag.toLowerCase();
            if (!ex.toLowerCase().includes(tagLower)) continue;
          }
          results.push({ name: ex, category: cat });
        }
      }
    }

    const seen = new Set<string>();
    const filtered = results.filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Smart fallback: If 0 results were found with equipment filter active while searching,
    // show matching exercises across all equipment so the athlete is never stuck
    if (filtered.length === 0 && q.length > 0 && activeFilterTag !== 'All') {
      const fallbackList: { name: string; category: string }[] = [];
      for (const cat of Object.keys(mergedExerciseDb)) {
        const list = mergedExerciseDb[cat] || [];
        for (const ex of list) {
          if (ex.toLowerCase().includes(q) || cat.toLowerCase().includes(q)) {
            fallbackList.push({ name: ex, category: cat });
          }
        }
      }
      const fallbackSeen = new Set<string>();
      const deduplicatedFallback = fallbackList.filter((item) => {
        const key = item.name.toLowerCase();
        if (fallbackSeen.has(key)) return false;
        fallbackSeen.add(key);
        return true;
      });

      if (deduplicatedFallback.length > 0) {
        return { availableExercises: deduplicatedFallback, isFallbackSearch: true };
      }
    }

    return { availableExercises: filtered, isFallbackSearch: false };
  }, [mergedExerciseDb, selectedCategory, exerciseSearchQuery, activeFilterTag]);

  const categoryExerciseCount = mergedExerciseDb[selectedCategory]?.length || 0;

  return (
    <div className="space-y-2.5 block tab-enter pb-2">
      {/* Dual Lane Launcher: Intel Coach + My Coach */}
      <DualLaneLauncher
        onLoadExercises={handleLoadExerciseBatch}
        showToast={showToast}
        onUpgrade={onOpenPayPlan}
        currentUserEmail={currentUserEmail}
      />

      {/* Exercise Database Main Menu & Dropdown Hub */}
      <div className="glass-premium rounded-2xl p-3 sm:p-3.5 space-y-2.5 card-lift">
        {/* Header: Title + Routine Swapper */}
        <div className="flex justify-between items-center">
          <h2 className="text-[13px] font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Exercise Hub
          </h2>
          <button
            onClick={onOpenRoutineSwapper}
            className="h-7 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 rounded-lg transition-all border border-zinc-200 dark:border-zinc-700 active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            Routine Swapper
          </button>
        </div>

        {/* Category Tabs: Lift | Sports | Recovery */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-white/[0.04] rounded-lg p-0.5">
          {([
            { key: 'weights' as const, label: 'Lift', categories: liftCategories, icon: Dumbbell, color: '#C4121A' },
            { key: 'sports' as const, label: 'Sports', categories: sportsCategories, icon: Flame, color: '#F59E0B' },
            { key: 'recovery' as const, label: 'Recovery', categories: recoveryCategories, icon: Activity, color: '#8B5CF6' },
          ] as const).map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  haptic.tap();
                  setCategoryTypeGroup(cat.key);
                  if (!cat.categories.includes(selectedCategory)) {
                    setSelectedCategory(cat.categories[0]);
                  }
                  setOpenDropdown(openDropdown === cat.key ? null : cat.key);
                }}
                className={`flex-1 h-8 rounded-md text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  categoryTypeGroup === cat.key
                    ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-400 dark:text-white/35 hover:text-zinc-600 dark:hover:text-white/55'
                }`}
              >
                <Icon className="w-3 h-3" style={{ color: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdown Menu Content (Appears when any menu is open) */}
        {openDropdown !== null && (
          <div className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 animate-fadeIn">
            {/* Sub-Category Selector Pills with Count Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {currentCategoryList.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = mergedExerciseDb[cat]?.length || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      haptic.tap();
                      setSelectedCategory(cat);
                      setExerciseSearchQuery('');
                      setActiveFilterTag('All');
                    }}
                    className={`whitespace-nowrap h-8 px-3 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EA4335] text-white border-[#EA4335] shadow-xs'
                        : 'bg-zinc-100/80 dark:bg-white/[0.05] text-zinc-700 dark:text-white/70 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] font-semibold opacity-60 ml-0.5 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Exercises List Container */}
            <div className="space-y-2 pt-0.5">
              {/* Full-width Mobile-Optimized Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    exerciseSearchQuery.length > 0
                      ? 'Search all 2,000+ exercises...'
                      : `Search ${selectedCategory} (${categoryExerciseCount} exercises)...`
                  }
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  className="w-full h-9 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl pl-9 pr-9 text-xs font-medium text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-[#EA4335] dark:focus:border-[#EA4335] focus:ring-1 focus:ring-[#EA4335]/20 transition-all"
                />
                {exerciseSearchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExerciseSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 active:scale-90 transition-all cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* Quick Equipment Tag Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(categoryTypeGroup === 'weights'
                  ? ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Push-up', 'Pull-up', 'Squat', 'Deadlift']
                  : categoryTypeGroup === 'sports'
                  ? ['All', 'Drill', 'Sprint', 'Rounds', 'Sparring', 'Interval', 'Match']
                  : ['All', 'Breath', 'Stretch', 'Mobility', 'Sauna', 'Cold', 'Massage', 'Rest']
                ).map((tag) => {
                  const isTagActive = activeFilterTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        haptic.tap();
                        setActiveFilterTag(isTagActive && tag !== 'All' ? 'All' : tag);
                      }}
                      className={`h-7 px-3 rounded-lg text-xs font-semibold shrink-0 transition-all border flex items-center gap-1 whitespace-nowrap leading-none cursor-pointer active:scale-95 ${
                        isTagActive
                          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white font-bold shadow-xs'
                          : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>{tag}</span>
                      {isTagActive && tag !== 'All' && (
                        <X className="w-2.5 h-2.5 opacity-70 hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Exercise Banner */}
              {exerciseSearchQuery.trim().length > 0 && (
                <button
                  onClick={() => handleAddExercisePermanently(exerciseSearchQuery, selectedCategory)}
                  className="w-full py-1.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-[11px] flex items-center justify-between transition-all hover:border-[#C4121A] dark:hover:border-[#D91F28] active:scale-[0.98] cursor-pointer"
                >
                  <span className="truncate pr-2 font-medium">
                    + Add <strong className="font-bold text-[#C4121A] dark:text-[#D91F28]">"{exerciseSearchQuery.trim()}"</strong> to {selectedCategory}
                  </span>
                  <span className="text-[9px] font-bold bg-[#C4121A] dark:bg-[#D91F28] text-white px-2 py-0.5 rounded-md shrink-0">
                    Save
                  </span>
                </button>
              )}

              {/* Category Info Header & Filter Alerts */}
              <div className="flex justify-between items-center px-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <span>
                  {exerciseSearchQuery.trim().length > 0
                    ? `Results (${availableExercises.length})`
                    : `${selectedCategory} (${availableExercises.length} exercises)`}
                </span>
                {isFallbackSearch ? (
                  <button
                    onClick={() => setActiveFilterTag('All')}
                    className="text-[#C4121A] dark:text-[#D91F28] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Showing all equipment (0 matches for {activeFilterTag}) • Reset
                  </button>
                ) : activeFilterTag !== 'All' ? (
                  <button
                    onClick={() => setActiveFilterTag('All')}
                    className="text-[#C4121A] dark:text-[#D91F28] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Filtered by "{activeFilterTag}" <X className="w-2.5 h-2.5" />
                  </button>
                ) : null}
              </div>

              {/* Scrollable Exercises List */}
              <div className="overflow-y-auto max-h-72 space-y-1.5 custom-scrollbar pr-0.5 transition-all">
                {availableExercises.length > 0 ? (
                  availableExercises.map((item) => (
                    <div
                      key={`${item.category}-${item.name}`}
                      className="flex justify-between items-center px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.04] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[12px] font-bold text-zinc-900 dark:text-white truncate">
                          {item.name}
                        </span>
                        {exerciseSearchQuery.trim().length > 0 && (
                          <span className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddExercise(item.name)}
                        className="shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[#C4121A] dark:text-[#D91F28] hover:bg-red-500/10 active:scale-95 transition-all font-bold text-[11px] cursor-pointer"
                        title={`Add ${item.name}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      No exercises matched &quot;{exerciseSearchQuery || activeFilterTag}&quot;
                    </div>
                    {exerciseSearchQuery.trim().length > 0 && (
                      <button
                        onClick={() => handleAddExercisePermanently(exerciseSearchQuery, selectedCategory)}
                        className="text-xs font-bold text-white bg-[#C4121A] dark:bg-[#D91F28] hover:bg-[#B8121A] px-4 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Save &quot;{exerciseSearchQuery.trim()}&quot; to {selectedCategory}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Redesigned Bottom Section: Accordion Workout Log ─── */}
      <div className="pt-3 relative z-[20] space-y-3">

        {/* Compact Active Log Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-[#000000] dark:text-white">
              Active Log
            </h2>
            <span className="text-[11px] sm:text-[12px] font-medium text-[#848785] dark:text-gray-500">
              {activeLogs.length} {activeLogs.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
          <div className="flex gap-1.5 font-mono items-center">
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide uppercase bg-white dark:bg-[#14171F] text-[#000000] dark:text-gray-200 px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] dark:border-white/10">
              V {totalVolume.toLocaleString()}kg
            </span>
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide uppercase bg-white dark:bg-[#14171F] text-[#000000] dark:text-gray-200 px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] dark:border-white/10">
              S {totalSets}
            </span>
            <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide uppercase bg-white dark:bg-[#14171F] text-[#000000] dark:text-gray-200 px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] dark:border-white/10">
              R {totalReps}
            </span>
            {totalVolume > 0 && (
              <button
                onClick={() => setIsVictoryShareOpen(true)}
                className="ml-0.5 w-6 h-6 rounded-full bg-zinc-500/15 border border-stone-500/30 text-zinc-500 dark:text-stone-400 hover:bg-zinc-500/25 transition-all active:scale-90 flex items-center justify-center cursor-pointer"
                title="Share Victory"
              >
                <Share2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Accordion Exercise List */}
        {activeLogs.length === 0 ? (
          <div className="glass-premium rounded-2xl text-center p-4 text-sm font-medium text-[#848785] dark:text-gray-400 border border-dashed border-[rgba(0,0,0,0.08)] dark:border-white/10">
            No exercises added yet. Select from the database above.
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeLogs.map((log, logIdx) => {
              const trackingType = getTrackingType(log.exerciseName);
              let col1Label = 'REPS', col2Label = 'KG';
              let dial1Label = 'Reps (0-100)', dial2Label = 'Weight (0-500kg)';
              let d1Max = 100, d2Max = 500;

              if (trackingType === 'reps_time') {
                col1Label = 'REPS'; col2Label = 'TIME';
                dial1Label = 'Reps (0-100)'; dial2Label = 'Timer (0-600s)';
                d1Max = 100; d2Max = 600;
              } else if (trackingType === 'time_dist') {
                col1Label = 'TIME'; col2Label = 'DIST';
                dial1Label = 'Timer (0-600s)'; dial2Label = 'Distance';
                d1Max = 600; d2Max = 50000;
              }

              const isTimedExercise = trackingType === 'reps_time' || trackingType === 'time_dist';
              const isExpanded = expandedExerciseId === log.id;
              const exerciseHistory = getExerciseHistoryStats(log.exerciseName, currentUserEmail);

              return (
                <div
                  key={log.id}
                  className={`surface-flat rounded-xl overflow-hidden animate-slideUpFade transition-all duration-200 ${
                    isExpanded ? 'ring-1 ring-red-700/30 shadow-sm' : ''
                  }`}
                >
                  {/* Collapsed Summary Row — 44px */}
                  <button
                    onClick={() => setExpandedExerciseId(isExpanded ? null : log.id)}
                    className="w-full h-11 flex items-center gap-2.5 px-3 text-left cursor-pointer transition-colors hover:bg-[#F2F2F7] dark:hover:bg-white/5"
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-[#848785] dark:text-gray-400 shrink-0" />
                    <span className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#000000] dark:text-white truncate flex-1">
                      {log.exerciseName}
                    </span>
                    {exerciseHistory.allTimePR1RM > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shrink-0 flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5" /> PR {exerciseHistory.allTimePR1RM}kg
                      </span>
                    )}
                    <span className="text-[11px] sm:text-[12px] font-medium text-[#848785] dark:text-gray-500 whitespace-nowrap">
                      {log.sets.length} {log.sets.length === 1 ? 'set' : 'sets'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#848785] dark:text-gray-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Set Table */}
                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fadeIn">

                      {/* Column Headers */}
                      <div className="grid grid-cols-[20px_3fr_3fr_2fr_20px] gap-1 mb-0.5 mt-0.5">
                        <div className="text-[9px] font-bold tracking-widest uppercase text-[#848785] dark:text-gray-500 text-center">Set</div>
                        <div className="text-[9px] font-bold tracking-widest uppercase text-[#848785] dark:text-gray-500 text-center">{col1Label}</div>
                        <div className="text-[9px] font-bold tracking-widest uppercase text-[#848785] dark:text-gray-500 text-center">{col2Label}</div>
                        <div className="text-[9px] font-bold tracking-widest uppercase text-[#848785] dark:text-gray-500 text-center">RPE</div>
                        <div />
                      </div>

                      {/* Set Rows */}
                      <div className="space-y-1.5">
                        {log.sets.map((s, idx) => {
                          const isTimerActive = !!activeSetTimers[s.id];
                          const secondsRemaining = activeSetRemaining[s.id];
                          const setComplete = !(!s.reps || String(s.reps) === '0' || String(s.reps) === '0s') && (!(!s.weight || s.weight === 0));
                          const numWeight = typeof s.weight === 'number' ? s.weight : parseFloat(String(s.weight)) || 0;
                          const numReps = typeof s.reps === 'number' ? s.reps : parseInt(String(s.reps)) || 0;
                          const progression = (!isTimedExercise && (numWeight > 0 || numReps > 0))
                            ? evaluateSetProgression(log.exerciseName, numWeight, numReps, log.sets, currentUserEmail)
                            : null;

                          return (
                            <div key={s.id} className="flex flex-col gap-0.5">
                              <div className="set-row-flat">
                                <div className={`text-[11px] font-mono font-semibold text-center ${setComplete ? 'text-red-700 dark:text-red-400' : 'text-[#000000] dark:text-white'}`}>
                                  {setComplete ? <Check className="w-2.5 h-2.5 mx-auto" /> : idx + 1}
                                </div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    readOnly
                                    value={s.reps}
                                    onClick={() =>
                                      onOpenDial(dial1Label, d1Max, parseInt(`${s.reps}`) || 0, (val) => {
                                        handleUpdateSetReps(log, s.id, val);
                                      })
                                    }
                                    className={`input-pill`}
                                  />
                                </div>
                                <div className="relative flex items-center">
                                  {isTimedExercise ? (
                                    <div className={`h-8 w-full flex items-center gap-1 px-2 rounded-lg border text-center font-mono text-xs font-semibold transition-all ${
                                      isTimerActive
                                        ? 'bg-red-500/10 border-red-500/40 text-red-500 dark:text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.12)]'
                                        : 'bg-[#F2F2F7] border-[rgba(0,0,0,0.08)] text-[#000000] dark:bg-zinc-900/80 dark:border-zinc-800 dark:text-white'
                                    }`}>
                                      <span
                                        className="flex-1 text-center text-[11px] font-mono cursor-pointer"
                                        onClick={() =>
                                          onOpenDial(dial2Label, d2Max, s.weight, (val) => {
                                            handleUpdateSetWeight(log, s.id, val);
                                          })
                                        }
                                      >
                                        {isTimerActive ? `${secondsRemaining ?? 0}s` : (s.weight > 0 ? `${s.weight}s` : '0s')}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const timeVal = parseInt(`${s.weight}`) || parseInt(`${s.reps}`) || 60;
                                          toggleSetTimer(s.id, timeVal);
                                        }}
                                        className={`w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors shrink-0 cursor-pointer ${
                                          isTimerActive ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
                                        }`}
                                      >
                                        {isTimerActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                                      </button>
                                      {isTimerActive && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            toggleSetTimer(s.id, 0);
                                            handleUpdateSetWeight(log, s.id, 0);
                                          }}
                                          className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors shrink-0 cursor-pointer"
                                        >
                                          <Square className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="relative w-full flex items-center">
                                      <input
                                        type="text"
                                        readOnly
                                        value={s.weight}
                                        onClick={() =>
                                          onOpenDial(dial2Label, d2Max, s.weight, (val) => {
                                            handleUpdateSetWeight(log, s.id, val);
                                          })
                                        }
                                        className="input-pill pr-6 text-center"
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          haptic.tap();
                                          setPlateMathModal({
                                            isOpen: true,
                                            exerciseName: log.exerciseName,
                                            weight: Number(s.weight) || 60,
                                            logId: log.id,
                                            setId: s.id,
                                          });
                                        }}
                                        title="1-Tap Olympic Barbell Plate Calculator"
                                        className="absolute right-1 w-5 h-5 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                      >
                                        <Disc className="w-3 h-3 stroke-[2.2]" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    readOnly
                                    value={s.rpe}
                                    onClick={() =>
                                      onOpenDial('RPE', 10, s.rpe, (val) => {
                                        recordSmartInput('exercise_rpe_' + log.exerciseName, val);
                                        haptic.thump();
                                        setActiveLogs((prev) =>
                                          prev.map((l) => {
                                            if (l.id !== log.id) return l;
                                            return { ...l, sets: l.sets.map((set) => set.id === s.id ? { ...set, rpe: val } : set) };
                                          })
                                        );
                                      })
                                    }
                                    className="input-pill"
                                  />
                                </div>
                                <button
                                  onClick={() => handleDeleteSet(log.id, s.id)}
                                  className="delete-cell"
                                  title="Delete & Trigger Rest"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              {/* Real-Time Live PR Intelligence & Auto-Progressive Overload Telemetry */}
                              {progression && (progression.isNewPR || progression.current1RM > 0) && (
                                <div className="flex items-center justify-between px-2 py-0.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-md text-[9.5px] font-mono select-none">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {progression.isNewPR ? (
                                      <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                        <Trophy className="w-2.5 h-2.5 stroke-[2.5]" />
                                        +{progression.prDiff} kg PR Breakthrough
                                      </span>
                                    ) : progression.statusBadge.variant === 'gain' ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#3B624E] dark:text-[#88B29C] bg-[#3B624E]/10 px-1.5 py-0.5 rounded border border-[#3B624E]/20">
                                        <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
                                        {progression.statusBadge.text}
                                      </span>
                                    ) : progression.statusBadge.variant === 'match' ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                        Matches PR ({progression.allTimePR1RM}kg)
                                      </span>
                                    ) : (
                                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                        {progression.historySetsCount > 0 ? `${progression.historySetsCount} logged sets` : 'Standard set'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right text-zinc-500 dark:text-zinc-400 whitespace-nowrap pl-2">
                                    <span className="text-zinc-400 dark:text-zinc-500">1RM: </span>
                                    <span className={`font-bold ${progression.isNewPR ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                      {progression.current1RM} kg
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Seconds Bar (Timed Exercises Only) */}
                      {isTimedExercise && (
                        <div className="mt-1.5 pt-1.5 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 flex items-center gap-1 overflow-x-auto scrollbar-hide">
                          <span className="text-[9px] font-bold tracking-wide uppercase text-[#848785] whitespace-nowrap">⏱</span>
                          {[30, 60, 90, 120].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                setActiveLogs((prev) => prev.map((l) => l.id !== log.id ? l : { ...l, sets: l.sets.map((set) => ({ ...set, weight: sec })) }));
                                showToast(`Timer set to ${sec}s`);
                              }}
                              className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F2F2F7] dark:bg-white/5 dark:hover:bg-white/10 text-[#000000] dark:text-white border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-[11px] font-mono font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      )}

                      {/* In-Flow Action Row: Add Set + Voice Log + Delete Exercise */}
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          onClick={() => handleAddSet(log.id)}
                          className="flex-1 h-7 rounded-md border border-dashed border-red-700/40 text-red-700 dark:text-red-400 hover:bg-red-700/5 font-medium text-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Set
                        </button>

                        <button
                          onClick={() => { handleDeleteExerciseCard(log.id); if (expandedExerciseId === log.id) setExpandedExerciseId(null); }}
                          className="h-7 w-7 rounded-md border border-[#EA4335]/30 text-[#EA4335] hover:bg-[#EA4335]/10 text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                          title="Delete Exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>


                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── OFC Microcycle Kinetic Progress Barometer ── */}
        <div className="mt-2">
          <WeeklyProgressChart
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            weeklySchedule={weeklySchedule}
            currentDayVolume={totalVolume}
            currentDaySets={totalSets}
          />
        </div>



        {/* ── In-Flow Finish & Save Button ── */}
        {activeLogs.length > 0 && (
          <button
            onClick={onOpenCommitModal}
            className="w-full h-11 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-[13px] shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <Save className="w-4 h-4" />
            Finish &amp; Save Session
          </button>
        )}

        {/* ── Weekly Report Card Strip ── */}
        <button
          onClick={() => setIsReportCardOpen(true)}
          className="w-full group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#13161A] border border-slate-200 dark:border-white/10 hover:border-[#4285F4]/40 dark:hover:border-[#4285F4]/40 transition-all cursor-pointer active:scale-[0.98] mt-1 shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#4285F4]" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">Weekly Report Card</div>
              <div className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 truncate">Grade your week -- training, nutrition, sleep & steps</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0" />
        </button>

        {/* ── Intel Coach Insights Strip ── */}
        {onOpenAIInsights && (
          <button
            onClick={onOpenAIInsights}
            className="w-full group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-[#13161A] border border-slate-200 dark:border-white/10 hover:border-[#FBBC05]/40 dark:hover:border-[#FBBC05]/40 transition-all cursor-pointer active:scale-[0.98] mt-1 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#FBBC05]/10 border border-[#FBBC05]/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#FBBC05]" />
              </div>
              <div className="min-w-0 text-left">
                <div className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">Intel Coach Intelligence</div>
                <div className="text-[9px] font-mono text-slate-500 dark:text-zinc-400 truncate">Session analysis, fuel status & recovery insights</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0" />
          </button>
        )}
      </div>



      <WeeklyReportCardModal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        userEmail={currentUserEmail}
        showToast={showToast}
      />

      {plateMathModal && (
        <PlateMathModal
          isOpen={plateMathModal.isOpen}
          onClose={() => setPlateMathModal(null)}
          exerciseName={plateMathModal.exerciseName}
          initialWeight={plateMathModal.weight}
          onApplyWeight={(newWeight) => {
            const targetLog = activeLogs.find((l) => l.id === plateMathModal.logId);
            if (targetLog) {
              handleUpdateSetWeight(targetLog, plateMathModal.setId, newWeight);
            }
            setPlateMathModal(null);
            showToast(`Loaded ${newWeight}kg onto barbell sleeve`, 'success');
          }}
        />
      )}

      <VictoryShareModal
        isOpen={isVictoryShareOpen}
        onClose={() => setIsVictoryShareOpen(false)}
        data={{
          routineName: weeklySchedule[selectedDay] || 'Today\'s Workout',
          totalVolumeKg: totalVolume,
          completedExercises: activeLogs.length,
          athleteHandle: getSocialHandle('instagram', loadSocialProfiles()) || undefined,
        }}
        showToast={showToast}
      />
    </div>
  );
};
