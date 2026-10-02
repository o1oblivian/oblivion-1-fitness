import React from 'react';
import { X, Check, Utensils } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface DietOption {
  key: string;
  label: string;
  description: string;
  icon?: string;
}

export const DIET_OPTIONS: DietOption[] = [
  {
    key: 'Omnivore',
    label: 'Omnivore',
    description: 'All athletic whole foods (meat, poultry, wild fish, dairy, eggs & plants)',
    icon: '🥩',
  },
  {
    key: 'Vegetarian',
    label: 'Vegetarian',
    description: 'Plant-based foods, Greek dairy, eggs, whey & legumes (no meat or fish)',
    icon: '🥗',
  },
  {
    key: 'Vegan',
    label: 'Vegan',
    description: '100% plant whole foods (tofu, tempeh, legumes, grains, seeds, nuts)',
    icon: '🌱',
  },
  {
    key: 'Pescatarian',
    label: 'Pescatarian',
    description: 'Wild fish, seafood, dairy, eggs & plants (no poultry or red meat)',
    icon: '🐟',
  },
  {
    key: 'Carnivore',
    label: 'Carnivore',
    description: 'Pure animal-based: beef, poultry, wild catch & eggs (zero plant foods)',
    icon: '🍖',
  },
  {
    key: 'Paleo',
    label: 'Paleo',
    description: 'Unprocessed ancestral whole foods: meats, fish, eggs, veggies & roots (no grains)',
    icon: '🥑',
  },
];

interface DietaryPreferenceModalProps {
  isOpen: boolean;
  selectedDiet: string;
  onSelect: (diet: string) => void;
  onClose: () => void;
  inline?: boolean;
}

export const DietaryPreferenceModal: React.FC<DietaryPreferenceModalProps> = ({
  isOpen,
  selectedDiet,
  onSelect,
  onClose,
  inline = false,
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="w-full sm:w-[380px] bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/25 flex flex-col max-h-[85vh] select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C4121A] flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Dietary Protocol
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              Calibrates O1FC meal recommendations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
          className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181b] dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Diet List */}
      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
        {DIET_OPTIONS.map((d) => {
          const isSelected = selectedDiet.toLowerCase() === d.key.toLowerCase();
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelect(d.key);
                onClose();
              }}
              className={`w-full flex items-start justify-between p-3 rounded-2xl transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-red-50/80 dark:bg-red-950/30 border-[#C4121A]/30 shadow-xs'
                  : 'bg-neutral-50/50 dark:bg-[#16161a] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-800/80'
              }`}
            >
              <div className="flex items-start gap-2.5 pr-2">
                <span className="text-xl shrink-0 mt-0.5">{d.icon}</span>
                <div className="space-y-0.5">
                  <span
                    className={`text-sm font-bold block leading-snug ${
                      isSelected
                        ? 'text-[#C4121A] dark:text-red-400'
                        : 'text-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug block">
                    {d.description}
                  </span>
                </div>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#C4121A] text-white flex items-center justify-center shrink-0 mt-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/15 dark:bg-black/40"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
        />
        <div className="absolute top-full right-0 mt-2 z-50">
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-xs"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onClose();
        }}
      />
      <div className="relative z-10 max-w-sm w-full">
        {content}
      </div>
    </div>
  );
};

export default DietaryPreferenceModal;
