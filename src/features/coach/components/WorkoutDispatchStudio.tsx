import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Sparkles,
  Search,
  Check,
  Plus,
  Trash2,
  Bookmark,
  Send,
  SlidersHorizontal,
  CheckCircle2,
  Users,
  RotateCcw,
  X,
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { Athlete, fetchCoachClients, isValidUuid } from '../services/coachService';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { tactileEngine } from '../../../services/tactileEngine';
import {
  UNIFIED_DISPATCH_CATALOG,
} from '../data/unifiedDispatchCatalog';
import type { DispatchCatalogExercise } from '../data/dispatchExerciseCatalog';
import {
  synthesizeDailyBlueprint,
  AthleticVector,
  SessionDuration,
  FacilityGear,
  IntensityMode,
  SynthesizedBlueprint,
} from '../data/dispatchBlueprintSynthesizer';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';

export interface WorkoutDispatchStudioProps {
  isOpen?: boolean;
  onClose: () => void;
  athleteId?: string;
  targetAthlete?: Athlete | null;
  roster?: Athlete[];
  onDispatched?: (title: string, athleteName: string) => void;
}

const NO_ROSTER: Athlete[] = [];

function mergeRoster(...groups: Athlete[][]): Athlete[] {
  const seen = new Set<string>();
  return groups.flat().filter((row) => {
    const key = row.client_id || row.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const RECOMMENDED_CUE_CHIPS = [
  'Retract scapulae',
  '3s eccentric tempo',
  'Explode out of hole',
  '360 core brace',
  '1s peak squeeze',
  'Pinch lats down',
  'Drive through heels',
  'Spine neutral, ribs down',
  'Full lockout extension',
  'Reset deadstop on floor',
];

export interface StackExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number;
  restSecs: number;
}

export interface StackExercise {
  id: string;
  catalogId?: string;
  name: string;
  muscle: string;
  category: string;
  cue: string;
  sets: StackExerciseSet[];
  expanded?: boolean;
}

const VECTOR_PILLS: AthleticVector[] = [
  'Push Alpha',
  'Push Beta',
  'Pull Alpha',
  'Pull Beta',
  'Legs Alpha',
  'Legs Beta',
  'Upper Body',
  'Lower Body',
  'Hyrox/Metcon',
  'Speed & COD',
  'Strength S&C',
  'Bio-Recovery',
];

const MUSCLE_FILTER_CHIPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Core',
  'Calves',
  'Olympic',
  'Hyrox',
  'Sports',
  'Recovery',
] as const;

export const WorkoutDispatchStudio: React.FC<WorkoutDispatchStudioProps> = ({
  isOpen = true,
  onClose,
  athleteId,
  targetAthlete = null,
  roster = NO_ROSTER,
  onDispatched,
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'library' | 'blueprints'>('stack');

  // Client Selection (Supports Single & Multiple Athletes)
  const lockedId = targetAthlete?.id || athleteId || '';
  const [athletes, setAthletes] = useState<Athlete[]>(() => mergeRoster(targetAthlete ? [targetAthlete] : [], roster));
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>(
    lockedId ? [lockedId] : roster.map((row) => row.id)
  );
  const [coachCue, setCoachCue] = useState('');
  const [isAthletePickerOpen, setIsAthletePickerOpen] = useState(false);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');

  // Active Stack (Programmed Workout)
  const [workoutTitle, setWorkoutTitle] = useState('Custom Training Protocol');
  const [workoutDate, setWorkoutDate] = useState('Today');
  const [workoutFocus, setWorkoutFocus] = useState('Hypertrophy (8-12)');
  const [isEditingSetup, setIsEditingSetup] = useState(false);

  // Initial Programmed Exercises (Empty in genuine live mode)
  const [stack, setStack] = useState<StackExercise[]>([]);

  // Library State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Compound' | 'Isolation' | 'Functional'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Blueprints Synthesizer State
  const [selectedVector, setSelectedVector] = useState<AthleticVector>('Push Alpha');
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>('45m');
  const [selectedGear, setSelectedGear] = useState<FacilityGear>('Full Gym');
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityMode>('Progressive RPE');
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<string | null>(null);

  // Fetch athletes
  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    fetchCoachClients().then((res) => {
      if (!live) return;
      const merged = mergeRoster(targetAthlete ? [targetAthlete] : [], roster, res || []);
      setAthletes(merged);
      if (lockedId) {
        const match = merged.find((row) => row.id === lockedId || row.client_id === lockedId);
        if (match) setSelectedAthleteIds([match.id]);
      } else {
        setSelectedAthleteIds((prev) => (prev.length ? prev : merged.map((row) => row.id)));
      }
    });
    return () => {
      live = false;
    };
  }, [isOpen, lockedId, targetAthlete, roster]);

  // Selected athletes objects
  const selectedAthletes = useMemo(() => {
    return athletes.filter((a) => selectedAthleteIds.includes(a.id));
  }, [athletes, selectedAthleteIds]);

  const currentAthlete: Athlete | undefined = selectedAthletes[0] || athletes[0];

  const filteredAthletes = useMemo(() => {
    if (!athleteSearchQuery.trim()) return athletes;
    const q = athleteSearchQuery.toLowerCase();
    return athletes.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.handle.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [athletes, athleteSearchQuery]);

  const toggleSelectAthlete = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedAthleteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllAthletes = () => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedAthleteIds(athletes.map((a) => a.id));
  };

  const handleClearAthleteSelection = () => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedAthleteIds([]);
  };

  // Synthesize blueprint dynamically
  const synthesizedBlueprint: SynthesizedBlueprint = useMemo(() => {
    return synthesizeDailyBlueprint(selectedVector, selectedDuration, selectedGear, selectedIntensity, shuffleSeed);
  }, [selectedVector, selectedDuration, selectedGear, selectedIntensity, shuffleSeed]);

  // Telemetry Calculations
  const telemetry = useMemo(() => {
    let totalSets = 0;
    let totalTonnageKg = 0;
    let muscleCounts: Record<string, number> = {};

    stack.forEach((ex) => {
      totalSets += ex.sets.length;
      ex.sets.forEach((s) => {
        totalTonnageKg += s.weightKg * s.reps;
      });

      let group = 'Other';
      if (ex.muscle.toLowerCase().includes('chest') || ex.category.includes('Push')) group = 'Chest';
      else if (ex.muscle.toLowerCase().includes('shoulder') || ex.category.includes('Shoulders')) group = 'Shoulders';
      else if (ex.muscle.toLowerCase().includes('back') || ex.category.includes('Pull')) group = 'Back';
      else if (ex.muscle.toLowerCase().includes('leg') || ex.category.includes('Legs')) group = 'Legs';
      else if (ex.muscle.toLowerCase().includes('arm') || ex.category.includes('Arms')) group = 'Arms';

      muscleCounts[group] = (muscleCounts[group] || 0) + ex.sets.length;
    });

    const estTimeMins = totalSets > 0 ? Math.round(totalSets * 2.3) : 0;
    const volFormatted = (totalTonnageKg / 1000).toFixed(1);

    const muscleDistribution = Object.entries(muscleCounts)
      .map(([muscle, count]) => ({
        muscle,
        percentage: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      sets: totalSets,
      estTime: estTimeMins,
      volumeTons: volFormatted,
      muscleDistribution,
    };
  }, [stack]);

  // Catalog filtered items
  const filteredCatalog = useMemo(() => {
    return UNIFIED_DISPATCH_CATALOG.filter((ex) => {
      const hay = `${ex.name} ${ex.muscleTarget} ${ex.equipment} ${ex.category}`.toLowerCase();
      const matchSearch = !searchQuery || hay.includes(searchQuery.toLowerCase());
      const matchType = selectedTypeFilter === 'All' || ex.type === selectedTypeFilter;
      const matchCat =
        selectedCategory === 'All' ||
        hay.includes(selectedCategory.toLowerCase());
      return matchSearch && matchType && matchCat;
    });
  }, [searchQuery, selectedTypeFilter, selectedCategory]);

  const handleToggleExpandExercise = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
    );
  };

  const handleRemoveExercise = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddSet = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        const lastSet = e.sets[e.sets.length - 1];
        const newSet: StackExerciseSet = {
          id: `set-${Date.now()}-${e.sets.length}`,
          setNumber: e.sets.length + 1,
          weightKg: lastSet ? lastSet.weightKg : 60,
          reps: lastSet ? lastSet.reps : 8,
          rpe: lastSet ? lastSet.rpe : 8.5,
          restSecs: 90,
        };
        return { ...e, sets: [...e.sets, newSet], expanded: true };
      })
    );
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        const updatedSets = e.sets
          .filter((s) => s.id !== setId)
          .map((s, index) => ({ ...s, setNumber: index + 1 }));
        return { ...e, sets: updatedSets };
      })
    );
  };

  const handleUpdateExerciseCue = (exerciseId: string, newCue: string) => {
    setStack((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, cue: newCue } : e))
    );
  };

  const handleAppendCueRecommendation = (exerciseId: string, chipText: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        const currentCue = e.cue.trim();
        const separator = currentCue.length > 0 ? (currentCue.endsWith('.') ? ' ' : '. ') : '';
        return { ...e, cue: `${currentCue}${separator}${chipText}.` };
      })
    );
  };

  const handleResetCue = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setStack((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        const catalogMatch = UNIFIED_DISPATCH_CATALOG.find((c) => c.name === e.name);
        return {
          ...e,
          cue: catalogMatch?.cue || 'Maintain strict biomechanical stability and controlled eccentric tempo.',
        };
      })
    );
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: keyof StackExerciseSet,
    value: number
  ) => {
    setStack((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        };
      })
    );
  };

  const handleAddExerciseFromCatalog = (catEx: DispatchCatalogExercise) => {
    tactileEngine.triggerImpactPulse();
    const defaultReps =
      typeof catEx.defaultReps === 'number'
        ? catEx.defaultReps
        : parseInt(String(catEx.defaultReps), 10) || 10;
    const numSets = catEx.defaultSets || 3;

    const newEx: StackExercise = {
      id: `stack-${Date.now()}`,
      catalogId: catEx.id,
      name: catEx.name,
      muscle: catEx.muscleTarget,
      category: catEx.category,
      cue: catEx.cue || 'Maintain biomechanical stability.',
      expanded: false,
      sets: Array.from({ length: numSets }, (_, sIdx) => ({
        id: `s-${Date.now()}-${sIdx}`,
        setNumber: sIdx + 1,
        weightKg: catEx.defaultWeightKg || 20,
        reps: defaultReps,
        rpe: catEx.defaultRpe || 8.5,
        restSecs: 75,
      })),
    };
    setStack((prev) => [...prev, newEx]);
    setDispatchSuccessToast(`Added ${catEx.name} to Stack`);
    setTimeout(() => setDispatchSuccessToast(null), 1500);
  };

  const handleLoadBlueprintToStack = (bp: SynthesizedBlueprint) => {
    tactileEngine.triggerImpactPulse();
    const newStack: StackExercise[] = bp.exercises.map((ex, idx) => {
      const parsedReps = parseInt(ex.reps.split('-')[0], 10) || 8;
      const parsedRpe = parseFloat(ex.rpe.split('-')[0]) || 8.5;
      return {
        id: `stack-bp-${idx}-${Date.now()}`,
        name: ex.name,
        muscle: ex.muscle,
        category: bp.vector,
        cue: ex.cue,
        expanded: false,
        sets: Array.from({ length: ex.sets }, (_, sIdx) => ({
          id: `set-${Date.now()}-${idx}-${sIdx}`,
          setNumber: sIdx + 1,
          weightKg: ex.targetWeightKg || 50,
          reps: parsedReps,
          rpe: parsedRpe,
          restSecs: 75,
        })),
      };
    });

    setStack(newStack);
    setWorkoutTitle(bp.title);
    setWorkoutFocus(`${bp.intensityMode} • ${bp.durationMins}m`);
    setActiveTab('stack');
  };

  const handleDispatchWorkout = async () => {
    if (stack.length === 0 || isSubmitting) return;
    if (selectedAthleteIds.length === 0) {
      setDispatchSuccessToast('Please select at least 1 athlete to dispatch.');
      setTimeout(() => setDispatchSuccessToast(null), 2000);
      return;
    }

    setIsSubmitting(true);
    tactileEngine.playPRCelebration();

    try {
      const targetAthletes = athletes.filter((a) => selectedAthleteIds.includes(a.id));
      const targetNames = targetAthletes.map((a) => a.name).join(', ');

      const coachId = (await getAuthenticatedUserId()) || '';
      const cue = coachCue.trim();
      const exercises = stack.map((ex) => ({
        name: ex.name,
        muscle: ex.muscle,
        cue: ex.cue,
        setsCount: ex.sets.length,
        sets: ex.sets,
      }));
      const linked = targetAthletes.filter((athlete) => isValidUuid(athlete.client_id || athlete.id));
      if (linked.length) {
        if (!isValidUuid(coachId)) {
          setIsSubmitting(false);
          setDispatchSuccessToast('Sign in required to dispatch.');
          setTimeout(() => setDispatchSuccessToast(null), 2500);
          return;
        }
        const payloads = linked.map((athlete) => {
          const personId = athlete.client_id || athlete.id;
          return {
            coach_id: coachId,
            client_id: personId,
            athlete_id: personId,
            title: workoutTitle,
            parameters: {
              date: workoutDate,
              focus: workoutFocus,
              coachCue: cue,
              totalSets: telemetry.sets,
              estTime: telemetry.estTime,
              volumeTons: telemetry.volumeTons,
            },
            exercises,
            status: 'pending',
            assigned_date: new Date().toISOString(),
          };
        });
        const { error } = await supabase.from('assigned_workouts').insert(payloads);
        if (error) throw new Error(error.message);
      }
      try {
        localStorage.setItem('o1_assigned_local', JSON.stringify({
          title: workoutTitle,
          coachId,
          cue,
          exercises,
          at: new Date().toISOString(),
        }));
      } catch {
        /* private mode */
      }

      const toastMsg =
        targetAthletes.length > 1
          ? `Dispatched to ${targetAthletes.length} Athletes!`
          : `Dispatched to ${targetAthletes[0]?.name || 'Athlete'}!`;
      setDispatchSuccessToast(toastMsg);
      if (onDispatched) onDispatched(workoutTitle, targetNames);

      setTimeout(() => {
        setIsSubmitting(false);
        setDispatchSuccessToast(null);
        onClose();
      }, 1500);
    } catch (e) {
      setIsSubmitting(false);
      setDispatchSuccessToast(e instanceof Error ? e.message : 'Dispatch failed');
      setTimeout(() => setDispatchSuccessToast(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg h-full sm:h-[94vh] bg-black text-neutral-100 sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-white/[0.07]">
        
        {/* ============================================================== */}
        {/* 1. TOP HEADER & TELEMETRY (Matches Screenshot_20260924_203753_Brave.jpg) */}
        {/* ============================================================== */}
        <div className="p-3 border-b border-white/[0.05] bg-o1-card shrink-0 space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-o1-crimson shrink-0" />
              <h2 className="text-sm font-semibold text-white truncate">
                Workout
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Close Studio"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Telemetry Strip (Sets, Est. Time, Volume, Chest/Shoulder percentages) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1.5 px-3 rounded-2xl bg-o1-card border border-white/[0.07]">
            <div className="flex items-center gap-3.5 text-neutral-400 text-xs">
              <span>Sets: <strong className="text-white font-bold">{telemetry.sets}</strong></span>
              <span>Est. Time: <strong className="text-white font-bold">{telemetry.estTime}m</strong></span>
              <span>Volume: <strong className="text-white font-bold">{Number(telemetry.volumeTons) > 0 ? `${telemetry.volumeTons}k kg` : '--'}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              {telemetry.muscleDistribution.slice(0, 2).map((m) => (
                <span
                  key={m.muscle}
                  className="px-2 py-0.5 rounded-md bg-o1-well border border-white/[0.07] text-[10px] font-semibold text-neutral-300"
                >
                  {m.muscle} <span className="text-o1-crimson font-bold">{m.percentage}%</span>
                </span>
              ))}
            </div>
          </div>

          {/* Sub-Tabs: [Stack (3)], [Library], [Blueprints] */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveTab('stack');
              }}
              className={`py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stack'
                  ? 'bg-o1-crimson text-white shadow-xs'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-300 hover:bg-white/[0.06]'
              }`}
            >
              <Dumbbell size={14} />
              <span>Stack ({stack.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveTab('library');
              }}
              className={`py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-o1-crimson text-white shadow-xs'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-300 hover:bg-white/[0.06]'
              }`}
            >
              <Search size={14} />
              <span>Library</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveTab('blueprints');
              }}
              className={`py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'blueprints'
                  ? 'bg-o1-crimson text-white shadow-xs'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-300 hover:bg-white/[0.06]'
              }`}
            >
              <Sparkles size={14} />
              <span>Blueprints</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {dispatchSuccessToast && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            <span>{dispatchSuccessToast}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. BODY CONTENT (Stack, Library, or Blueprints) */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: STACK */}
          {activeTab === 'stack' && (
            <div className="space-y-4">
              {/* WORKOUT PARAMETERS Card */}
              <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-neutral-300">
                    <SlidersHorizontal size={14} className="text-neutral-500" />
                    <span>Workout Parameters</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSetup((v) => !v)}
                    className="text-xs font-medium text-neutral-500 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isEditingSetup ? 'Done' : 'Edit Setup'}</span>
                    <ChevronDown size={13} />
                  </button>
                </div>

                {isEditingSetup ? (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={workoutTitle}
                      onChange={(e) => setWorkoutTitle(e.target.value)}
                      placeholder="Protocol Title"
                      className="w-full px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-semibold text-white outline-none focus:border-o1-crimson"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={workoutDate}
                        onChange={(e) => setWorkoutDate(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white outline-none"
                      >
                        <option value="Today">Today</option>
                        <option value="Tomorrow">Tomorrow</option>
                        <option value="Upcoming Microcycle">Upcoming Microcycle</option>
                      </select>
                      <select
                        value={workoutFocus}
                        onChange={(e) => setWorkoutFocus(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white outline-none"
                      >
                        <option value="Hypertrophy (8-12)">Hypertrophy (8-12)</option>
                        <option value="Max Strength (3-5)">Max Strength (3-5)</option>
                        <option value="Conditioning / Engine">Conditioning / Engine</option>
                        <option value="Recovery / Deload">Recovery / Deload</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{workoutTitle}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{workoutDate} · {workoutFocus}</p>
                  </div>
                )}
              </div>

              {/* PROGRAMMED EXERCISES Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold tracking-wider text-neutral-300">
                  PROGRAMMED EXERCISES ({stack.length})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setDispatchSuccessToast('Blueprint saved to Playbook!');
                      setTimeout(() => setDispatchSuccessToast(null), 2500);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-white/[0.07] bg-o1-card hover:bg-white/[0.06] text-neutral-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Bookmark size={13} />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setActiveTab('library');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white text-neutral-900 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Plus size={14} />
                    <span>Add Exercise</span>
                  </button>
                </div>
              </div>

              {/* Exercise Cards */}
              <div className="space-y-2.5">
                {stack.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-white/[0.07] text-center space-y-2">
                    <p className="text-xs text-neutral-500">
                      No exercises in stack. Tap Add Exercise or choose a Blueprint.
                    </p>
                  </div>
                ) : (
                  stack.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="rounded-2xl border border-white/[0.07] bg-o1-card overflow-hidden shadow-2xs transition-all"
                    >
                      {/* Exercise Row Header */}
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-300 shrink-0">
                            <Dumbbell size={15} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {exercise.name}
                            </h4>
                            <p className="text-[11px] text-neutral-400 truncate">
                              {exercise.muscle}
                            </p>
                          </div>
                        </div>

                        {/* Disclosure & Sets badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleExpandExercise(exercise.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-white/[0.06] text-xs font-bold text-red-400 cursor-pointer transition-colors"
                          >
                            <span>{exercise.sets.length} sets</span>
                            {exercise.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Remove exercise"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Sets Table */}
                      {exercise.expanded && (
                        <div className="p-3 pt-0 border-t border-white/[0.05] bg-o1-card space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                          <div className="space-y-1.5 pt-2">
                            <div className="grid grid-cols-12 gap-1.5 text-[10px] font-semibold text-neutral-400 text-center items-center">
                              <span className="col-span-2">Set</span>
                              <span className="col-span-3">KG</span>
                              <span className="col-span-3">Reps</span>
                              <span className="col-span-3">RPE</span>
                              <span className="col-span-1"></span>
                            </div>

                            {exercise.sets.map((set, sIdx) => (
                              <div
                                key={set.id}
                                className="grid grid-cols-12 gap-1.5 items-center text-xs font-mono"
                              >
                                <span className="col-span-2 text-center text-neutral-500 font-bold">
                                  #{sIdx + 1}
                                </span>
                                <input
                                  type="number"
                                  value={set.weightKg}
                                  onChange={(e) =>
                                    handleUpdateSet(exercise.id, set.id, 'weightKg', Number(e.target.value))
                                  }
                                  className="col-span-3 h-7 text-center rounded-lg bg-o1-well border border-white/[0.07] text-white font-bold"
                                />
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(exercise.id, set.id, 'reps', Number(e.target.value))
                                  }
                                  className="col-span-3 h-7 text-center rounded-lg bg-o1-well border border-white/[0.07] text-white font-bold"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={set.rpe}
                                  onChange={(e) =>
                                    handleUpdateSet(exercise.id, set.id, 'rpe', Number(e.target.value))
                                  }
                                  className="col-span-3 h-7 text-center rounded-lg bg-o1-well border border-white/[0.07] text-o1-crimson font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exercise.id, set.id)}
                                  className="col-span-1 flex items-center justify-center h-7 text-neutral-400 hover:text-red-400 active:scale-90 transition-all cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                                  title={`Delete set #${sIdx + 1}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Editable Coach Form Cue with Pre-recommendations */}
                          <div className="p-3 rounded-xl bg-o1-well border border-white/[0.07] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] tracking-wider text-o1-crimson flex items-center gap-1.5">
                                <Sparkles size={11} />
                                <span>Coach form cue & directives</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetCue(exercise.id)}
                                className="text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors"
                                title="Reset to default recommendation"
                              >
                                <RotateCcw size={10} />
                                <span>Reset Default</span>
                              </button>
                            </div>

                            <textarea
                              value={exercise.cue}
                              onChange={(e) => handleUpdateExerciseCue(exercise.id, e.target.value)}
                              placeholder="Enter coaching form cues, tempo instructions, or athlete directives..."
                              rows={2}
                              className="w-full p-2 text-xs text-neutral-100 bg-o1-card rounded-lg border border-white/[0.07] focus:border-o1-crimson focus:outline-none resize-none leading-relaxed transition-colors font-sans"
                            />

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                                <span className="font-semibold">Pre-recommendations (tap to add):</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {RECOMMENDED_CUE_CHIPS.map((chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => handleAppendCueRecommendation(exercise.id, chip)}
                                    className="px-2 py-0.5 rounded-md bg-white/[0.08] hover:bg-o1-crimson/10 hover:text-o1-crimson text-[10px] font-medium text-neutral-300 border border-white/[0.07] transition-colors cursor-pointer"
                                  >
                                    + {chip}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddSet(exercise.id)}
                              className="text-xs font-bold text-o1-crimson flex items-center gap-1 cursor-pointer hover:underline"
                            >
                              <Plus size={14} />
                              <span>Add Set</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXERCISE LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-3.5">
              <div className="relative">
                <Search size={15} className="text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movement, muscle or equipment..."
                  className="w-full h-10 pl-9 pr-3 rounded-2xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson"
                />
              </div>

              {/* Muscle Group Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {MUSCLE_FILTER_CHIPS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-o1-crimson text-white shadow-2xs'
                        : 'bg-white/[0.08] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Type Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['All', 'Compound', 'Isolation', 'Functional'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedTypeFilter(type);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTypeFilter === type
                        ? 'bg-white text-neutral-900'
                        : 'bg-white/[0.08] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Movement List */}
              <div className="space-y-2">
                {filteredCatalog.map((catEx) => {
                  const alreadyInStack = stack.some((s) => s.name === catEx.name);
                  return (
                    <div
                      key={catEx.id}
                      className="p-3 rounded-2xl border border-white/[0.07] bg-o1-card flex items-center justify-between gap-3 shadow-2xs hover:border-white/[0.14] transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {catEx.name}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/[0.08] text-neutral-500 shrink-0">
                            {catEx.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {catEx.muscleTarget} • {catEx.equipment}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          Default: {catEx.defaultSets} sets • {catEx.defaultReps} reps • {catEx.defaultWeightKg > 0 ? `${catEx.defaultWeightKg}kg` : 'BW'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddExerciseFromCatalog(catEx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          alreadyInStack
                            ? 'bg-white/[0.08] text-neutral-400 border border-white/[0.07]'
                            : 'bg-o1-crimson text-white hover:bg-o1-crimson-hover shadow-xs'
                        }`}
                      >
                        {alreadyInStack ? <Check size={13} /> : <Plus size={13} />}
                        <span>{alreadyInStack ? 'Added' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BLUEPRINTS */}
          {activeTab === 'blueprints' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Blueprint Synthesizer
                </h3>
                <p className="text-xs text-neutral-400">
                  Select athletic parameters to generate calibrated daily protocols
                </p>
              </div>

              {/* Athletic Vector Selector */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Target Vector ({VECTOR_PILLS.length} Available)
                </label>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {VECTOR_PILLS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setSelectedVector(v);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedVector === v
                          ? 'bg-o1-crimson text-white font-bold shadow-2xs'
                          : 'bg-white/[0.08] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration, Gear & Intensity Tracks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Duration
                  </label>
                  <div className="flex p-1 rounded-xl bg-white/[0.08] gap-0.5 overflow-x-auto">
                    {(['20m', '30m', '45m', '60m', '75m'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDuration(d)}
                        className={`flex-1 py-1 rounded-xl text-xs font-semibold transition-all ${
                          selectedDuration === d
                            ? 'bg-o1-card text-white shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Facility Gear
                  </label>
                  <div className="flex p-1 rounded-xl bg-white/[0.08] gap-1">
                    {(['Full Gym', 'DB & Bench', 'Bodyweight'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGear(g)}
                        className={`flex-1 py-1 rounded-xl text-[10px] font-semibold transition-all truncate ${
                          selectedGear === g
                            ? 'bg-o1-card text-white shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        {g === 'Full Gym' ? 'Gym' : g === 'DB & Bench' ? 'Db' : 'bw'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Intensity Scheme
                  </label>
                  <div className="flex p-1 rounded-xl bg-white/[0.08] gap-1">
                    {(['Progressive RPE', 'Failure Dropset'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSelectedIntensity(mode)}
                        className={`flex-1 py-1 rounded-xl text-[10px] font-semibold transition-all truncate ${
                          selectedIntensity === mode
                            ? 'bg-o1-card text-white shadow-2xs'
                            : 'text-neutral-500'
                        }`}
                      >
                        {mode === 'Progressive RPE' ? 'RPE Wave' : 'Dropset'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synthesized Blueprint Card */}
              <div className="p-4 rounded-2xl border border-white/[0.07] bg-o1-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {synthesizedBlueprint.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      {synthesizedBlueprint.durationMins}m • {synthesizedBlueprint.exercises.length} Movements • {synthesizedBlueprint.tagline}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    Calibrated
                  </span>
                </div>

                <div className="space-y-1.5">
                  {synthesizedBlueprint.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">
                          {ex.name}
                        </span>
                        <span className="font-mono text-neutral-400 font-bold shrink-0 ml-2">
                          {ex.sets}x • {ex.reps} @ {ex.targetWeightKg > 0 ? `${ex.targetWeightKg}kg` : 'BW'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span className="truncate">{ex.muscle}</span>
                        <span className="font-mono">RPE {ex.rpe} • Tempo {ex.tempo}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 italic truncate">
                        "{ex.cue}"
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleLoadBlueprintToStack(synthesizedBlueprint)}
                  className="w-full py-2.5 rounded-2xl bg-white text-neutral-900 font-bold text-xs shadow-xs cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Load Into Stack</span>
                </button>
                <p className="text-[10px] font-mono text-neutral-400 text-center tracking-tight pt-1">
                  Consult a physician before beginning any training program.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* 3. PINNED STICKY BOTTOM ACTION BAR (Matches Screenshot 2) */}
        {/* ============================================================== */}
        <div className="p-3 border-t border-white/[0.05] bg-o1-card shrink-0 space-y-2">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {workoutTitle} ({workoutDate})
            </h4>
            <p className="text-[11px] text-neutral-400 font-medium truncate">
              {stack.length} Movements • {telemetry.sets} Sets • Target:{' '}
              {selectedAthletes.length === 1
                ? selectedAthletes[0].name
                : selectedAthletes.length > 1
                ? `${selectedAthletes.length} Athletes`
                : targetAthlete?.name || 'No Athlete Selected'}
            </p>
          </div>

          <input
            type="text"
            value={coachCue}
            onChange={(e) => setCoachCue(e.target.value)}
            placeholder="Coach cue / target RPE (optional)"
            className="h-[44px] w-full rounded-xl border border-white/[0.07] bg-o1-well px-3 text-[13px] text-white placeholder:text-neutral-500 outline-none focus:border-o1-crimson"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setIsAthletePickerOpen(true);
              }}
              className="h-[44px] shrink-0 px-3 rounded-full border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-xs font-semibold text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users size={12} className="text-neutral-500" />
              <span>Athletes ({selectedAthleteIds.length})</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || stack.length === 0 || selectedAthleteIds.length === 0}
              onClick={handleDispatchWorkout}
              className="h-[44px] flex-1 px-4 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 disabled:opacity-50 text-white text-[13px] font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send size={13} />
              <span>Dispatch Workout to Floor</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ATHLETES MULTI-SELECT OVERLAY / MODAL */}
        {/* ============================================================== */}
        {isAthletePickerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-o1-card rounded-2xl border border-white/[0.07] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-o1-crimson/10 text-o1-crimson flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Target Athletes ({selectedAthleteIds.length})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Select single or multiple athletes to dispatch
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAthletePickerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search & Bulk Select Actions */}
              <div className="p-3 border-b border-white/[0.05] bg-o1-card space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={athleteSearchQuery}
                    onChange={(e) => setAthleteSearchQuery(e.target.value)}
                    placeholder="Search athlete by name, handle, or status..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-o1-crimson"
                  />
                </div>
                <div className="flex items-center justify-between text-xs px-0.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllAthletes}
                      className="text-[11px] font-bold text-o1-crimson hover:underline cursor-pointer"
                    >
                      Select All ({athletes.length})
                    </button>
                    <span className="text-neutral-700">•</span>
                    <button
                      type="button"
                      onClick={handleClearAthleteSelection}
                      className="text-[11px] font-medium text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {selectedAthleteIds.length} of {athletes.length} selected
                  </span>
                </div>
              </div>

              {/* Athletes Roster List */}
              <div className="p-3 overflow-y-auto space-y-1.5 max-h-[50vh]">
                {filteredAthletes.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-semibold text-neutral-400">
                      No connected athletes in roster.
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Connect client athletes via the Coach tab or share your athlete invite link.
                    </p>
                  </div>
                ) : (
                  filteredAthletes.map((ath) => {
                  const isSelected = selectedAthleteIds.includes(ath.id);
                  return (
                    <div
                      key={ath.id}
                      onClick={() => toggleSelectAthlete(ath.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-o1-crimson bg-o1-crimson/10'
                          : 'border-white/[0.07] bg-o1-well hover:border-white/[0.14]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-o1-crimson border-o1-crimson text-white'
                              : 'border-white/[0.07] bg-transparent'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-neutral-300">
                          {ath.avatar ? (
                            <img src={ath.avatar} alt={ath.name} className="w-full h-full object-cover" />
                          ) : (
                            ath.name.slice(0, 2).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {ath.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono truncate">
                              {ath.handle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                            <span className="text-emerald-400 font-semibold">
                              {ath.readiness ? `${ath.readiness}%` : '--'}
                            </span>
                            <span>•</span>
                            <span>{ath.status}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          ath.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : ath.status === 'Need Routine'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-white/[0.08] text-neutral-500'
                        }`}
                      >
                        {ath.status}
                      </span>
                    </div>
                  );
                }))}
              </div>

              {/* Done Footer */}
              <div className="p-3.5 border-t border-white/[0.05] bg-o1-card flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  {selectedAthleteIds.length === 0
                    ? 'No athletes selected'
                    : `${selectedAthleteIds.length} athletes will receive this workout`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setIsAthletePickerOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-o1-crimson text-white text-xs font-bold hover:bg-o1-crimson-hover transition-colors cursor-pointer shadow-xs"
                >
                  Confirm ({selectedAthleteIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkoutDispatchStudio;
