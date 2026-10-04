import React from 'react';
import { Check, BookOpen } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';

export type MacroSplitKey = 'balanced' | 'high_protein' | 'clean_bulk' | 'low_carb';

interface MifflinMacroSectionProps {
  macroKey: MacroSplitKey;
  setMacroKey: (k: MacroSplitKey) => void;
  proteinPerKg: number;
  setProteinPerKg: (val: number) => void;
  netTargetCalories: number;
  bmr: number;
  tdee: number;
  macroBreakdown: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
    pKcal: number;
    cKcal: number;
    fKcal: number;
    pPct: number;
    cPct: number;
    fPct: number;
  };
}

export const MifflinMacroSection: React.FC<MifflinMacroSectionProps> = ({
  macroKey,
  setMacroKey,
  proteinPerKg,
  setProteinPerKg,
  netTargetCalories,
  bmr,
  tdee,
  macroBreakdown,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-neutral-800">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
          3. Diet Style &amp; Macros
        </span>
        <span className="text-[10px] font-mono text-sky-400 font-semibold">
          {proteinPerKg}g protein/kg
        </span>
      </div>

      {/* 4 Diet Presets */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            key: 'balanced' as MacroSplitKey,
            label: 'Balanced Athletic',
            sub: '2.0g/kg P • Balanced Energy',
            pRatio: 2.0,
          },
          {
            key: 'high_protein' as MacroSplitKey,
            label: 'High Protein Pro',
            sub: '2.4g/kg P • Lean Muscle Retain',
            pRatio: 2.4,
          },
          {
            key: 'clean_bulk' as MacroSplitKey,
            label: 'Clean Muscle Fuel',
            sub: '2.2g/kg P • High Carb Mass',
            pRatio: 2.2,
          },
          {
            key: 'low_carb' as MacroSplitKey,
            label: 'Low Carb / Keto',
            sub: '2.0g/kg P • High Fats',
            pRatio: 2.0,
          },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setMacroKey(m.key);
              setProteinPerKg(m.pRatio);
            }}
            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
              macroKey === m.key
                ? 'border-[#C4121A] bg-red-950/40 text-white font-bold shadow-xs'
                : 'border-neutral-800 bg-[#18181b] text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-100">{m.label}</span>
              {macroKey === m.key && (
                <Check className="w-3.5 h-3.5 text-[#C4121A] stroke-[3]" />
              )}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
              {m.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Fine-Tuning Protein Slider */}
      <div className="p-3 bg-[#18181b] border border-neutral-800 rounded-2xl space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-neutral-400">Protein Intake Target</span>
          <span className="text-white font-bold">{proteinPerKg.toFixed(1)} g / kg bodyweight</span>
        </div>
        <input
          type="range"
          min="1.6"
          max="2.8"
          step="0.1"
          value={proteinPerKg}
          onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
          className="w-full accent-[#C4121A] h-1.5 bg-[#121214] rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-mono text-neutral-400">
          <span>1.6g (Moderate)</span>
          <span>2.2g (Optimal)</span>
          <span>2.8g (Heavy Mass)</span>
        </div>
      </div>

      {/* Target Blueprint Summary Card */}
      <div className="bg-[#18181b] border border-neutral-800 text-white rounded-3xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C4121A] animate-pulse" />
            <span className="text-[10px] font-mono uppercase font-bold text-neutral-300">
              Blueprint Summary
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-700/60 text-red-400 font-mono text-[10px] font-bold">
            {netTargetCalories.toLocaleString()} kcal/day
          </span>
        </div>

        {/* Burn Metrics */}
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          <div className="bg-[#121214] border border-neutral-800 rounded-xl p-2">
            <span className="text-[9px] text-neutral-400 block uppercase">Resting Burn</span>
            <span className="text-xs font-black text-white">{bmr.toLocaleString()} kcal</span>
          </div>
          <div className="bg-[#121214] border border-neutral-800 rounded-xl p-2">
            <span className="text-[9px] text-neutral-400 block uppercase">Daily Burn</span>
            <span className="text-xs font-black text-white">{tdee.toLocaleString()} kcal</span>
          </div>
          <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-2">
            <span className="text-[9px] text-red-400 block uppercase font-bold">Target Intake</span>
            <span className="text-xs font-black text-red-400">
              {netTargetCalories.toLocaleString()} kcal
            </span>
          </div>
        </div>

        {/* Tripartite Color Macro Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-300">
            <span className="text-red-400">Protein {macroBreakdown.pPct}%</span>
            <span className="text-amber-400">Carbs {macroBreakdown.cPct}%</span>
            <span className="text-sky-400">Fats {macroBreakdown.fPct}%</span>
          </div>
          <div className="h-2 w-full bg-[#121214] rounded-full overflow-hidden flex border border-neutral-800">
            <div style={{ width: `${macroBreakdown.pPct}%` }} className="bg-[#C4121A] h-full" />
            <div style={{ width: `${macroBreakdown.cPct}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${macroBreakdown.fPct}%` }} className="bg-sky-500 h-full" />
          </div>
        </div>

        {/* Detailed Grams & Calories */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono pt-1">
          <div className="bg-[#121214] border border-red-500/20 rounded-xl p-2">
            <span className="text-[9px] text-red-400 uppercase block font-bold">PROTEIN</span>
            <span className="text-sm font-black text-white">{macroBreakdown.proteinG}g</span>
            <span className="text-[9px] text-neutral-400 block">{macroBreakdown.pKcal} kcal</span>
          </div>

          <div className="bg-[#121214] border border-amber-500/20 rounded-xl p-2">
            <span className="text-[9px] text-amber-400 uppercase block font-bold">CARBS</span>
            <span className="text-sm font-black text-white">{macroBreakdown.carbsG}g</span>
            <span className="text-[9px] text-neutral-400 block">{macroBreakdown.cKcal} kcal</span>
          </div>

          <div className="bg-[#121214] border border-sky-500/20 rounded-xl p-2">
            <span className="text-[9px] text-sky-400 uppercase block font-bold">FATS</span>
            <span className="text-sm font-black text-white">{macroBreakdown.fatsG}g</span>
            <span className="text-[9px] text-neutral-400 block">{macroBreakdown.fKcal} kcal</span>
          </div>
        </div>

        {/* Scientific Citation */}
        <div className="pt-1 flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono">
          <BookOpen className="w-3 h-3 text-neutral-500 shrink-0" />
          <span className="truncate">
            Mifflin MD / Katch-McArdle Lean Body Mass formulation
          </span>
        </div>
      </div>
    </div>
  );
};
