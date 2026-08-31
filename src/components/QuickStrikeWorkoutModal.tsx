import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, SkipForward, Check, Timer, Dumbbell, Zap, Flame } from 'lucide-react';

export interface QuickWorkoutExercise {
  name: string;
  durationSecs: number;
  reps?: string;
  cue: string;
}

export interface QuickWorkout {
  id: string;
  title: string;
  subtitle: string;
  durationMin: number;
  intensity: 'Low' | 'Moderate' | 'High';
  equipment: string;
  target: string;
  exercises: QuickWorkoutExercise[];
}

export const getQuickWorkoutCalories = (workout: QuickWorkout): { min: number; max: number } => {
  const caloriesPerMinute = workout.intensity === 'High' ? 11 : workout.intensity === 'Moderate' ? 8 : 5;
  const midpoint = workout.durationMin * caloriesPerMinute;
  return {
    min: Math.round(midpoint * 0.85),
    max: Math.round(midpoint * 1.15),
  };
};

export const QUICK_WORKOUTS: QuickWorkout[] = [
  {
    id: 'qs1',
    title: 'Desk Body Reset',
    subtitle: 'Between meetings mobility',
    durationMin: 7,
    intensity: 'Low',
    equipment: 'None',
    target: 'Posture & hips',
    exercises: [
      { name: 'Cat-Cow Flow', durationSecs: 45, cue: 'Slow spinal waves, sync with breath' },
      { name: 'Hip Flexor Lunge Stretch', durationSecs: 45, cue: 'Sink into lunge, hold 15s each side' },
      { name: 'Thoracic Rotations', durationSecs: 45, cue: 'Kneeling, rotate torso to each side' },
      { name: 'Standing Forward Fold', durationSecs: 40, cue: 'Let gravity pull you down, relax neck' },
      { name: 'Wall Slides', durationSecs: 40, cue: 'Keep wrists and elbows on wall' },
      { name: 'Glute Bridge Walkouts', durationSecs: 40, cue: 'Bridge up, walk feet out and in' },
      { name: 'Neck & Shoulder Release', durationSecs: 35, cue: 'Slow circles, 5 each direction' },
      { name: 'Standing Side Bends', durationSecs: 35, cue: 'Reach overhead, lean to each side' },
    ],
  },
  {
    id: 'qs2',
    title: 'Explosive Power Burst',
    subtitle: 'Lunch break burner',
    durationMin: 10,
    intensity: 'High',
    equipment: 'None',
    target: 'Full body power',
    exercises: [
      { name: 'Jump Squats', durationSecs: 40, reps: '12 reps', cue: 'Explode up, land soft' },
      { name: 'Rest', durationSecs: 15, cue: 'Shake it out' },
      { name: 'Plyo Push-ups', durationSecs: 40, reps: '8 reps', cue: 'Hands leave floor at top' },
      { name: 'Rest', durationSecs: 15, cue: 'Breathe' },
      { name: 'Mountain Climbers', durationSecs: 45, reps: '40 reps', cue: 'Drive knees fast' },
      { name: 'Rest', durationSecs: 15, cue: 'Reset' },
      { name: 'Burpee Broad Jumps', durationSecs: 45, reps: '8 reps', cue: 'Burpee then jump forward max distance' },
      { name: 'Rest', durationSecs: 15, cue: 'Deep breath' },
      { name: 'Alternating Split Squat Jumps', durationSecs: 40, reps: '10 reps', cue: 'Switch legs mid-air' },
      { name: 'Plank Hold', durationSecs: 45, cue: 'Tight core, breathe steadily' },
    ],
  },
  {
    id: 'qs3',
    title: 'Dumbbell Express',
    subtitle: 'Quick hypertrophy hit',
    durationMin: 5,
    intensity: 'Moderate',
    equipment: 'Dumbbells',
    target: 'Upper body',
    exercises: [
      { name: 'DB Goblet Squat', durationSecs: 50, reps: '12 reps', cue: 'Keep chest tall, elbows in' },
      { name: 'Rest', durationSecs: 10, cue: 'Grab weights' },
      { name: 'DB Shoulder Press', durationSecs: 50, reps: '10 reps', cue: 'Press overhead, slow eccentric' },
      { name: 'Rest', durationSecs: 10, cue: 'Shake arms out' },
      { name: 'DB Row (Both Arms)', durationSecs: 50, reps: '12 reps', cue: 'Squeeze shoulder blades' },
      { name: 'Rest', durationSecs: 10, cue: 'Almost there' },
      { name: 'DB Curl Complex', durationSecs: 50, reps: '10 reps', cue: 'Control the descent' },
    ],
  },
  {
    id: 'qs4',
    title: 'Core Inferno',
    subtitle: '7-minute ab destroyer',
    durationMin: 7,
    intensity: 'Moderate',
    equipment: 'Mat',
    target: 'Core & abs',
    exercises: [
      { name: 'Dead Bugs', durationSecs: 45, cue: 'Opposite arm and leg, slow tempo' },
      { name: 'Hollow Body Hold', durationSecs: 40, cue: 'Lower back pressed into floor' },
      { name: 'Russian Twists', durationSecs: 45, cue: 'Feet hover, twist with control' },
      { name: 'Bicycle Crunches', durationSecs: 45, cue: 'Slow and deliberate, not fast' },
      { name: 'Side Plank (Right)', durationSecs: 35, cue: 'Hips high, don\'t sag' },
      { name: 'Side Plank (Left)', durationSecs: 35, cue: 'Hips high, don\'t sag' },
      { name: 'Leg Raises', durationSecs: 45, cue: 'Lower slowly, no swinging' },
      { name: 'Plank to Push-up', durationSecs: 40, cue: 'Move from forearms to hands' },
    ],
  },
  {
    id: 'qs5',
    title: 'Zone 2 Cardio Flush',
    subtitle: 'Recovery & longevity',
    durationMin: 5,
    intensity: 'Low',
    equipment: 'None',
    target: 'Cardio & recovery',
    exercises: [
      { name: 'Brisk Walk / Jog', durationSecs: 60, cue: 'Nose breathing only, stay in Zone 2' },
      { name: 'Step-ups', durationSecs: 50, cue: 'Alternate legs, steady pace' },
      { name: 'Marching in Place', durationSecs: 45, cue: 'Knees to hip height, arms pumping' },
      { name: 'Walking Lunges', durationSecs: 50, cue: 'Long strides, controlled tempo' },
      { name: 'Arm Circles + Walk', durationSecs: 45, cue: 'Big circles forward then back' },
    ],
  },
  {
    id: 'qs6',
    title: 'Kettlebell Crusher',
    subtitle: 'Posterior chain power',
    durationMin: 8,
    intensity: 'High',
    equipment: 'Kettlebell',
    target: 'Glutes & hamstrings',
    exercises: [
      { name: 'KB Swing', durationSecs: 40, reps: '15 reps', cue: 'Hinge at hips, snap glutes' },
      { name: 'Rest', durationSecs: 20, cue: 'Reset grip' },
      { name: 'KB Goblet Squat', durationSecs: 40, reps: '12 reps', cue: 'Deep squat, drive through heels' },
      { name: 'Rest', durationSecs: 15, cue: 'Breathe' },
      { name: 'KB Deadlift', durationSecs: 40, reps: '12 reps', cue: 'Hinge, not squat. Feel hamstrings' },
      { name: 'Rest', durationSecs: 15, cue: 'Shake it out' },
      { name: 'KB Single-arm Row', durationSecs: 35, reps: '10 each', cue: 'Squeeze at top, control down' },
      { name: 'Rest', durationSecs: 15, cue: 'Switch sides' },
      { name: 'KB Swing (Fast)', durationSecs: 40, reps: '20 reps', cue: 'Max power, full hip extension' },
      { name: 'KB Carry', durationSecs: 30, cue: 'Rack position, walk tall' },
    ],
  },
];

interface QuickStrikeWorkoutModalProps {
  workout: QuickWorkout;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (workout: QuickWorkout) => void;
}

export const QuickStrikeWorkoutModal: React.FC<QuickStrikeWorkoutModalProps> = ({
  workout,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'rest' | 'complete'>('intro');
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = workout.exercises[exerciseIdx];
  const calories = getQuickWorkoutCalories(workout);
  const caloriesPerMinute = workout.intensity === 'High' ? 11 : workout.intensity === 'Moderate' ? 8 : 5;
  const currentExerciseCalories = Math.max(1, Math.round((currentExercise?.durationSecs || 0) / 60 * caloriesPerMinute));
  const totalExercises = workout.exercises.length;
  const progressPct = (completedExercises.length / totalExercises) * 100;

  useEffect(() => {
    if (!isOpen) {
      setPhase('intro');
      setExerciseIdx(0);
      setSecondsLeft(0);
      setIsPaused(false);
      setCompletedExercises([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if ((phase === 'active' || phase === 'rest') && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next exercise or complete
            if (phase === 'rest') {
              if (exerciseIdx + 1 < totalExercises) {
                const nextIdx = exerciseIdx + 1;
                setExerciseIdx(nextIdx);
                setSecondsLeft(workout.exercises[nextIdx].durationSecs);
                setPhase('active');
              } else {
                setPhase('complete');
              }
            } else {
              // Was active — mark complete, check if next is rest or end
              setCompletedExercises((prev) => [...prev, exerciseIdx]);
              if (exerciseIdx + 1 < totalExercises) {
                const nextIdx = exerciseIdx + 1;
                const nextEx = workout.exercises[nextIdx];
                if (nextEx.name === 'Rest') {
                  setExerciseIdx(nextIdx);
                  setSecondsLeft(nextEx.durationSecs);
                  setPhase('rest');
                } else {
                  setExerciseIdx(nextIdx);
                  setSecondsLeft(nextEx.durationSecs);
                  setPhase('active');
                }
              } else {
                setPhase('complete');
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, isPaused, exerciseIdx, totalExercises, workout]);

  const handleStartAt = (index: number) => {
    const selectedExercise = workout.exercises[index];
    setExerciseIdx(index);
    setSecondsLeft(selectedExercise.durationSecs);
    setPhase(selectedExercise.name === 'Rest' ? 'rest' : 'active');
    setIsPaused(false);
  };

  const handleStart = () => {
    setCompletedExercises([]);
    handleStartAt(0);
  };

  const handleSkip = () => {
    if (phase === 'rest') {
      if (exerciseIdx + 1 < totalExercises) {
        const nextIdx = exerciseIdx + 1;
        setExerciseIdx(nextIdx);
        setSecondsLeft(workout.exercises[nextIdx].durationSecs);
        setPhase('active');
      } else {
        setPhase('complete');
      }
    } else {
      setCompletedExercises((prev) => [...prev, exerciseIdx]);
      if (exerciseIdx + 1 < totalExercises) {
        const nextIdx = exerciseIdx + 1;
        const nextEx = workout.exercises[nextIdx];
        if (nextEx.name === 'Rest') {
          setExerciseIdx(nextIdx);
          setSecondsLeft(nextEx.durationSecs);
          setPhase('rest');
        } else {
          setExerciseIdx(nextIdx);
          setSecondsLeft(nextEx.durationSecs);
          setPhase('active');
        }
      } else {
        setPhase('complete');
      }
    }
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const intensityColor =
    workout.intensity === 'High' ? '#FF453A' :
    workout.intensity === 'Moderate' ? '#FF9F0A' : '#30D158';

  return createPortal(
    <div className="fixed inset-0 z-[999] w-screen h-[100dvh] bg-white dark:bg-[#14171F] overflow-hidden" role="dialog" aria-modal="true" aria-label={`${workout.title} workout`}>
      <div className="w-full h-full bg-white dark:bg-[#14171F] overflow-y-auto overscroll-contain border-0 rounded-none flex flex-col">
        {/* ─── INTRO PHASE ─── */}
        {phase === 'intro' && (
          <div className="flex flex-col h-full">
            {/* Compact header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${intensityColor}18`, border: `1px solid ${intensityColor}35` }}>
                  <Zap className="w-4.5 h-4.5" style={{ color: intensityColor }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight truncate">{workout.title}</h2>
                  <p className="text-[11px] text-gray-400 dark:text-white/45 font-medium truncate">{workout.subtitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="btn-nude-close" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single-line stat strip */}
            <div className="mx-4 mt-1 mb-2 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/8 flex items-center justify-around text-[11px] shrink-0">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-white/70">
                <Timer className="w-3.5 h-3.5 text-zinc-400 dark:text-white/35" />
                <span className="font-bold text-zinc-900 dark:text-white">{workout.durationMin}m</span>
              </div>
              <span className="text-zinc-300 dark:text-white/15">|</span>
              <div className="flex items-center gap-1 font-semibold" style={{ color: intensityColor }}>
                <Flame className="w-3.5 h-3.5" />
                <span>{calories.min}-{calories.max}</span>
              </div>
              <span className="text-zinc-300 dark:text-white/15">|</span>
              <div className="flex items-center gap-1 text-zinc-500 dark:text-white/70">
                <Dumbbell className="w-3.5 h-3.5 text-zinc-400 dark:text-white/35" />
                <span>{workout.equipment}</span>
              </div>
              <span className="text-zinc-300 dark:text-white/15">|</span>
              <div className="flex items-center gap-1 text-zinc-500 dark:text-white/70">
                <Zap className="w-3.5 h-3.5 text-zinc-400 dark:text-white/35" />
                <span className="truncate">{workout.target.split('&')[0].trim()}</span>
              </div>
            </div>

            {/* Exercise list -- scrollable, tight rows */}
            <div className="flex-1 overflow-y-auto px-4 pb-28">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-white/35">{totalExercises} moves</span>
                <span className="text-[10px] font-mono text-zinc-300 dark:text-white/25">{workout.intensity} intensity</span>
              </div>
              <div className="space-y-0.5">
                {workout.exercises.map((ex, i) => {
                  const isRest = ex.name === 'Rest';
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors ${isRest ? 'opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'}`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${isRest ? 'bg-transparent text-zinc-300 dark:text-white/20' : 'bg-zinc-100 dark:bg-white/8 text-zinc-500 dark:text-white/50'}`}>
                        {isRest ? '-' : i + 1}
                      </span>
                      <span className={`text-[13px] font-semibold truncate flex-1 min-w-0 ${isRest ? 'text-zinc-300 dark:text-white/30 italic' : 'text-zinc-800 dark:text-white/90'}`}>
                        {ex.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-white/30 shrink-0 w-12 text-right">
                        {ex.reps ? ex.reps : `${ex.durationSecs}s`}
                      </span>
                      <span className="text-[10px] font-mono shrink-0 w-12 text-right" style={{ color: `${intensityColor}99` }}>
                        ~{Math.max(1, Math.round(ex.durationSecs / 60 * caloriesPerMinute))}cal
                      </span>
                      {!isRest && (
                        <button
                          type="button"
                          onClick={() => handleStartAt(i)}
                          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/8 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-600 dark:text-white flex items-center justify-center transition-colors active:scale-90 shrink-0 cursor-pointer"
                          aria-label={`Play ${ex.name}`}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Docked CTA */}
            <div className="px-4 pt-3 pb-6 bg-white/90 dark:bg-[#14171F]/90 backdrop-blur-md border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 shrink-0">
              <button
                onClick={handleStart}
                className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg cursor-pointer text-white"
                style={{ background: intensityColor }}
              >
                <Play className="w-4 h-4 fill-current" />
                Start Session
              </button>
            </div>
          </div>
        )}

        {/* ─── ACTIVE / REST PHASE ─── */}
        {(phase === 'active' || phase === 'rest') && currentExercise && (
          <div className="flex flex-col h-full">
            {/* Progress bar */}
            <div className="h-1 bg-white/5 w-full">
              <div className="h-full transition-all duration-500" style={{ width: `${progressPct}%`, background: intensityColor }} />
            </div>

            {/* Timer ring + exercise */}
            <div className="flex-1 flex flex-col items-center justify-center p-3.5 relative">
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
                  {phase === 'rest' ? 'Recover' : `Exercise ${exerciseIdx + 1} / ${totalExercises}`}
                </span>
                <button onClick={onClose} className="btn-nude-close !text-white hover:!text-white" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Circular timer */}
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={phase === 'rest' ? '#30D158' : intensityColor}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - secondsLeft / (currentExercise?.durationSecs || 1))}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black font-mono text-white tabular-nums">{formatTime(secondsLeft)}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-1">{phase === 'rest' ? 'rest' : 'remaining'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
                <Flame className="w-3.5 h-3.5" style={{ color: intensityColor }} />
                <span className="text-[11px] font-mono font-bold text-white/70">Approx. {currentExerciseCalories} kcal this move</span>
              </div>

              {/* Exercise name + cue */}
              <div className="text-center mb-6 px-2">
                <h3 className={`text-xl font-black mb-2 ${phase === 'rest' ? 'text-[#30D158]' : 'text-white'}`}>
                  {currentExercise.name}
                </h3>
                {currentExercise.reps && phase === 'active' && (
                  <span className="inline-block text-sm font-bold px-3 py-1 rounded-full bg-white/10 text-white/80 mb-2">
                    {currentExercise.reps}
                  </span>
                )}
                <p className="text-sm text-white/50 leading-relaxed">{currentExercise.cue}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                >
                  {isPaused ? <Play className="w-6 h-6 text-white fill-current" /> : <Pause className="w-6 h-6 text-white fill-current" />}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-colors active:scale-95"
                  style={{ background: `${intensityColor}30`, border: `1px solid ${intensityColor}50` }}
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </button>
              </div>
              {isPaused && (
                <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-white/30 animate-pulse">Paused</span>
              )}
            </div>
          </div>
        )}

        {/* ─── COMPLETE PHASE ─── */}
        {phase === 'complete' && (
          <div className="flex flex-col items-center justify-center p-4 min-h-[400px]">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: `${intensityColor}25`, border: `2px solid ${intensityColor}50` }}>
              <Check className="w-12 h-12" style={{ color: intensityColor }} />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Session Complete!</h2>
            <p className="text-sm text-white/50 mb-6 text-center">You crushed {workout.title} in {workout.durationMin} minutes.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mb-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-white/40 mb-1">Time</span>
                <span className="text-lg font-black text-white">{workout.durationMin}m</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-white/40 mb-1">Moves</span>
                <span className="text-lg font-black text-white">{workout.exercises.filter(e => e.name !== 'Rest').length}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-white/40 mb-1">Level</span>
                <span className="text-lg font-black" style={{ color: intensityColor }}>{workout.intensity}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <span className="block text-[9px] font-mono uppercase tracking-wider text-white/40 mb-1">Burn</span>
                <span className="text-lg font-black" style={{ color: intensityColor }}>{calories.min}-{calories.max}</span>
                <span className="block text-[8px] font-mono text-white/30">kcal approx.</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => onComplete(workout)}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm transition-all active:scale-95 shadow-lg cursor-pointer"
                style={{ background: intensityColor }}
              >
                Log Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
