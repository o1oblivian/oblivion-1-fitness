import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown, Clock, Flame, Zap, Play, Dumbbell, Target, UserCheck, AlertCircle,
  Battery, BatteryCharging, BatteryFull, Activity, Sliders, Check, Sparkles, Compass
} from 'lucide-react';
import { ROUTINE_TEMPLATES } from '@/data/exerciseDatabase';
import { ProgramProgressTracker } from '@/components/ProgramProgressTracker';
import { useSubscription } from '@/utils/useSubscription';

interface DualLaneLauncherProps {
  onLoadExercises: (exercises: string[], source: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  connectedCoachName?: string;
  onUpgrade?: () => void;
  currentUserEmail?: string;
}

type EnergyLevel = 'low' | 'okay' | 'ready';
type GoalMode = 'burn' | 'build' | 'reset' | 'perform';
type DurationOption = 5 | 10 | 20 | 30 | 45 | 60;
type CalorieTarget = 150 | 250 | 350 | 500;

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  targetLoad: string;
  rest: string;
}

const GOAL_OPTIONS: { id: GoalMode; label: string; tag: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; iconColor: string }[] = [
  { id: 'burn', label: 'Burn kcal', tag: 'Metabolic Torch', icon: Flame, iconColor: '#C4121A' },
  { id: 'build', label: 'Build Muscle', tag: 'Hypertrophy', icon: Dumbbell, iconColor: '#C4121A' },
  { id: 'reset', label: 'Reset & Move', tag: 'Recovery & Joint Flow', icon: Activity, iconColor: '#8B5CF6' },
  { id: 'perform', label: 'Athletic Peak', tag: 'Speed & Explosiveness', icon: Zap, iconColor: '#3B82F6' },
];

const DURATION_OPTIONS: { mins: DurationOption; label: string; arcPercent: number }[] = [
  { mins: 5, label: '5m Express', arcPercent: 18 },
  { mins: 10, label: '10m Quick', arcPercent: 30 },
  { mins: 20, label: '20m Solid', arcPercent: 50 },
  { mins: 30, label: '30m Power', arcPercent: 70 },
  { mins: 45, label: '45m Deep', arcPercent: 88 },
  { mins: 60, label: '60m Total', arcPercent: 100 },
];

const GOAL_FOCUS_MAP: Record<GoalMode, { id: string; label: string }[]> = {
  burn: [
    { id: 'cardio', label: 'Full Burn' },
    { id: 'hiit', label: 'HIIT Engine' },
    { id: 'full', label: 'Full Body' },
    { id: 'core', label: 'Core Conditioning' },
  ],
  build: [
    { id: 'upper', label: 'Upper Body' },
    { id: 'lower', label: 'Lower Body' },
    { id: 'push_a', label: 'Push (Chest/Delts)' },
    { id: 'pull_a', label: 'Pull (Back/Bis)' },
    { id: 'legs_a', label: 'Legs & Calves' },
    { id: 'arms', label: 'Arms & Shoulders' },
    { id: 'glutes', label: 'Glute Power' },
  ],
  reset: [
    { id: 'reset', label: 'Mobility Flow' },
    { id: 'core', label: 'Core & Spine' },
    { id: 'upper', label: 'Thoracic & Neck' },
    { id: 'lower', label: 'Hip & Ankle Decompress' },
  ],
  perform: [
    { id: 'full', label: 'Total Power' },
    { id: 'upper', label: 'Upper Force' },
    { id: 'lower', label: 'Explosive Legs' },
    { id: 'hiit', label: 'Speed Sprints' },
  ],
};

const RESET_EXERCISES = [
  '90/90 Hip Flow & Shin Box',
  "World's Greatest Stretch",
  'Cat-Cow Spinal Waves',
  'Thoracic Spine Rotations',
  'Dead Hang Decompression',
  'Cossack Squats (Bodyweight)',
  'Band Dislocates & Pull-Aparts'
];

export const DualLaneLauncher: React.FC<DualLaneLauncherProps> = ({
  onLoadExercises,
  showToast,
  connectedCoachName,
  onUpgrade,
  currentUserEmail = '',
}) => {
  const [expandedLane, setExpandedLane] = useState<'intel' | 'coach' | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel>('okay');
  const [goalMode, setGoalMode] = useState<GoalMode>('build');
  const [calorieTarget, setCalorieTarget] = useState<CalorieTarget>(350);
  const [focus, setFocus] = useState<string>('upper');
  const [time, setTime] = useState<DurationOption>(45);
  const [generated, setGenerated] = useState<GeneratedExercise[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { canAccess } = useSubscription();
  const hasPremium = canAccess('archetypes');

  const toggleLane = (lane: 'intel' | 'coach') => {
    setExpandedLane(expandedLane === lane ? null : lane);
    setGenerated(null);
  };

  // Real-time calorie estimate calculation based on goal, energy, duration & focus
  const estCals = useMemo(() => {
    let burnRatePerMin = 7.0;
    if (goalMode === 'burn') burnRatePerMin = 9.5;
    if (goalMode === 'build') burnRatePerMin = 7.5;
    if (goalMode === 'perform') burnRatePerMin = 8.5;
    if (goalMode === 'reset') burnRatePerMin = 4.2;

    if (energy === 'low') burnRatePerMin *= 0.85;
    if (energy === 'ready') burnRatePerMin *= 1.15;

    if (focus === 'lower' || focus === 'full' || focus === 'legs_a' || focus === 'hiit') {
      burnRatePerMin *= 1.15;
    }

    return Math.round(time * burnRatePerMin);
  }, [goalMode, energy, time, focus]);

  const isCalorieGoalMet = goalMode === 'burn' ? estCals >= calorieTarget : true;

  const handleDesign = useCallback(() => {
    setIsGenerating(true);
    let templateList = ROUTINE_TEMPLATES[focus] || ROUTINE_TEMPLATES['upper'] || [];
    if (goalMode === 'reset') {
      templateList = RESET_EXERCISES;
    }

    const timeRatio = time / 60;
    const count = time <= 10 ? 2 : time <= 20 ? 3 : Math.max(3, Math.min(templateList.length, Math.round(templateList.length * timeRatio + 2)));
    const shuffled = [...templateList].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const exercises: GeneratedExercise[] = selected.map((name, idx) => {
      const isCompound = ['squat', 'bench', 'deadlift', 'press', 'row', 'pull-up'].some(k => name.toLowerCase().includes(k));
      let sets = time <= 10 ? 2 : time <= 20 ? 3 : 4;
      if (energy === 'ready') sets = Math.min(5, sets + 1);
      if (energy === 'low') sets = Math.max(2, sets - 1);

      let reps = '10-12';
      let rest = '60s';
      let targetLoad = isCompound ? '80% 1RM' : 'RPE 8';

      if (goalMode === 'reset') {
        reps = '45-60s';
        rest = '30s';
        targetLoad = 'BW';
      } else if (goalMode === 'burn') {
        reps = '15-20';
        rest = '45s';
        targetLoad = 'Moderate';
      } else if (isCompound) {
        reps = energy === 'ready' ? '6-8' : '8-10';
        rest = '90-120s';
      }

      return {
        name,
        sets,
        reps,
        targetLoad,
        rest
      };
    });

    setTimeout(() => {
      setGenerated(exercises);
      setIsGenerating(false);
    }, 350);
  }, [focus, goalMode, time, energy]);

  const handleLoadIntel = () => {
    if (!generated?.length) return;
    onLoadExercises(generated.map(e => e.name), `Intel Coach (${time}m • ${goalMode})`);
    showToast(`${generated.length} exercises loaded into active log`, 'success');
    setExpandedLane(null);
    setGenerated(null);
  };

  return (
    <div className="space-y-3">
      {/* Two Lane Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Intel Coach */}
        <button
          onClick={() => toggleLane('intel')}
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 active:scale-[0.97] cursor-pointer ${
            expandedLane === 'intel'
              ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] text-zinc-900 dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              expandedLane === 'intel'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700'
            }`}>
              <Sparkles className="w-4 h-4 text-[#4285F4]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[11px] font-extrabold leading-none">Intel Coach</div>
              <div className={`text-[9px] font-semibold mt-0.5 ${expandedLane === 'intel' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>Adaptive Session Designer</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 shrink-0 ${expandedLane === 'intel' ? 'rotate-180 text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
          </div>
        </button>

        {/* My Coach */}
        <button
          onClick={() => toggleLane('coach')}
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 active:scale-[0.97] cursor-pointer ${
            expandedLane === 'coach'
              ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] text-zinc-900 dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              expandedLane === 'coach'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700'
            }`}>
              <UserCheck className="w-4 h-4 text-[#C4121A] dark:text-[#D91F28]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[11px] font-extrabold leading-none">My Coach</div>
              <div className={`text-[9px] font-semibold mt-0.5 truncate ${expandedLane === 'coach' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {connectedCoachName || 'Assigned workouts'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 shrink-0 ${expandedLane === 'coach' ? 'rotate-180 text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
          </div>
        </button>
      </div>

      {/* Intel Coach Expanded Designer */}
      {expandedLane === 'intel' && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden animate-fadeIn text-zinc-900 dark:text-white">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <Sliders className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider block">Intel Session Engine</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Autoregulated training prescription</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#C4121A] dark:text-[#D91F28] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              INTEL ADAPTIVE
            </span>
          </div>

          {/* 1. Energy Level Check-in */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Battery className="w-3 h-3 text-zinc-400" /> 1. Energy Check-In
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {energy === 'low' ? 'Gentle load • Reset volume' : energy === 'ready' ? '100% Peak Output' : 'Standard Baseline'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setEnergy('low'); setGenerated(null); }}
                className={`py-2 px-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  energy === 'low'
                    ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">Low</span>
                  <Battery className="w-3.5 h-3.5 text-[#4285F4]" />
                </div>
                <div className={`text-[9px] ${energy === 'low' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>Reset & Ease</div>
              </button>

              <button
                type="button"
                onClick={() => { setEnergy('okay'); setGenerated(null); }}
                className={`py-2 px-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  energy === 'okay'
                    ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">Steady</span>
                  <BatteryCharging className="w-3.5 h-3.5 text-[#FBBC05]" />
                </div>
                <div className={`text-[9px] ${energy === 'okay' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>Solid Work</div>
              </button>

              <button
                type="button"
                onClick={() => { setEnergy('ready'); setGenerated(null); }}
                className={`py-2 px-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  energy === 'ready'
                    ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 shadow-md'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase">Prime</span>
                  <BatteryFull className="w-3.5 h-3.5 text-[#34A853]" />
                </div>
                <div className={`text-[9px] ${energy === 'ready' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>Full Attack</div>
              </button>
            </div>
          </div>

          {/* 2. Goal Mode Selector */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3 h-3 text-[#4285F4]" /> 2. Training Goal Mode
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOAL_OPTIONS.map((g) => {
                const isSelected = goalMode === g.id;
                const Icon = g.icon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGoalMode(g.id);
                      const available = GOAL_FOCUS_MAP[g.id];
                      if (available?.[0]) setFocus(available[0].id);
                      setGenerated(null);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className="w-4 h-4" style={{ color: g.iconColor }} />
                      {isSelected && <Check className="w-3.5 h-3.5" style={{ color: g.iconColor }} />}
                    </div>
                    <div className="text-xs font-bold tracking-tight">{g.label}</div>
                    <div className={`text-[9px] mt-0.5 truncate ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>{g.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calorie Burn Target Selector (in Burn Mode) */}
          {goalMode === 'burn' && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#C4121A] dark:text-[#D91F28]" /> Target Caloric Output
                </span>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Est: {estCals} kcal</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([150, 250, 350, 500] as CalorieTarget[]).map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setCalorieTarget(target)}
                    className={`py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      calorieTarget === target
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                    }`}
                  >
                    {target} kcal
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Duration Selector with Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-zinc-400" /> 3. Available Duration
              </div>
              <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 font-bold">{time} Minutes Selected</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
              </div>
              <select
                id="select-intel-duration"
                value={time}
                onChange={(e) => {
                  setTime(Number(e.target.value) as DurationOption);
                  setGenerated(null);
                }}
                className="w-full h-11 pl-10 pr-10 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 rounded-2xl text-xs font-mono font-bold text-zinc-900 dark:text-white tracking-wide transition-all cursor-pointer appearance-none outline-none"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.mins} value={d.mins} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white py-1">
                    {d.mins} Minutes — {d.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 4. Focus Area */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-zinc-400" /> 4. Movement Focus
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(GOAL_FOCUS_MAP[goalMode] || []).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setFocus(f.id); setGenerated(null); }}
                  className={`py-1.5 px-3 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    focus === f.id
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Stats Ribbon */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{time}m</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono">
                <Flame className="w-3.5 h-3.5 text-[#C4121A] dark:text-[#D91F28]" />
                <span>~{estCals} kcal</span>
              </div>
              {goalMode === 'burn' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCalorieGoalMet ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  {isCalorieGoalMet ? 'Target Hit' : 'Under Target'}
                </span>
              )}
            </div>

            <button
              onClick={handleDesign}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Building...</span>
              ) : (
                <><Zap className="w-3 h-3 text-[#C4121A] dark:text-[#D91F28]" />Design Session</>
              )}
            </button>
          </div>

          {/* Generated Plan & Load Button */}
          {generated && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                  Prescription — {generated.length} movements
                </div>
                <div className="text-[10px] font-bold text-[#C4121A] dark:text-[#D91F28] flex items-center gap-0.5 font-mono">
                  <Flame className="w-2.5 h-2.5" />~{estCals} kcal
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {generated.map((ex, i) => (
                  <div key={ex.name + i} className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-white truncate max-w-[180px]">{ex.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      {ex.sets} × {ex.reps} • {ex.targetLoad}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleLoadIntel}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />Load into Active Log
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Coach Expanded */}
      {expandedLane === 'coach' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Progressive Program Tracker */}
          <ProgramProgressTracker
            currentUserEmail={currentUserEmail}
            showToast={showToast}
            onLoadExercises={(exercises, source) => {
              onLoadExercises(exercises, source);
              setExpandedLane(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

