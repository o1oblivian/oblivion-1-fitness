import React, { useState } from 'react';
import { EXERCISE_DATABASE } from '../../../../data/exerciseDatabase';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useWorkoutStore } from '../../store/useWorkoutStore';

export const BlueprintSwapper: React.FC = () => {
  const exercises = useWorkoutStore((s) => s.exercises);
  const swapExercise = useWorkoutStore((s) => s.swapExercise);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const target = exercises.find((ex) => ex.id === selectedId) || exercises[0];
  if (!target) return null;

  const muscle = target.targetMuscle.toLowerCase();
  const alternatives = EXERCISE_DATABASE.filter(
    (def) =>
      def.name.toLowerCase() !== target.name.toLowerCase() &&
      (def.category.toLowerCase().includes(muscle.split(' ')[0]) || muscle.includes(def.category.toLowerCase().split(' ')[0]))
  ).slice(0, 5);

  const applySwap = (alt: (typeof EXERCISE_DATABASE)[number]) => {
    tactileEngine.playPRCelebration();
    swapExercise(target.id, {
      name: alt.name,
      targetMuscle: alt.category,
      equipment: alt.equipment,
      restSecs: alt.restSecs || 90,
    });
  };

  return (
    <div className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-neutral-500 tracking-wider">Biomechanic Swapper</span>
        <span className="text-[10px] text-neutral-400 truncate max-w-[180px]">Replace {target.name}</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {exercises.map((ex) => {
          const isSelected = ex.id === target.id;
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setSelectedId(ex.id);
              }}
              aria-pressed={isSelected}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium whitespace-nowrap transition-all border cursor-pointer ${
                isSelected ? 'bg-o1-sheet text-o1-text border-o1-crimson' : 'bg-o1-card text-neutral-400 border-white/[0.07]'
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
            <div key={alt.id} className="flex items-center justify-between p-2 rounded-xl bg-o1-card border border-white/[0.07]">
              <div>
                <div className="text-xs font-medium text-white">{alt.name}</div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {alt.category} • {alt.equipment}
                </div>
              </div>
              <button
                type="button"
                onClick={() => applySwap(alt)}
                className="px-2.5 py-1 rounded-xl bg-o1-crimson text-white text-[10px] font-medium tracking-wider hover:bg-o1-crimson-hover cursor-pointer"
              >
                Swap
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-center text-neutral-500 py-1">No matching alternatives found for this movement pattern.</div>
      )}
    </div>
  );
};

export default BlueprintSwapper;
