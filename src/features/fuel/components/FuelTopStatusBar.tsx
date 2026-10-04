import React, { useState } from 'react';
import { Utensils, ChevronDown, Scale, Flame } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { COUNTRIES } from './ClientCountryMarketModal';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';

export interface FuelTopStatusBarProps {
  countryMarket?: string;
  countryCode?: string;
  dietPreference?: string;
  selectedDiet?: string;
  weightKg?: number;
  remainingKcal?: number;
  dailyTargetKcal?: number;
  onOpenCountryModal?: () => void;
  onOpenDietModal?: () => void;
  onToggleDiet?: () => void;
  onSaveWeight?: (newWeight: number) => void;
  isCountryModalOpen?: boolean;
  isDietModalOpen?: boolean;
  isDietOpen?: boolean;
  onCloseCountry?: () => void;
  onSelectCountry?: (code: string) => void;
  onCloseDiet?: () => void;
  onSelectDiet?: (diet: string) => void;
}

export const FuelTopStatusBar: React.FC<FuelTopStatusBarProps> = ({
  countryMarket = 'AU',
  countryCode,
  dietPreference = 'Omnivore',
  selectedDiet,
  weightKg = 78.5,
  onOpenCountryModal,
  onOpenDietModal,
  onToggleDiet,
  onSaveWeight,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [inputWeight, setInputWeight] = useState(weightKg ? weightKg.toString() : '');

  React.useEffect(() => {
    if (weightKg) setInputWeight(weightKg.toString());
  }, [weightKg]);

  const handleSaveWeightInline = () => {
    tactileEngine.triggerImpactPulse();
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 0) {
      onSaveWeight?.(val);
    }
    setIsEditingWeight(false);
  };

  const code = (countryCode || countryMarket || 'AU').toUpperCase();
  const countryObj = COUNTRIES.find((c) => c.code === code) || { flag: '🇦🇺', name: 'Australia', code: 'AU' };
  const displayDiet = selectedDiet || dietPreference || 'Omnivore';

  return (
    <div id="fuel-top-status-bar" className="space-y-2 select-none">
      <div className="flex items-center justify-between gap-2 px-0.5 py-1">
        {/* Left: FUEL OS Title (aligned in single straight row) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Flame className="w-4 h-4 text-[#C4121A] fill-[#C4121A]/20 shrink-0" />
          <h1 className="font-telemetry font-black text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight uppercase leading-none">
            Fuel OS
          </h1>
        </div>

        {/* Right: Dropdowns cluster (Country, Diet, Weight) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Country Flag Selector */}
          <button
            type="button"
            id="fuel-country-selector-btn"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenCountryModal?.();
            }}
            title={`Country Database: ${countryObj.name} (Tap to change)`}
            className="h-8 flex items-center gap-1 px-2.5 rounded-full bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
          >
            <span className="text-sm leading-none shrink-0">{countryObj.flag}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
          </button>

          {/* 2. Diet Selector */}
          <button
            type="button"
            id="fuel-diet-selector-btn"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              if (onOpenDietModal) {
                onOpenDietModal();
              } else if (onToggleDiet) {
                onToggleDiet();
              }
            }}
            title="Select Diet Protocol"
            className="h-8 flex items-center gap-1 px-2.5 rounded-full bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
              <Utensils className="w-2 h-2 text-[#C4121A]" />
            </div>
            <span className="font-bold tracking-tight text-[11px] max-w-[64px] truncate">{displayDiet}</span>
            <ChevronDown className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
          </button>

          {/* 3. Set Weight Button */}
          <button
            type="button"
            id="fuel-weight-selector-btn"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsEditingWeight(!isEditingWeight);
            }}
            title="Update Current Bodyweight"
            className="h-8 flex items-center gap-1 px-2.5 rounded-full bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Scale className="w-3 h-3 text-[#C4121A] shrink-0" />
            <span className="font-mono font-bold text-[11px]">{weightKg ? `${weightKg}kg` : 'Weight'}</span>
          </button>
        </div>
      </div>

      {/* Inline Weight Quick-Edit Drawer */}
      {isEditingWeight && (
        <div className="p-2.5 bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-2 animate-in fade-in duration-150 shadow-sm">
          <input
            type="number"
            step="0.1"
            value={inputWeight}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setInputWeight(sanitizeNumericInput(e.target.value))}
            placeholder={`Enter weight in kg (current: ${weightKg || 'none'})...`}
            className="flex-1 h-9 px-3 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleSaveWeightInline}
            className="px-4 h-9 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] active:bg-[#800C11] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default FuelTopStatusBar;
