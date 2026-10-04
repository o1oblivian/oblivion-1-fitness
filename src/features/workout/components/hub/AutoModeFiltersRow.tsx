import React from 'react';
import { ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { EQUIPMENT_OPTIONS } from './hubConstants';

interface AutoModeFiltersRowProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  currentChips: string[];
  selectedEquipment: string;
  onSelectEquipment: (eq: string) => void;
  targetVolume: number;
  onSelectTargetVolume: (vol: number) => void;
  isEquipOpen: boolean;
  setIsEquipOpen: (open: boolean) => void;
  isVolOpen: boolean;
  setIsVolOpen: (open: boolean) => void;
}

export const AutoModeFiltersRow: React.FC<AutoModeFiltersRowProps> = ({
  selectedCategory,
  onSelectCategory,
  currentChips,
  selectedEquipment,
  onSelectEquipment,
  targetVolume,
  onSelectTargetVolume,
  isEquipOpen,
  setIsEquipOpen,
  isVolOpen,
  setIsVolOpen,
}) => {
  return (
    <>
      {/* Row 1: Discipline Category & Equipment */}
      <div className="flex items-center justify-between py-1 relative">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white tracking-wide">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span className="uppercase">{selectedCategory}</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsEquipOpen(!isEquipOpen)}
            className="text-xs text-neutral-600 dark:text-neutral-300 font-medium hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
          >
            <span>{selectedEquipment}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          {isEquipOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#18181F] border border-neutral-200 dark:border-white/10 shadow-lg rounded-2xl p-1 z-30 min-w-[140px]">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    onSelectEquipment(eq);
                    setIsEquipOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    selectedEquipment === eq
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Muscle Group Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none my-1">
        {currentChips.map((chip) => {
          const isSelected = selectedCategory.toLowerCase() === chip.toLowerCase();
          return (
            <button
              key={chip}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectCategory(chip);
              }}
              className={
                isSelected
                  ? 'bg-red-600 text-white text-xs font-semibold px-3.5 py-1 rounded-full shadow-sm whitespace-nowrap cursor-pointer'
                  : 'bg-neutral-100 dark:bg-[#0E0E11] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-medium px-3.5 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer border border-transparent dark:border-white/5'
              }
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Row 3: Target Volume & Exercise Count */}
      <div className="flex items-center justify-between py-1 mb-2 relative">
        <span className="text-xs text-neutral-400 font-medium">Target Volume</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsVolOpen(!isVolOpen)}
            className="text-xs text-neutral-600 dark:text-neutral-300 font-medium hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
          >
            <span>{targetVolume} Exercises</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          {isVolOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#18181F] border border-neutral-200 dark:border-white/10 shadow-lg rounded-2xl p-1 z-30 min-w-[130px]">
              {[3, 4, 5, 6, 7, 8].map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    onSelectTargetVolume(vol);
                    setIsVolOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    targetVolume === vol
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                  }`}
                >
                  {vol} Exercises
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
