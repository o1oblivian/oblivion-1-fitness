import React from 'react';
import { RotateCw } from 'lucide-react';
import { ExerciseDefinition } from '../../../../types/workout';
import { tactileEngine } from '../../../../services/tactileEngine';

interface AutoModeRoutineListProps {
  routineItems: ExerciseDefinition[];
  slotSets: Record<number, number>;
  activeSetsSlot: number | null;
  setActiveSetsSlot: (slot: number | null) => void;
  onSetSets: (slotIdx: number, num: number) => void;
  onSwapSlot: (slotIdx: number) => void;
}

export const AutoModeRoutineList: React.FC<AutoModeRoutineListProps> = ({
  routineItems,
  slotSets,
  activeSetsSlot,
  setActiveSetsSlot,
  onSetSets,
  onSwapSlot,
}) => {
  const getMechanicLabel = (item: ExerciseDefinition) => {
    if (item.mechanic) {
      return item.mechanic.charAt(0).toUpperCase() + item.mechanic.slice(1);
    }
    return 'Compound';
  };

  const getEquipmentLabel = (item: ExerciseDefinition) => {
    if (item.equipment) {
      return item.equipment.charAt(0).toUpperCase() + item.equipment.slice(1);
    }
    return 'Barbell';
  };

  return (
    <div className="space-y-2 mb-3">
      {routineItems.map((exercise, index) => {
        const sets =
          slotSets[index] !== undefined ? slotSets[index] : exercise.defaultSets || 3;
        return (
          <div
            key={`${exercise.id}-${index}`}
            className="bg-o1-well rounded-xl p-2.5 text-white flex items-center justify-between transition-colors border border-white/[0.07]"
          >
            {/* Left: Index, Title & Subtitle */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-neutral-400 font-mono">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-white">
                  {exercise.name}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-normal mt-0.5 ml-4">
                {exercise.subLabel || `${getMechanicLabel(exercise)} · ${getEquipmentLabel(exercise)}`}
              </div>
            </div>

            {/* Right: Sets Picker & Swap Trigger */}
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() =>
                  setActiveSetsSlot(activeSetsSlot === index ? null : index)
                }
                className="bg-o1-card hover:bg-white/[0.06] text-neutral-200 text-xs font-medium px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-colors border border-white/[0.07]"
              >
                {sets} sets ▾
              </button>
              {activeSetsSlot === index && (
                <div className="absolute right-8 top-full mt-1 bg-o1-card border border-white/[0.07] shadow-lg rounded-xl py-1 z-30 min-w-[75px]">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        onSetSets(index, num);
                        setActiveSetsSlot(null);
                      }}
                      className={`w-full text-center px-2 py-1 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer ${
                        sets === num
                          ? 'text-o1-crimson bg-red-950/40'
                          : 'text-neutral-300'
                      }`}
                    >
                      {num} sets
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => onSwapSlot(index)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
                title="Swap exercise"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
