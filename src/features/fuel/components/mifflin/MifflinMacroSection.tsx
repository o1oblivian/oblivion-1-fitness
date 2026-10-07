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
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
          3. Macro Split
        </span>
        <span className="text-[10px] font-mono text-neutral-500 font-semibold">{proteinPerKg}g protein/kg</span>
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
                ? 'border-o1-crimson bg-red-950/40 text-white font-bold shadow-xs'
                : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{m.label}</span>
              {macroKey === m.key && <Check className="w-3.5 h-3.5 text-o1-crimson stroke-[3]" />}
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{m.sub}</span>
          </button>
        ))}
      </div>

      <div className="p-3 bg-o1-well border border-white/[0.07] rounded-2xl space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-neutral-400">Protein Intake Target</span>
          <span className="text-white font-bold">{proteinPerKg.toFixed(1)} g / kg</span>
        </div>
        <input
          type="range"
          min="1.6"
          max="2.8"
          step="0.1"
          value={proteinPerKg}
          onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
          className="w-full accent-o1-crimson h-1.5 bg-o1-card rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-mono text-neutral-400">
          <span>1.6g</span>
          <span>2.2g</span>
          <span>2.8g</span>
        </div>
      </div>
    </div>
  );
};
