import React, { useState } from 'react';
import { ChevronDown, Scale } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { COUNTRIES } from './ClientCountryMarketModal';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { getDietProtocol } from '../data/dietProtocols';

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
  const diet = getDietProtocol(displayDiet);

  return (
    <div id="fuel-top-status-bar" className="space-y-2 select-none">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Fuel
          </p>
          <h1 className="font-semibold text-[17px] text-white tracking-tight leading-tight">
            Today&apos;s desk
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsEditingWeight(!isEditingWeight);
            }}
            title="Bodyweight"
            className="h-9 px-2.5 rounded-2xl bg-o1-card border border-white/[0.07] flex items-center gap-1.5 text-neutral-200 active:scale-95 transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[11px] font-semibold tabular-nums">{weightKg ? `${weightKg}` : '—'}</span>
            <span className="text-[9px] text-neutral-400 font-medium">kg</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          id="fuel-country-selector-btn"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenCountryModal?.();
          }}
          title={`Market catalog: ${countryObj.name}`}
          className="h-[52px] px-3 rounded-2xl bg-o1-card border border-white/[0.07] flex items-center gap-2.5 text-left active:scale-[0.99] transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[22px] leading-none shrink-0" aria-hidden>
            {countryObj.flag}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium">Market</span>
            <span className="block text-[12px] font-semibold text-white truncate leading-tight">
              {countryObj.code === 'GLOBAL' ? 'All markets' : countryObj.name}
            </span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </button>

        <button
          type="button"
          id="fuel-diet-selector-btn"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (onOpenDietModal) onOpenDietModal();
            else onToggleDiet?.();
          }}
          title="Diet protocol"
          className={`h-[52px] px-3 rounded-2xl bg-o1-card border ${diet.accentBorder} flex items-center gap-2.5 text-left active:scale-[0.99] transition-all cursor-pointer shadow-xs`}
        >
          <span className={`w-8 h-8 rounded-xl ${diet.accentSoft} border ${diet.accentBorder} flex items-center justify-center text-base shrink-0`}>
            {diet.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium">Diet</span>
            <span className={`block text-[12px] font-semibold truncate leading-tight ${diet.accentDark}`}>
              {diet.label}
            </span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        </button>
      </div>

      {isEditingWeight && (
        <div className="p-2 bg-o1-card border border-white/[0.07] rounded-2xl flex items-center gap-2 shadow-sm">
          <input
            type="number"
            step="0.1"
            value={inputWeight}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setInputWeight(sanitizeNumericInput(e.target.value))}
            className="flex-1 h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-neutral-100 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleSaveWeightInline}
            className="px-4 h-9 rounded-xl bg-white text-neutral-900 text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default FuelTopStatusBar;
