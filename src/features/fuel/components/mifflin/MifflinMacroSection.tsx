import React from 'react';
import { Check } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';

export type MacroSplitKey = 'balanced' | 'high_protein' | 'clean_bulk' | 'low_carb';

interface MifflinMacroSectionProps {
  macroKey: MacroSplitKey;
  setMacroKey: (k: MacroSplitKey) => void;
  proteinPerKg: number;
  setProteinPerKg: (val: number) => void;
}

export const MifflinMacroSection: React.FC<MifflinMacroSectionProps> = ({
  macroKey,
  setMacroKey,
  proteinPerKg,
  setProteinPerKg,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-white/[0.05]">
      <div className="flex items-center justify-between">
        <span className="text-o1-label tabular-nums font-bold tracking-wider text-o1-muted">
          3. Macro Split
        </span>
        <span className="text-o1-label tabular-nums text-o1-muted font-semibold">
          {proteinPerKg}g protein/kg
        </span>
      </div>

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
                ? 'border-o1-crimson bg-o1-crimson text-o1-text font-bold shadow-xs'
                : 'border-white/[0.08] bg-o1-surface text-o1-muted hover:text-o1-text'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{m.label}</span>
              {macroKey === m.key && <Check className="w-3.5 h-3.5 text-o1-crimson stroke-[3]" />}
            </div>
            <span className="text-o1-label tabular-nums text-o1-muted block mt-0.5">{m.sub}</span>
          </button>
        ))}
      </div>

      <div className="p-3 bg-o1-surface border border-white/[0.08] rounded-2xl space-y-1.5">
        <div className="flex items-center justify-between text-o1-label tabular-nums">
          <span className="text-o1-muted">Protein Intake Target</span>
          <span className="text-o1-text font-bold">{proteinPerKg.toFixed(1)} g / kg</span>
        </div>
        <input
          type="range"
          min="1.6"
          max="2.8"
          step="0.1"
          value={proteinPerKg}
          onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
          className="w-full accent-o1-crimson h-1.5 bg-o1-sheet rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-o1-label tabular-nums text-o1-muted">
          <span>1.6g</span>
          <span>2.2g</span>
          <span>2.8g</span>
        </div>
      </div>
    </div>
  );
};
