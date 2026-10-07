import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
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
  isChangeOpen: boolean;
  setIsChangeOpen: (open: boolean) => void;
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
  isChangeOpen,
  setIsChangeOpen,
  isEquipOpen,
  setIsEquipOpen,
  isVolOpen,
  setIsVolOpen,
}) => {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between py-1">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            Today
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {selectedCategory} · {targetVolume} moves
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsChangeOpen(!isChangeOpen);
            setIsEquipOpen(false);
            setIsVolOpen(false);
          }}
          className="shrink-0 ml-2 h-8 px-3 rounded-full bg-o1-well border border-white/[0.07] text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          Change
        </button>
      </div>

      {isChangeOpen && (
        <div className="mt-2 rounded-2xl border border-white/[0.07] bg-black p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
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
                      ? 'bg-white text-neutral-950 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap cursor-pointer'
                      : 'bg-o1-well text-zinc-400 hover:text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap cursor-pointer border border-white/[0.07]'
                  }
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsEquipOpen(!isEquipOpen);
                  setIsVolOpen(false);
                }}
                className="text-xs text-neutral-300 font-medium hover:text-white cursor-pointer"
              >
                {selectedEquipment}
              </button>
              {isEquipOpen && (
                <div className="absolute left-0 top-full mt-1 bg-o1-card border border-white/[0.07] shadow-lg rounded-2xl p-1 z-30 min-w-[140px]">
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
                          ? 'bg-o1-well text-white font-semibold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsVolOpen(!isVolOpen);
                  setIsEquipOpen(false);
                }}
                className="text-xs text-neutral-300 font-medium hover:text-white cursor-pointer"
              >
                {targetVolume} exercises
              </button>
              {isVolOpen && (
                <div className="absolute right-0 top-full mt-1 bg-o1-card border border-white/[0.07] shadow-lg rounded-2xl p-1 z-30 min-w-[130px]">
                  {[2, 3, 4, 5, 6, 7, 8, 10, 12].map((vol) => (
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
                          ? 'bg-o1-well text-white font-semibold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {vol} Exercises
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
