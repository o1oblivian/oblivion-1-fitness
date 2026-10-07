import React from 'react';
import { Check, Calculator } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { parseCleanInt } from '../../../utils/numberInputUtils';

interface DailyEnergyTargetsTabProps {
  targetKcalInput: number;
  setTargetKcalInput: (val: number) => void;
  targetProteinInput: number;
  setTargetProteinInput: (val: number) => void;
  targetCarbsInput: number;
  setTargetCarbsInput: (val: number) => void;
  targetFatsInput: number;
  setTargetFatsInput: (val: number) => void;
  bmr: number;
  onOpenMifflinModal: () => void;
  onSaveTargets: () => void;
}

export const DailyEnergyTargetsTab: React.FC<DailyEnergyTargetsTabProps> = ({
  targetKcalInput,
  setTargetKcalInput,
  targetProteinInput,
  setTargetProteinInput,
  targetCarbsInput,
  setTargetCarbsInput,
  targetFatsInput,
  setTargetFatsInput,
  bmr,
  onOpenMifflinModal,
  onSaveTargets,
}) => {
  // Quick Presets with multiple Mass Gain & Cut options
  const handleQuickPreset = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    const baseEnergy = bmr > 0 ? (bmr + 400) : 2000;
    const newTarget = Math.max(1200, baseEnergy + delta);
    setTargetKcalInput(newTarget);

    // Dynamic macro division: 30% protein, 45% carbs, 25% fats
    const p = Math.round((newTarget * 0.3) / 4);
    const c = Math.round((newTarget * 0.45) / 4);
    const f = Math.round((newTarget * 0.25) / 9);
    setTargetProteinInput(p);
    setTargetCarbsInput(c);
    setTargetFatsInput(f);
  };

  const calculatedTotalKcal = targetProteinInput * 4 + targetCarbsInput * 4 + targetFatsInput * 9;
  const isBalanced = targetKcalInput > 0 && Math.abs(calculatedTotalKcal - targetKcalInput) <= 30;

  return (
    <div className="space-y-4 animate-in fade-in duration-150 select-none">
      {/* Quick Goal Presets: 6 clear options with expanded Mass Gain presets */}
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block mb-2">
          Quick Goal Presets
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Fat Loss Presets */}
          <button
            type="button"
            onClick={() => handleQuickPreset(-500)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-red-500">
              Fast Cut
            </span>
            <span className="text-[10px] font-mono text-red-400 block font-semibold">
              -500 kcal
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset(-300)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-red-500">
              Fat Loss
            </span>
            <span className="text-[10px] font-mono text-red-400 block font-semibold">
              -300 kcal
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset(0)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-sky-600">
              Maintain
            </span>
            <span className="text-[10px] font-mono text-sky-400 block font-semibold">
              0 kcal
            </span>
          </button>

          {/* Mass Gain Presets (Expanded options as requested) */}
          <button
            type="button"
            onClick={() => handleQuickPreset(250)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-amber-500">
              Lean Mass
            </span>
            <span className="text-[10px] font-mono text-amber-400 block font-semibold">
              +250 kcal
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset(450)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-amber-500">
              Muscle Bulk
            </span>
            <span className="text-[10px] font-mono text-amber-400 block font-semibold">
              +450 kcal
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset(700)}
            className="p-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-center transition-all cursor-pointer group"
          >
            <span className="text-xs font-bold text-neutral-200 block group-hover:text-o1-crimson">
              Heavy Mass
            </span>
            <span className="text-[10px] font-mono text-o1-crimson block font-bold">
              +700 kcal
            </span>
          </button>
        </div>
      </div>

      {/* Target Input Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
          Custom Macro Targets
        </span>
        <div className="grid grid-cols-4 gap-2">
          {/* Daily Calories */}
          <div>
            <label className="text-[9px] font-mono uppercase text-neutral-400 font-bold block mb-1">
              Calories
            </label>
            <input
              type="number"
              value={targetKcalInput === 0 ? '' : targetKcalInput}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetKcalInput(parseCleanInt(e.target.value))}
              className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-o1-crimson shadow-none"
            />
          </div>

          {/* Protein */}
          <div>
            <label className="text-[9px] font-mono uppercase text-red-400 font-bold block mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              value={targetProteinInput === 0 ? '' : targetProteinInput}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetProteinInput(parseCleanInt(e.target.value))}
              className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-red-500 shadow-none"
            />
          </div>

          {/* Carbs */}
          <div>
            <label className="text-[9px] font-mono uppercase text-amber-400 font-bold block mb-1">
              Carbs (g)
            </label>
            <input
              type="number"
              value={targetCarbsInput === 0 ? '' : targetCarbsInput}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetCarbsInput(parseCleanInt(e.target.value))}
              className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-amber-500 shadow-none"
            />
          </div>

          {/* Fats */}
          <div>
            <label className="text-[9px] font-mono uppercase text-emerald-400 font-bold block mb-1">
              Fats (g)
            </label>
            <input
              type="number"
              value={targetFatsInput === 0 ? '' : targetFatsInput}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetFatsInput(parseCleanInt(e.target.value))}
              className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-emerald-500 shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Subtext: Caloric balance confirmation */}
      <div className="flex items-center justify-between text-[10px] font-mono px-1">
        <span className="text-neutral-400">
          Macro Energy Sum: <strong className="text-neutral-200">{calculatedTotalKcal} kcal</strong>
        </span>
        {isBalanced ? (
          <span className="text-sky-400 font-bold flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" /> Balanced
          </span>
        ) : (
          <span className="text-amber-400 font-bold">
            Diff: {calculatedTotalKcal - targetKcalInput} kcal
          </span>
        )}
      </div>

      {/* Resting Burn Note */}
      <div className="p-3 bg-white/[0.03] rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-neutral-100 block">
            Resting Burn (BMR)
          </span>
          <span className="text-[10px] text-neutral-400 block">
            Calories burned before exercise or activity
          </span>
        </div>
        <span className="font-mono font-bold text-xs text-white bg-o1-card border border-white/[0.07] px-2.5 py-1 rounded-xl">
          {bmr} kcal
        </span>
      </div>

      {/* Action Buttons: Calculate Daily Needs & Save Targets */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenMifflinModal();
          }}
          className="py-3 px-3 rounded-2xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-sky-400" />
          <span>Advanced Engine</span>
        </button>

        <button
          type="button"
          onClick={onSaveTargets}
          className="py-3 px-3 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-98 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Targets</span>
        </button>
      </div>
    </div>
  );
};
