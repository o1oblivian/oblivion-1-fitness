import React, { useState } from 'react';
import { X, Layers, ArrowRight, Dumbbell, Target } from 'lucide-react';
import { ExerciseItem } from '../../../types';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { PRESET_SPLITS, MUSCLE_SUBSTITUTIONS, MuscleSubstitutionItem } from '../data/routineSwapperData';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';

interface RoutineSwapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePreset: string;
  onSelectPreset: (presetName: string, exercises?: ExerciseItem[]) => void;
}

export const RoutineSwapperModal: React.FC<RoutineSwapperModalProps> = ({
  isOpen,
  onClose,
  activePreset,
  onSelectPreset,
}) => {
  const [tab, setTab] = useState<'PRESETS' | 'MUSCLE_SWAP' | 'EXERCISE'>('PRESETS');
  const { exercises, swapExercise, setExercises, setActiveRoutine, showToast } = useWorkoutStore();

  // If activePreset matches an exercise ID or name, prepare single exercise alternatives
  const targetExercise = exercises.find(
    (e) => e.id === activePreset || e.name.toLowerCase() === activePreset.toLowerCase()
  ) || exercises[0];

  React.useEffect(() => {
    if (activePreset && tab !== 'EXERCISE' && exercises.some((e) => e.id === activePreset)) {
      setTab('EXERCISE');
    }
  }, [activePreset, exercises, tab]);

  if (!isOpen) return null;

  const handlePerformExerciseSwap = (altName: string, altCategory: string) => {
    tactileEngine.playPRCelebration();
    if (targetExercise) {
      swapExercise(targetExercise.id, {
        name: altName,
        targetMuscle: altCategory,
      });
      showToast(`Swapped to ${altName}`);
    }
    onClose();
  };

  const handleSelectSplit = (title: string) => {
    tactileEngine.triggerSelectionBuzz();
    setActiveRoutine(title);
    onSelectPreset(title);
    showToast(`Activated routine split: ${title}.`);
    onClose();
  };

  const handleSubstituteMuscle = (item: MuscleSubstitutionItem) => {
    tactileEngine.playPRCelebration();
    setExercises(item.exercises);
    setActiveRoutine(item.muscle);
    onSelectPreset(item.muscle, item.exercises);
    showToast(`Substituted target muscle: ${item.muscle} (${item.exercises.length} drills).`);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#0D0D10] border border-neutral-200 dark:border-[#1F1F23] w-full max-w-[480px] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl max-h-[90dvh] h-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-[#1F1F23] bg-neutral-50 dark:bg-[#121214]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-[#00E5FF]/10 text-cyan-600 dark:text-[#00E5FF]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-neutral-900 dark:text-white">
                Routine Swapper
              </h3>
              <p className="text-[10px] font-telemetry text-neutral-500 dark:text-zinc-400">
                Substitute Target Muscles &amp; Active Sets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-[#1F1F23] bg-neutral-100 dark:bg-[#08080A]">
          <button
            onClick={() => setTab('PRESETS')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'PRESETS'
                ? 'text-cyan-600 dark:text-[#00E5FF] border-b-2 border-cyan-600 dark:border-[#00E5FF] font-bold bg-white dark:bg-[#121214]'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Split Presets</span>
          </button>
          <button
            onClick={() => setTab('MUSCLE_SWAP')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'MUSCLE_SWAP'
                ? 'text-[#C4121A] dark:text-[#FF3B30] border-b-2 border-[#C4121A] dark:border-[#FF3B30] font-bold bg-white dark:bg-[#121214]'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Muscle Groups</span>
          </button>
          <button
            onClick={() => setTab('EXERCISE')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'EXERCISE'
                ? 'text-amber-500 dark:text-amber-400 border-b-2 border-amber-500 dark:border-amber-400 font-bold bg-white dark:bg-[#121214]'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Swap Drill</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {tab === 'EXERCISE' ? (
            <div className="space-y-3">
              {targetExercise ? (
                <div className="p-3 bg-neutral-50 dark:bg-[#121214] rounded-xl border border-neutral-200 dark:border-zinc-800">
                  <span className="text-[10px] font-tactical font-bold text-neutral-500 dark:text-zinc-500 uppercase tracking-wider block">
                    REPLACING ACTIVE EXERCISE:
                  </span>
                  <div className="font-tactical font-black text-sm text-neutral-900 dark:text-white uppercase mt-0.5">
                    {targetExercise.name}
                  </div>
                  <div className="text-[11px] font-sans font-medium text-amber-500 dark:text-amber-400">
                    {targetExercise.targetMuscle} • {targetExercise.sets?.length || 3} sets
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <span className="text-[10px] font-tactical font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider block">
                  SELECT ALTERNATIVE STIMULUS:
                </span>
                {EXERCISE_DATABASE.slice(0, 10).map((drill) => (
                  <div
                    key={drill.id}
                    onClick={() => handlePerformExerciseSwap(drill.name, drill.category)}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-[#1F1F23] bg-neutral-50 dark:bg-[#121214] hover:border-amber-400/80 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-tactical font-bold text-xs text-neutral-900 dark:text-white uppercase group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {drill.name}
                        </span>
                        <span className="text-[9px] font-sans font-bold text-neutral-600 dark:text-zinc-400 bg-neutral-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                          {drill.equipment}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-neutral-500 dark:text-zinc-500 truncate mt-0.5">
                        {drill.subLabel || drill.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-black font-tactical text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      SWAP
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'PRESETS' ? (
            PRESET_SPLITS.map((item) => {
              const isSelected = activePreset === item.title;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSplit(item.title)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-cyan-50/50 dark:bg-[#121214] border-cyan-500 dark:border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                      : 'bg-neutral-50 dark:bg-[#121214] border-neutral-200 dark:border-[#1F1F23] hover:border-neutral-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical font-black text-sm uppercase text-neutral-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="text-[9px] font-tactical font-bold text-neutral-600 dark:text-zinc-400 bg-neutral-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-neutral-300 dark:border-zinc-700 uppercase tracking-wider">
                      {item.tier}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-cyan-600 dark:text-cyan-400 font-semibold">
                    {item.split}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-[#1F1F23] text-[10px] text-neutral-500 dark:text-zinc-500 font-sans">
                    <span>{item.volume}</span>
                    <span className="text-neutral-900 dark:text-white flex items-center gap-1 font-tactical font-bold uppercase tracking-wider">
                      <span>Activate Protocol</span>
                      <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-[#00E5FF]" />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            MUSCLE_SUBSTITUTIONS.map((item) => (
              <div
                key={item.muscle}
                onClick={() => handleSubstituteMuscle(item)}
                className="p-3.5 rounded-2xl border border-neutral-200 dark:border-[#1F1F23] bg-neutral-50 dark:bg-[#121214] hover:border-[#FF3B30] cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-tactical font-black text-sm uppercase text-neutral-900 dark:text-white">
                    {item.muscle}
                  </span>
                  <span className="text-[9px] font-tactical font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full border border-[#FF3B30]/30 uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="text-xs text-neutral-800 dark:text-zinc-300 flex items-center justify-between bg-white dark:bg-[#08080A] px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#1F1F23]"
                    >
                      <span className="font-sans font-medium">{ex.name}</span>
                      <span className="font-sans text-[10px] text-neutral-500 dark:text-zinc-500">
                        {ex.sets.length} sets • {ex.targetMuscle}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-[#1F1F23] text-[10px] text-[#FF3B30] font-tactical font-bold uppercase tracking-wider">
                  <span>Substitute Active Sets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
