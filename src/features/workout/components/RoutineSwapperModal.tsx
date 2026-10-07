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
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200"
    >
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] w-full flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] bg-o1-card">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-white">
                Routine Swapper
              </h3>
              <p className="text-[10px] font-telemetry text-zinc-400">
                Substitute Target Muscles &amp; Active Sets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.05] bg-black">
          <button
            onClick={() => setTab('PRESETS')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'PRESETS'
                ? 'text-[#0EA5E9] border-b-2 border-[#0EA5E9] font-bold bg-o1-card'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Split Presets</span>
          </button>
          <button
            onClick={() => setTab('MUSCLE_SWAP')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'MUSCLE_SWAP'
                ? 'text-[#EF4444] border-b-2 border-[#EF4444] font-bold bg-o1-card'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Muscle Groups</span>
          </button>
          <button
            onClick={() => setTab('EXERCISE')}
            className={`flex-1 py-2.5 text-xs font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'EXERCISE'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold bg-o1-card'
                : 'text-zinc-400 hover:text-zinc-200'
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
                <div className="p-3 bg-o1-card rounded-xl border border-white/[0.07]">
                  <span className="text-[10px] font-tactical font-bold text-zinc-500 uppercase tracking-wider block">
                    REPLACING ACTIVE EXERCISE:
                  </span>
                  <div className="font-tactical font-black text-sm text-white uppercase mt-0.5">
                    {targetExercise.name}
                  </div>
                  <div className="text-[11px] font-sans font-medium text-amber-400">
                    {targetExercise.targetMuscle} • {targetExercise.sets?.length || 3} sets
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <span className="text-[10px] font-tactical font-bold text-zinc-400 uppercase tracking-wider block">
                  SELECT ALTERNATIVE STIMULUS:
                </span>
                {EXERCISE_DATABASE.slice(0, 10).map((drill) => (
                  <div
                    key={drill.id}
                    onClick={() => handlePerformExerciseSwap(drill.name, drill.category)}
                    className="p-3 rounded-xl border border-white/[0.07] bg-o1-card hover:border-amber-400/80 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-tactical font-bold text-xs text-white uppercase group-hover:text-amber-400 transition-colors">
                          {drill.name}
                        </span>
                        <span className="text-[9px] font-sans font-bold text-zinc-400 bg-white/[0.08] px-1.5 py-0.5 rounded uppercase">
                          {drill.equipment}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-zinc-500 truncate mt-0.5">
                        {drill.subLabel || drill.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black font-tactical text-[10px] font-black uppercase tracking-wider transition-all"
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
                      ? 'bg-o1-card border-[#0EA5E9] '
                      : 'bg-o1-card border-white/[0.07] hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical font-black text-sm uppercase text-white">
                      {item.title}
                    </span>
                    <span className="text-[9px] font-tactical font-bold text-zinc-400 bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/[0.07] uppercase tracking-wider">
                      {item.tier}
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-sky-400 font-semibold">
                    {item.split}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05] text-[10px] text-zinc-500 font-sans">
                    <span>{item.volume}</span>
                    <span className="text-white flex items-center gap-1 font-tactical font-bold uppercase tracking-wider">
                      <span>Activate Protocol</span>
                      <ArrowRight className="w-3 h-3 text-[#0EA5E9]" />
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
                className="p-3.5 rounded-2xl border border-white/[0.07] bg-o1-card hover:border-[#EF4444] cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-tactical font-black text-sm uppercase text-white">
                    {item.muscle}
                  </span>
                  <span className="text-[9px] font-tactical font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-full border border-[#EF4444]/30 uppercase tracking-wider">
                    {item.tag}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="text-xs text-zinc-300 flex items-center justify-between bg-black px-2.5 py-1.5 rounded-xl border border-white/[0.07]"
                    >
                      <span className="font-sans font-medium">{ex.name}</span>
                      <span className="font-sans text-[10px] text-zinc-500">
                        {ex.sets.length} sets • {ex.targetMuscle}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05] text-[10px] text-[#EF4444] font-tactical font-bold uppercase tracking-wider">
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
