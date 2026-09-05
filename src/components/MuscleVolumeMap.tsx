import React, { useMemo } from 'react';
import { Activity, ShieldAlert, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { ExerciseLog } from '../types';

interface MuscleVolumeMapProps {
  logs: ExerciseLog[];
  showTitle?: boolean;
}

interface MuscleVolumeData {
  name: string;
  category: 'Upper Push' | 'Upper Pull' | 'Lower Anterior' | 'Lower Posterior' | 'Arms' | 'Core';
  sets: number;
  mev: number;
  optimal: number;
  mrv: number;
  status: 'below_mev' | 'mev' | 'optimal' | 'mrv_risk';
}

// Exercise to primary muscle group mapping
const EXERCISE_MUSCLE_MAP: Record<string, string> = {
  // Chest
  'Barbell Bench Press': 'Chest',
  'Incline Dumbbell Press': 'Chest',
  'Dumbbell Flyes': 'Chest',
  'Push-ups': 'Chest',
  'Chest Dips': 'Chest',
  'Cable Crossover': 'Chest',

  // Back / Lats
  'Barbell Deadlift': 'Back / Lats',
  'Pull-ups': 'Back / Lats',
  'Barbell Row': 'Back / Lats',
  'Lat Pulldown': 'Back / Lats',
  'Seated Cable Row': 'Back / Lats',
  'Dumbbell Row': 'Back / Lats',

  // Shoulders
  'Overhead Press': 'Shoulders',
  'Dumbbell Lateral Raise': 'Shoulders',
  'Face Pulls': 'Shoulders',
  'Arnold Press': 'Shoulders',

  // Quads
  'Barbell Back Squat': 'Quads',
  'Front Squat': 'Quads',
  'Leg Press': 'Quads',
  'Leg Extension': 'Quads',
  'Bulgarian Split Squat': 'Quads',
  'Walking Lunges': 'Quads',

  // Hamstrings / Glutes
  'Romanian Deadlift': 'Hamstrings & Glutes',
  'Leg Curl': 'Hamstrings & Glutes',
  'Hip Thrust': 'Hamstrings & Glutes',
  'Glute Ham Raise': 'Hamstrings & Glutes',

  // Arms
  'Barbell Curl': 'Arms',
  'Hammer Curl': 'Arms',
  'Tricep Pushdown': 'Arms',
  'Skull Crushers': 'Arms',
  'Dips': 'Arms',

  // Core
  'Plank': 'Core',
  'Hanging Leg Raise': 'Core',
  'Ab Wheel Rollout': 'Core',
  'Cable Crunch': 'Core',
};

export const MuscleVolumeMap: React.FC<MuscleVolumeMapProps> = ({ logs, showTitle = true }) => {
  const muscleGroups = useMemo<MuscleVolumeData[]>(() => {
    const counts: Record<string, number> = {
      'Chest': 0,
      'Back / Lats': 0,
      'Shoulders': 0,
      'Quads': 0,
      'Hamstrings & Glutes': 0,
      'Arms': 0,
      'Core': 0,
    };

    // Calculate sets per muscle group (ignoring warmups for true hypertrophy volume)
    for (const log of logs) {
      const muscle = EXERCISE_MUSCLE_MAP[log.exerciseName] || 'Chest';
      const workingSets = log.sets.filter((s) => !s.isWarmup && (Number(s.reps) > 0 || Number(s.weight) > 0)).length;
      counts[muscle] = (counts[muscle] || 0) + workingSets;
    }

    const definitions: Omit<MuscleVolumeData, 'sets' | 'status'>[] = [
      { name: 'Chest', category: 'Upper Push', mev: 8, optimal: 14, mrv: 22 },
      { name: 'Back / Lats', category: 'Upper Pull', mev: 10, optimal: 16, mrv: 24 },
      { name: 'Shoulders', category: 'Upper Push', mev: 8, optimal: 14, mrv: 20 },
      { name: 'Quads', category: 'Lower Anterior', mev: 8, optimal: 14, mrv: 22 },
      { name: 'Hamstrings & Glutes', category: 'Lower Posterior', mev: 6, optimal: 12, mrv: 20 },
      { name: 'Arms', category: 'Arms', mev: 6, optimal: 12, mrv: 18 },
      { name: 'Core', category: 'Core', mev: 4, optimal: 10, mrv: 16 },
    ];

    return definitions.map((def) => {
      const sets = counts[def.name] || 0;
      let status: MuscleVolumeData['status'] = 'below_mev';
      if (sets >= def.mrv) {
        status = 'mrv_risk';
      } else if (sets >= def.mev) {
        status = sets >= def.optimal ? 'optimal' : 'mev';
      }

      return {
        ...def,
        sets,
        status,
      };
    });
  }, [logs]);

  const totalVolumeSets = muscleGroups.reduce((acc, m) => acc + m.sets, 0);

  return (
    <div className="bg-white dark:bg-[#121214] border border-stone-200 dark:border-white/10 rounded-2xl p-4 text-stone-900 dark:text-white shadow-sm space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <Activity className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-bold tracking-wide uppercase text-stone-900 dark:text-white">
                Hypertrophy Volume Landmarks
              </h3>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                Scientific MEV / Optimal / MRV Thresholds
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400">
              {totalVolumeSets}
            </span>
            <span className="text-[9.5px] font-mono text-stone-400 block">Working Sets</span>
          </div>
        </div>
      )}

      {/* Muscle Group Volume Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {muscleGroups.map((group) => {
          const pct = Math.min(100, Math.round((group.sets / group.mrv) * 100));
          const isOptimal = group.status === 'optimal';
          const isOverMRV = group.status === 'mrv_risk';

          return (
            <div
              key={group.name}
              className="p-2.5 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {group.name}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                  <span className="font-bold text-stone-900 dark:text-white">
                    {group.sets} sets
                  </span>
                  <span className="text-stone-400 text-[9px]">/ {group.mrv} MRV</span>
                </div>
              </div>

              {/* Progress bar with landmarks */}
              <div className="relative h-2 w-full bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverMRV
                      ? 'bg-amber-500'
                      : isOptimal
                      ? 'bg-emerald-500'
                      : group.sets > 0
                      ? 'bg-red-500'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-stone-400">
                <span>MEV: {group.mev}</span>
                <span className={isOptimal ? 'text-emerald-500 font-bold' : isOverMRV ? 'text-amber-500 font-bold' : ''}>
                  {isOverMRV ? 'Exceeding MRV' : isOptimal ? 'Optimal Growth' : group.sets > 0 ? 'Stimulating' : 'Resting'}
                </span>
                <span>MRV: {group.mrv}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
