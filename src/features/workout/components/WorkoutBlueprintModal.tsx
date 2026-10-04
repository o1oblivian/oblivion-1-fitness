import React, { useState } from 'react';
import {
  X,
  Clock,
  Zap,
  Target,
  Dumbbell,
  Timer,
  Info,
  Layers,
  Check,
} from 'lucide-react';
import {
  WorkoutBlueprint,
  BlueprintCategory,
  BlueprintExercise,
} from '../../../data/workoutBlueprints';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem, ExerciseSet } from '../../../types';

export interface WorkoutBlueprintModalProps {
  blueprint: WorkoutBlueprint | null;
  isOpen: boolean;
  onClose: () => void;
  onLoaded?: (count: number) => void;
}

const CATEGORY_TABS: (BlueprintCategory | 'All')[] = [
  'All',
  'Warm-Up',
  'Activation / Prime',
  'Main Lifts',
  'Accessories',
  'Finisher',
];

export const WorkoutBlueprintModal: React.FC<WorkoutBlueprintModalProps> = ({
  blueprint,
  isOpen,
  onClose,
  onLoaded,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BlueprintCategory | 'All'>('All');
  const addExercisesToActiveLog = useWorkoutStore((s) => s.addExercisesToActiveLog);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);

  if (!isOpen || !blueprint) return null;

  const filteredExercises =
    selectedCategory === 'All'
      ? blueprint.exercises
      : blueprint.exercises.filter((ex) => ex.category === selectedCategory);

  const handleLoadBlueprint = () => {
    tactileEngine.playPRCelebration();

    // Convert BlueprintExercise to full ExerciseItem
    const newExercises: ExerciseItem[] = blueprint.exercises.map((be, idx) => {
      // Parse rest time in seconds
      const parsedRest = parseInt(be.rest.replace(/\D/g, ''), 10) || 90;

      // Parse reps
      let repNum = 10;
      const numMatch = be.reps.match(/\d+/);
      if (numMatch) {
        const parts = be.reps.split('-');
        if (parts.length > 1 && !isNaN(parseInt(parts[1], 10))) {
          repNum = parseInt(parts[1], 10);
        } else {
          repNum = parseInt(numMatch[0], 10);
        }
      }

      const setsCount = be.sets || 3;
      const sets: ExerciseSet[] = Array.from({ length: setsCount }, (_, i) => ({
        id: `set-${Date.now()}-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
        setNumber: i + 1,
        weightKg: be.defaultWeightKg || 0,
        reps: repNum,
        rpe: 8,
        completed: false,
      }));

      return {
        id: `bp-${blueprint.id}-${be.id}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: be.name,
        targetMuscle: be.targetMuscle,
        sets,
        notes: `${be.category} • Tempo ${be.tempo} • ${be.cues}`,
        restSecs: parsedRest,
        equipment:
          be.defaultWeightKg && be.defaultWeightKg > 0
            ? 'Barbell / Cable / DB'
            : 'Bodyweight',
        tier: 'T1',
      };
    });

    // Deploy to active log & active session
    addExercisesToActiveLog(newExercises);
    setActiveRoutine(blueprint.title);

    if (onLoaded) {
      onLoaded(newExercises.length);
    }

    setTimeout(() => {
      const el = document.getElementById('active-log-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    onClose();
  };

  return (
    <div
      id="workout-blueprint-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-[70000] bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        id="workout-blueprint-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300"
      >
        {/* HERO IMAGE & BACKDROP HEADER */}
        <div className="relative h-44 sm:h-52 w-full shrink-0 overflow-hidden bg-neutral-900">
          <img
            src={blueprint.image}
            alt={blueprint.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#121214] via-white/80 dark:via-[#121214]/60 to-black/30" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close modal"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Timing pills in top left */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-[#C4121A] text-white font-mono text-[9px] font-black tracking-wider uppercase border border-red-500/40 shadow-sm backdrop-blur-xs">
              {blueprint.badge}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-white font-mono text-[9px] font-bold tracking-wider uppercase border border-white/15 flex items-center gap-1 backdrop-blur-xs">
              <Clock className="w-3 h-3 text-cyan-400" />
              {blueprint.estimatedTime}
            </span>
          </div>

          {/* Title & Subtitle at bottom of header */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase font-sans">
              {blueprint.title}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono tracking-wide mt-0.5 truncate">
              {blueprint.subtitle}
            </p>
          </div>
        </div>

        {/* OVERVIEW & METADATA BAR */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#0E0E11] space-y-2 shrink-0">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            {blueprint.description}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase mr-1">
              <Target className="w-3 h-3 text-red-500" />
              <span>Target:</span>
            </div>
            {blueprint.targetMuscles.map((muscle) => (
              <span
                key={muscle}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-[10px] font-mono text-neutral-700 dark:text-neutral-300 font-medium"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="px-4 py-2 bg-white dark:bg-[#121214] border-b border-neutral-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {CATEGORY_TABS.map((cat) => {
              const count =
                cat === 'All'
                  ? blueprint.exercises.length
                  : blueprint.exercises.filter((e) => e.category === cat).length;

              if (cat !== 'All' && count === 0) return null;

              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-950/30 border border-red-500'
                      : 'bg-neutral-100 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans ${
                      isSelected
                        ? 'bg-red-800 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* EXERCISES LIST SCROLLER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] bg-neutral-50/40 dark:bg-transparent">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 font-mono text-xs">
              No exercises found in this category.
            </div>
          ) : (
            filteredExercises.map((ex, index) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-2 shadow-xs dark:shadow-none hover:border-neutral-300 dark:hover:border-white/20 transition"
              >
                {/* Top Row: Category tag, index, and name */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                        {ex.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white font-sans tracking-tight">
                      {ex.name}
                    </h4>
                    <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                      {ex.targetMuscle}
                    </p>
                  </div>

                  {/* Volume Summary Pill */}
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono text-xs font-bold">
                      {ex.sets} × {ex.reps}
                    </span>
                    {ex.defaultWeightKg && ex.defaultWeightKg > 0 ? (
                      <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {ex.defaultWeightKg} kg target
                      </p>
                    ) : (
                      <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">
                        Bodyweight
                      </p>
                    )}
                  </div>
                </div>

                {/* Specs Chips: Rest, Tempo */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-white/5 flex-wrap text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1 bg-neutral-100/70 dark:bg-black/40 px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-white/5">
                    <Timer className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>Rest: {ex.rest}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-neutral-100/70 dark:bg-black/40 px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-white/5">
                    <Layers className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    <span>Tempo: {ex.tempo}</span>
                  </div>
                </div>

                {/* Coaching Cues */}
                {ex.cues && (
                  <div className="bg-neutral-50 dark:bg-black/30 rounded-lg p-2 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 leading-snug flex items-start gap-1.5 border border-neutral-200/60 dark:border-white/5">
                    <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>{ex.cues}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 bg-white dark:bg-[#0E0E11] border-t border-neutral-200 dark:border-white/10 shrink-0">
          <button
            type="button"
            id="blueprint-load-btn"
            onClick={handleLoadBlueprint}
            className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-red-950/40 border border-red-500 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>LOAD BLUEPRINT ({blueprint.exercises.length} EXERCISES)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutBlueprintModal;
