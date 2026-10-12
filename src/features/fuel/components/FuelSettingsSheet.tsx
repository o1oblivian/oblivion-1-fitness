import React, { useEffect, useState } from 'react';
import { Calculator, ChevronRight, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { parseCleanInt, sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { COUNTRIES } from './ClientCountryMarketModal';
import { getDietProtocol } from '../data/dietProtocols';

export interface FuelTargets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

interface FuelSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  countryMarket: string;
  dietPreference: string;
  weightKg: number | null;
  targets: FuelTargets;
  bmr: number | null;
  onOpenCountry: () => void;
  onOpenDiet: () => void;
  onOpenCalculator: () => void;
  onSaveWeight: (kg: number) => void;
  onSaveTargets: (cal: number, p: number, c: number, f: number) => void;
}

const MACRO_FIELDS = [
  { key: 'calories' as const, label: 'Calories', unit: 'kcal', focus: 'focus:border-white/30' },
  { key: 'protein' as const, label: 'Protein', unit: 'g', focus: 'focus:border-o1-crimson' },
  { key: 'carbs' as const, label: 'Carbs', unit: 'g', focus: 'focus:border-amber-600' },
  { key: 'fats' as const, label: 'Fats', unit: 'g', focus: 'focus:border-emerald-600' },
];

export const FuelSettingsSheet: React.FC<FuelSettingsSheetProps> = ({
  isOpen,
  onClose,
  countryMarket,
  dietPreference,
  weightKg,
  targets,
  bmr,
  onOpenCountry,
  onOpenDiet,
  onOpenCalculator,
  onSaveWeight,
  onSaveTargets,
}) => {
  const [weightDraft, setWeightDraft] = useState('');
  const [draft, setDraft] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    if (!isOpen) return;
    setWeightDraft(weightKg ? String(weightKg) : '');
    setDraft({
      calories: targets.calories ?? 0,
      protein: targets.protein ?? 0,
      carbs: targets.carbs ?? 0,
      fats: targets.fats ?? 0,
    });
  }, [isOpen, weightKg, targets.calories, targets.protein, targets.carbs, targets.fats]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const country = COUNTRIES.find((c) => c.code === countryMarket);
  const diet = getDietProtocol(dietPreference);
  const macroKcal = draft.protein * 4 + draft.carbs * 4 + draft.fats * 9;
  const macroGap = draft.calories > 0 && macroKcal > 0 ? macroKcal - draft.calories : null;
  const parsedWeight = parseFloat(weightDraft);
  const weightChanged = Number.isFinite(parsedWeight) && parsedWeight > 0 && parsedWeight !== weightKg;
  const targetsDirty =
    draft.calories !== (targets.calories ?? 0) ||
    draft.protein !== (targets.protein ?? 0) ||
    draft.carbs !== (targets.carbs ?? 0) ||
    draft.fats !== (targets.fats ?? 0);
  const targetsValid = draft.calories >= 800 && targetsDirty;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex flex-col justify-end items-center animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Fuel settings"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
        className="w-full max-w-[480px] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-o1-sheet border border-white/[0.08] border-b-0 px-4 pt-2.5 animate-in slide-in-from-bottom-8 duration-200"
      >
        <div className="flex justify-center pb-2">
          <div className="w-10 h-1 rounded-full bg-white/[0.14]" />
        </div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-base font-semibold text-o1-text">Fuel settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] divide-y divide-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenCountry();
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer"
          >
            <span className="text-sm text-o1-text">Food market</span>
            <span className="flex items-center gap-1.5 text-sm text-o1-muted">
              {country ? `${country.flag} ${country.name}` : countryMarket}
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenDiet();
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer"
          >
            <span className="text-sm text-o1-text">Diet</span>
            <span className="flex items-center gap-1.5 text-sm text-o1-muted">
              {diet.label}
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <span className="text-sm text-o1-text">Body weight</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="--"
                value={weightDraft}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWeightDraft(sanitizeNumericInput(e.target.value))}
                className="w-20 h-9 px-2 rounded-xl bg-o1-surface border border-white/[0.08] text-sm text-right tabular-nums text-o1-text focus:outline-none focus:border-white/30"
                aria-label="Body weight in kilograms"
              />
              <span className="text-xs text-o1-muted">kg</span>
              <button
                type="button"
                disabled={!weightChanged}
                onClick={() => {
                  tactileEngine.triggerImpactPulse();
                  onSaveWeight(Math.round(parsedWeight * 10) / 10);
                }}
                className="h-9 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-30 disabled:cursor-not-allowed text-o1-text text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-xs font-semibold text-o1-muted">Daily targets</h3>
            <span className="o1-unread text-[11px] tabular-nums text-o1-muted">
              Resting burn {bmr != null ? `${bmr.toLocaleString()} kcal` : '--'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MACRO_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="block text-[10px] text-o1-muted mb-1">
                  {field.label} <span className="opacity-70">{field.unit}</span>
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="--"
                  value={draft[field.key] === 0 ? '' : draft[field.key]}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.key]: parseCleanInt(e.target.value) }))}
                  className={`w-full h-10 px-2 rounded-xl bg-o1-surface border border-white/[0.08] text-sm text-center tabular-nums text-o1-text focus:outline-none ${field.focus}`}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] tabular-nums text-o1-muted">
            {macroGap == null
              ? 'Macros add up to --'
              : Math.abs(macroGap) <= 30
                ? `Macros add up to ${macroKcal.toLocaleString()} kcal · balanced`
                : `Macros add up to ${macroKcal.toLocaleString()} kcal · ${macroGap > 0 ? '+' : ''}${macroGap} vs target`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenCalculator();
            }}
            className="h-11 rounded-2xl border border-white/[0.08] text-o1-text text-sm font-medium flex items-center justify-center gap-2 cursor-pointer hover:border-white/20"
          >
            <Calculator className="w-4 h-4 text-sky-600" />
            Energy calculator
          </button>
          <button
            type="button"
            disabled={!targetsValid}
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              onSaveTargets(draft.calories, draft.protein, draft.carbs, draft.fats);
              onClose();
            }}
            className="h-11 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-30 disabled:cursor-not-allowed text-o1-text text-sm font-semibold cursor-pointer"
          >
            Save targets
          </button>
        </div>
      </div>
    </div>
  );
};

export default FuelSettingsSheet;
