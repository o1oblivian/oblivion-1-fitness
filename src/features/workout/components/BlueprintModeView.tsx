import React, { useState } from 'react';
import {
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Plus,
  Zap,
  ArrowLeftRight,
} from 'lucide-react';
import { WORKOUT_BLUEPRINTS, WorkoutBlueprint, BlueprintExercise } from '../../../data/workoutBlueprints';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem, ExerciseSet } from '../../../types';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';

export type BlueprintTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface BlueprintModeViewProps {
  onShowToast?: (msg: string) => void;
  onOpenBlueprintModal?: (blueprint: WorkoutBlueprint) => void;
  onLoaded?: () => void;
}

// Distributed category filter tags (Removed 'ALL' to eliminate infinite scroll)
const FILTER_TAGS = [
  'HYPERTROPHY',
  'STRENGTH',
  'HYBRID',
  'MOBILITY',
  'PLYOMETRICS',
  'Glute Lab',
  'CALISTHENICS',
  'OLYMPIC',
  'CORE',
];

export const BlueprintModeView: React.FC<BlueprintModeViewProps> = ({ onShowToast, onLoaded }) => {
  const [selectedTag, setSelectedTag] = useState<string>('HYPERTROPHY');
  const [expandedBlueprintId, setExpandedBlueprintId] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, BlueprintTier>>({});
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [showSwapperUtility, setShowSwapperUtility] = useState<boolean>(false);
  const [selectedExToSwap, setSelectedExToSwap] = useState<string | null>(null);

  const addExercisesToActiveLog = useWorkoutStore((s) => s.addExercisesToActiveLog);
  const addExerciseToActiveLog = useWorkoutStore((s) => s.addExerciseToActiveLog);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);
  const activeRoutine = useWorkoutStore((s) => s.activeRoutine);
  const exercises = useWorkoutStore((s) => s.exercises);
  const swapExercise = useWorkoutStore((s) => s.swapExercise);

  const getTierForBlueprint = (id: string): BlueprintTier => selectedTiers[id] || 'INTERMEDIATE';

  // Filter blueprints strictly within the selected category
  const filteredBlueprints = WORKOUT_BLUEPRINTS.filter((bp) => {
    const badge = bp.badge.toUpperCase();
    const focus = bp.focus.toUpperCase();
    const title = bp.title.toUpperCase();
    const tag = selectedTag.toUpperCase();

    if (tag === 'STRENGTH') {
      return (
        badge.includes('STRENGTH') ||
        badge.includes('SBD') ||
        focus.includes('STRENGTH') ||
        focus.includes('PULL') ||
        title.includes('STRENGTH') ||
        title.includes('PRESS') ||
        title.includes('POWERLIFTING')
      );
    }
    if (tag === 'PLYOMETRICS') {
      return (
        badge.includes('PLYO') ||
        badge.includes('VELOCITY') ||
        focus.includes('PLYO') ||
        focus.includes('VELOCITY') ||
        title.includes('JUMP') ||
        title.includes('VELOCITY')
      );
    }
    if (tag === 'MOBILITY') {
      return (
        badge.includes('MOBILITY') ||
        badge.includes('LONGEVITY') ||
        focus.includes('MOBILITY') ||
        focus.includes('LONGEVITY') ||
        focus.includes('REMODELING') ||
        title.includes('MOBILITY') ||
        title.includes('KNEES')
      );
    }
    if (tag === 'HYBRID') {
      return (
        badge.includes('HYBRID') ||
        badge.includes('HYROX') ||
        focus.includes('HYBRID') ||
        focus.includes('THRESHOLD') ||
        title.includes('HYBRID') ||
        title.includes('HYROX') ||
        title.includes('CHIPPER')
      );
    }
    if (tag === 'Glute Lab') {
      return (
        badge.includes('GLUTE') ||
        focus.includes('GLUTE') ||
        title.includes('BOOTY') ||
        title.includes('GLUTE')
      );
    }
    if (tag === 'CALISTHENICS') {
      return (
        badge.includes('CALISTHENICS') ||
        focus.includes('CALISTHENICS') ||
        title.includes('CALISTHENICS') ||
        title.includes('RING') ||
        title.includes('Weighted Push')
      );
    }
    if (tag === 'OLYMPIC') {
      return (
        badge.includes('OLYMPIC') ||
        focus.includes('OLYMPIC') ||
        title.includes('OLYMPIC') ||
        title.includes('SNATCH') ||
        title.includes('CLEAN')
      );
    }
    if (tag === 'CORE') {
      const muscles = (bp.targetMuscles || []).join(' ').toUpperCase();
      return (
        badge.includes('CORE') ||
        focus.includes('CORE') ||
        title.includes('CORE') ||
        title.includes('ABS') ||
        muscles.includes('CORE') ||
        muscles.includes('ABS') ||
        muscles.includes('OBLIQUE')
      );
    }
    return badge.includes(tag) || focus.includes(tag) || title.includes(tag);
  });

  // Dynamic Tier-Scaling Sports Science Calculator
  const getTierSpecs = (be: BlueprintExercise, tier: BlueprintTier) => {
    const baseWeight = be.defaultWeightKg || 0;
    const baseSets = be.sets || 3;
    const parsedRest = parseInt(be.rest.replace(/\D/g, ''), 10) || 90;

    if (tier === 'BEGINNER') {
      return {
        sets: 2,
        reps: '10–12 Controlled',
        weightKg: baseWeight > 0 ? Math.max(4, Math.round((baseWeight * 0.6) / 2) * 2) : 0,
        restSecs: parsedRest + 25,
        rpe: 7.0,
        tierTag: 'Foundational Volume (RPE 7.0)',
      };
    }

    if (tier === 'ADVANCED') {
      return {
        sets: Math.min(5, baseSets + 1),
        reps: `${be.reps} (Peak Intent)`,
        weightKg: baseWeight > 0 ? Math.round((baseWeight * 1.15) / 2.5) * 2.5 : 0,
        restSecs: Math.max(45, parsedRest - 15),
        rpe: 9.0,
        tierTag: 'High Density (RPE 9.0)',
      };
    }

    // INTERMEDIATE (Baseline)
    return {
      sets: baseSets,
      reps: be.reps,
      weightKg: baseWeight,
      restSecs: parsedRest,
      rpe: 8.0,
      tierTag: 'Standard Progressive Overload',
    };
  };

  // Convert a blueprint exercise into an ExerciseItem calibrated to tier
  const convertToExerciseItem = (
    be: BlueprintExercise,
    blueprintId: string,
    idx: number,
    tier: BlueprintTier
  ): ExerciseItem => {
    const specs = getTierSpecs(be, tier);
    let repNum = 10;
    const numMatch = specs.reps.match(/\d+/);
    if (numMatch) {
      const parts = specs.reps.split('-');
      if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
        repNum = parseInt(parts[1], 10);
      } else {
        repNum = parseInt(numMatch[0], 10);
      }
    }

    const sets: ExerciseSet[] = Array.from({ length: specs.sets }, (_, i) => ({
      id: `set-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
      setNumber: i + 1,
      weightKg: specs.weightKg,
      reps: repNum,
      rpe: specs.rpe,
      completed: false,
    }));

    return {
      id: `bp-${blueprintId}-${be.id}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: be.name,
      targetMuscle: be.targetMuscle,
      sets,
      notes: `[${tier}] ${be.category} • Tempo ${be.tempo} • ${be.cues}`,
      restSecs: specs.restSecs,
      equipment: specs.weightKg > 0 ? 'Barbell / Cable / DB' : 'Bodyweight',
      tier: tier === 'BEGINNER' ? 'T3' : tier === 'INTERMEDIATE' ? 'T2' : 't1',
    };
  };

  // 1-Tap Load Full Blueprint with auto-collapse
  const handleLoadBlueprint = (blueprint: WorkoutBlueprint, tier: BlueprintTier) => {
    tactileEngine.playPRCelebration();

    // For beginners, take foundational movements (first 5) to protect novices from volume exhaustion
    const targetExercises =
      tier === 'BEGINNER' && blueprint.exercises.length > 5
        ? blueprint.exercises.slice(0, 5)
        : blueprint.exercises;

    const newExercises = targetExercises.map((be, idx) =>
      convertToExerciseItem(be, blueprint.id, idx, tier)
    );

    addExercisesToActiveLog(newExercises);
    setActiveRoutine(`${blueprint.title} (${tier})`);
    onShowToast?.(`Loaded ${blueprint.title} [${tier}] (${newExercises.length} movements)`);

    // Auto-collapse drawer and scroll to active log
    onLoaded?.();
  };

  // Add individual exercise from a blueprint with auto-collapse
  const handleAddSingleExercise = (
    be: BlueprintExercise,
    blueprintId: string,
    tier: BlueprintTier,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    const item = convertToExerciseItem(be, blueprintId, 0, tier);
    addExerciseToActiveLog(item);
    onShowToast?.(`Added ${be.name} [${tier}]`);
    onLoaded?.();
  };

  // Swapper Alternative Logic
  const targetExercise = exercises.find((ex) => ex.id === selectedExToSwap) || exercises[0];
  const alternatives = targetExercise
    ? EXERCISE_DATABASE.filter(
        (def) =>
          def.name.toLowerCase() !== targetExercise.name.toLowerCase() &&
          (def.category.toLowerCase().includes(targetExercise.targetMuscle.toLowerCase().split(' ')[0]) ||
            targetExercise.targetMuscle.toLowerCase().includes(def.category.toLowerCase().split(' ')[0]))
      ).slice(0, 5)
    : [];

  const handleApplySwap = (alt: (typeof EXERCISE_DATABASE)[0]) => {
    if (!targetExercise) return;
    tactileEngine.playPRCelebration();
    swapExercise(targetExercise.id, {
      name: alt.name,
      targetMuscle: alt.category,
      equipment: alt.equipment as any,
      restSecs: alt.restSecs || 90,
    });
    onShowToast?.(`Replaced with ${alt.name}`);
  };

  return (
    <div className="space-y-3 pt-1 select-none font-sans">
      {/* 1. Header & Distributed Category Tabs (No 'ALL') */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerLightTick();
                setIsStyleOpen((v) => !v);
              }}
              className="h-8 px-3 rounded-full bg-black border border-white/[0.07] text-xs font-semibold text-neutral-200 flex items-center gap-1.5 cursor-pointer"
            >
              {selectedTag}
              <span className="text-neutral-400 font-medium">{filteredBlueprints.length}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
            {isStyleOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] bg-o1-card border border-white/[0.07] shadow-lg rounded-2xl p-1">
                {FILTER_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerLightTick();
                      setSelectedTag(tag);
                      setIsStyleOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-o1-well font-semibold text-white'
                        : 'text-neutral-400 hover:bg-white/5'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          {exercises.length > 0 && (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerLightTick();
                setShowSwapperUtility((prev) => !prev);
              }}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>{showSwapperUtility ? 'Hide Swapper' : 'Exercise Swapper'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Optional Integrated Swapper Drawer (when active session running) */}
      {showSwapperUtility && exercises.length > 0 && (
        <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider">
              Biomechanic Swapper
            </span>
            <span className="text-[10px] text-neutral-400 truncate max-w-[180px]">
              Replace {targetExercise?.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {exercises.map((ex) => {
              const isSelected = ex.id === (targetExercise?.id || '');
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setSelectedExToSwap(ex.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-transparent'
                      : 'bg-o1-card text-neutral-400 border-white/[0.07]'
                  }`}
                >
                  {ex.name.slice(0, 20)}
                </button>
              );
            })}
          </div>

          {alternatives.length > 0 ? (
            <div className="space-y-1 pt-1">
              {alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-o1-card border border-white/[0.07]"
                >
                  <div>
                    <div className="text-xs font-bold text-white">
                      {alt.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {alt.category} • {alt.equipment}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySwap(alt)}
                    className="px-2.5 py-1 rounded-xl bg-o1-crimson text-white text-[10px] font-bold tracking-wider hover:bg-o1-crimson-hover cursor-pointer"
                  >
                    Swap
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-center text-neutral-500 py-1">
              No matching alternatives found for this movement pattern.
            </div>
          )}
        </div>
      )}

      {/* 3. Blueprints Cards Roster */}
      <div className="space-y-3">
        {filteredBlueprints.map((bp) => {
          const isExpanded = expandedBlueprintId === bp.id;
          const currentTier = getTierForBlueprint(bp.id);
          const isCurrentActive = activeRoutine.startsWith(bp.title);

          return (
            <div
              key={bp.id}
              className={`rounded-2xl border transition-all overflow-hidden bg-o1-card ${
                isCurrentActive
                  ? 'border-o1-crimson/60 shadow-xs'
                  : 'border-white/[0.07] hover:border-white/[0.14]'
              }`}
            >
              {/* Card Banner & Summary */}
              <div className="p-3 space-y-2.5">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-15 h-15 rounded-xl overflow-hidden shrink-0 bg-white/[0.08] relative">
                    <img
                      src={bp.image}
                      alt={bp.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white text-center truncate">
                      {bp.badge}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        {bp.title}
                      </h4>
                      {isCurrentActive && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-o1-crimson/10 text-o1-crimson shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {bp.subtitle}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {bp.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3 h-3 text-neutral-400" />
                        {currentTier === 'BEGINNER' && bp.exercises.length > 5 ? 5 : bp.exercises.length} Drills
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Muscle Chips */}
                <div className="flex flex-wrap gap-1">
                  {bp.targetMuscles.slice(0, 4).map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-o1-well text-neutral-400"
                    >
                      {muscle}
                    </span>
                  ))}
                  {bp.targetMuscles.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono text-neutral-400">
                      +{bp.targetMuscles.length - 4}
                    </span>
                  )}
                </div>

                {/* 2-CAPSULE ARCHITECTURE:
                    Capsule 1: Beginner / Intermediate / Advanced Dropdown Selector (Capsule Shape & Micro-Dot)
                    Capsule 2: Load Blueprint Action Button (Capsule Shape)
                    + Discrete Expand Preview Chevron */}
                <div className="flex items-center gap-2 pt-0.5">
                  {/* Capsule 1: Level / Tier Dropdown */}
                  <div className="relative shrink-0 w-36 sm:w-40 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-between px-3 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          currentTier === 'BEGINNER'
                            ? 'bg-emerald-500'
                            : currentTier === 'INTERMEDIATE'
                            ? 'bg-amber-400'
                            : 'bg-o1-crimson'
                        }`}
                      />
                      <span className="text-[11px] font-mono font-bold text-neutral-200 truncate">
                        {currentTier === 'BEGINNER'
                          ? 'Beginner'
                          : currentTier === 'INTERMEDIATE'
                          ? 'Intermediate'
                          : 'Advanced'}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0 pointer-events-none" />

                    {/* Transparent native select overlay for 100% native mobile accessibility */}
                    <select
                      value={currentTier}
                      onChange={(e) => {
                        tactileEngine.triggerLightTick();
                        const nextTier = e.target.value as BlueprintTier;
                        setSelectedTiers((prev) => ({ ...prev, [bp.id]: nextTier }));
                      }}
                      aria-label="Select Experience Tier"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  {/* Capsule 2: Load Blueprint Action Button */}
                  <button
                    type="button"
                    onClick={() => handleLoadBlueprint(bp, currentTier)}
                    className="flex-1 h-8 px-3 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span className="truncate">Load Blueprint</span>
                  </button>

                  {/* Preview Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerLightTick();
                      setExpandedBlueprintId(isExpanded ? null : bp.id);
                    }}
                    className="h-8 w-8 shrink-0 rounded-full bg-o1-well hover:bg-white/[0.06] text-neutral-300 border border-white/[0.07] flex items-center justify-center transition-colors cursor-pointer"
                    title={isExpanded ? 'Collapse exercises' : 'Preview exercises'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 4. Expanded Exercise Breakdown (Dynamically Formatted to Current Tier) */}
              {isExpanded && (
                <div className="border-t border-white/[0.05] bg-black p-3 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 px-0.5 border-b border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          currentTier === 'BEGINNER'
                            ? 'bg-emerald-500'
                            : currentTier === 'INTERMEDIATE'
                            ? 'bg-amber-400'
                            : 'bg-o1-crimson'
                        }`}
                      />
                      <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-200">
                        {currentTier} Calibration
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500">
                      {currentTier === 'BEGINNER'
                        ? '2 Sets • RPE 7.0 • Extra Rest'
                        : currentTier === 'INTERMEDIATE'
                        ? '3 Sets • RPE 8.0 • Standard'
                        : '4–5 Sets • RPE 9.0 • Peak Intensity'}
                    </span>
                  </div>

                  <div className="text-[10px] text-neutral-400 leading-relaxed px-0.5">
                    {bp.description}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(currentTier === 'BEGINNER' && bp.exercises.length > 5
                      ? bp.exercises.slice(0, 5)
                      : bp.exercises
                    ).map((ex, idx) => {
                      const specs = getTierSpecs(ex, currentTier);
                      return (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-o1-card border border-white/[0.07]"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-o1-well text-[9px] font-mono font-bold text-neutral-400 flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {ex.name}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 mt-0.5 pl-5.5">
                              {specs.sets} Sets × {specs.reps}
                              {specs.weightKg > 0 ? ` • ${specs.weightKg}kg` : ''} • {ex.category}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleAddSingleExercise(ex, bp.id, currentTier, e)}
                            className="p-1.5 rounded-lg bg-o1-well hover:bg-o1-crimson hover:text-white text-neutral-300 transition-colors shrink-0 cursor-pointer"
                            title={`Add ${currentTier} version to active session`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlueprintModeView;
