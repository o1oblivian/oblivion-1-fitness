import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { ScannedMealBreakdown } from '../services/mealVisionService';
import { tactileEngine } from '../services/tactileEngine';

interface ScannedMealResultCardProps {
  scannedMeal: ScannedMealBreakdown;
  slotName?: string;
  onCommitMeal: (name: string, kcal: number, p: number, c: number, f: number, weight: number) => void;
}

export const ScannedMealResultCard: React.FC<ScannedMealResultCardProps> = ({
  scannedMeal, slotName = 'lunch', onCommitMeal,
}) => {
  const parsedWeight = parseInt(scannedMeal.servingDescription?.match(/(\d+)\s*g/i)?.[1] || '100', 10);
  const baseWeight = parsedWeight > 0 ? parsedWeight : 100;
  const isBarcode = scannedMeal.confidenceScore === 100 || !!scannedMeal.barcode;
  const isPackage = scannedMeal.confidenceScore === 95;

  const baseProtPerG = (scannedMeal.proteinGrams || 20) / baseWeight;
  const baseCarbPerG = (scannedMeal.carbsGrams || 25) / baseWeight;
  const baseFatPerG = (scannedMeal.fatsGrams || 5) / baseWeight;

  const [weight, setWeight] = useState(baseWeight);
  const [prep, setPrep] = useState<'lean' | 'oil'>('lean');
  const [dressing, setDressing] = useState<'plain' | 'sauce'>('plain');
  const [isLogging, setIsLogging] = useState(false);

  const prepAddedFat = prep === 'oil' ? 8 : 0;
  const sauceCarb = dressing === 'sauce' ? 6 : 0;
  const sauceFat = dressing === 'sauce' ? 4 : 0;

  const protein = Math.max(0, Math.round(weight * baseProtPerG));
  const carbs = Math.max(0, Math.round(weight * baseCarbPerG + sauceCarb));
  const fat = Math.max(0, Math.round(weight * baseFatPerG + prepAddedFat + sauceFat));
  const calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));

  const handleSave = () => {
    setIsLogging(true);
    tactileEngine.playPRCelebration();
    const tag = [prep === 'oil' ? 'Oil' : 'Lean', dressing === 'sauce' ? 'Sauce' : ''].filter(Boolean).join(', ');
    const name = tag ? `${scannedMeal.dishName} (${tag})` : scannedMeal.dishName;
    onCommitMeal(name, calories, protein, carbs, fat, weight);
  };

  const slotTitle = (slotName.charAt(0).toUpperCase() + slotName.slice(1)).replace(/_/g, ' ');

  return (
    <div className="p-4 rounded-2xl bg-black border border-white/[0.07] space-y-3 text-white select-none shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-sm text-white font-tactical">{scannedMeal.dishName}</h4>
          <span className="text-[10px] text-neutral-400 font-mono">{scannedMeal.servingDescription || `${weight}g portion`}</span>
        </div>
        {isBarcode ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% Match
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
            {scannedMeal.confidenceScore || (isPackage ? 95 : 90)}% Match
          </span>
        )}
      </div>

      {/* Universal Modifiers */}
      <div className="space-y-1.5 pt-1 border-t border-white/[0.05] text-[10px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-neutral-400 uppercase w-9">Prep:</span>
          {(['lean', 'oil'] as const).map((p) => (
            <button key={p} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setPrep(p); }}
              className={`px-2 py-0.5 rounded-xl font-tactical font-bold uppercase transition cursor-pointer border ${
                prep === p ? 'bg-o1-crimson text-white border-o1-crimson' : 'bg-white/5 text-neutral-400 border-white/[0.07]'
              }`}>{p === 'lean' ? 'Lean / Air-Fried' : 'Cooked in Oil (+8g Fat)'}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-neutral-400 uppercase w-9">Extra:</span>
          {(['plain', 'sauce'] as const).map((d) => (
            <button key={d} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setDressing(d); }}
              className={`px-2 py-0.5 rounded-xl font-tactical font-bold uppercase transition cursor-pointer border ${
                dressing === d ? 'bg-amber-600 text-white border-amber-600' : 'bg-white/5 text-neutral-400 border-white/[0.07]'
              }`}>{d === 'plain' ? 'Plain' : 'Sauce (+6g C, +4g F)'}</button>
          ))}
        </div>
      </div>

      {/* Stepper (+/- 10g & +/- 25g) */}
      <div className="p-2 rounded-2xl bg-o1-well border border-white/[0.07] space-y-1.5">
        <div className="flex items-center justify-between text-xs font-tactical font-bold uppercase text-neutral-300">
          <span>Portion Weight</span>
          <div className="flex items-center gap-1 bg-black px-2 py-0.5 rounded-xl border border-white/[0.07]">
            <input type="number" value={weight} onChange={(e) => setWeight(Math.max(10, parseInt(e.target.value || '0', 10)))}
              className="w-11 bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-hidden" />
            <span className="text-[10px] font-mono text-neutral-400">g</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[-25, -10, 10, 25].map((delta) => (
            <button key={delta} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setWeight((w) => Math.max(10, w + delta)); }}
              className="py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-neutral-200 transition cursor-pointer active:scale-95">
              {delta > 0 ? `+${delta}g` : `${delta}g`}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Macro Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[
          { label: 'CAL', val: calories, color: 'text-white' },
          { label: 'PRO', val: `${protein}g`, color: 'text-o1-crimson' },
          { label: 'CARB', val: `${carbs}g`, color: 'text-amber-400' },
          { label: 'FAT', val: `${fat}g`, color: 'text-emerald-400' },
        ].map((m) => (
          <div key={m.label} className="p-1.5 rounded-xl bg-o1-well border border-white/[0.07]">
            <span className="text-[9px] text-neutral-400 block font-mono">{m.label}</span>
            <span className={`text-xs font-bold font-tactical ${m.color}`}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* Primary Save Action */}
      <button type="button" disabled={isLogging} onClick={handleSave}
        className="w-full py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-98 text-white font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer disabled:opacity-50">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
        <span>{isLogging ? 'LOGGING...' : `LOG TO ${slotTitle.toUpperCase()}`}</span>
      </button>

      {/* Apple 1.4.1 / Google Health Compliance Disclaimer Footer */}
      <p className="text-[9px] font-mono text-neutral-400 text-center leading-tight pt-0.5">
        Nutritional values are estimates for general wellness only. Not medical or dietetic advice.
      </p>
    </div>
  );
};
export default ScannedMealResultCard;
