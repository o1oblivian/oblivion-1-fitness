import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { ScannedMealBreakdown } from '../services/mealVisionService';
import { tactileEngine } from '../services/tactileEngine';

interface ScannedMealResultCardProps {
  scannedMeal: ScannedMealBreakdown;
  slotName?: string;
  /** Plate photo, shown as a small thumbnail beside the meal title. */
  thumbnail?: string | null;
  /** Clears this result so another photo can be taken. */
  onScanAgain?: () => void;
  onCommitMeal: (
    name: string,
    kcal: number,
    p: number,
    c: number,
    f: number,
    weight: number,
  ) => void;
}

export const ScannedMealResultCard: React.FC<ScannedMealResultCardProps> = ({
  scannedMeal,
  thumbnail,
  onScanAgain,
  onCommitMeal,
}) => {
  const parsedWeight = parseInt(
    scannedMeal.servingDescription?.match(/(\d+)\s*g/i)?.[1] || '100',
    10,
  );
  const baseWeight = parsedWeight > 0 ? parsedWeight : 100;
  const isBarcode = scannedMeal.confidenceScore === 100 || !!scannedMeal.barcode;
  const confidence = scannedMeal.confidenceScore;

  const perGram = (grams: number | null): number | null =>
    grams === null ? null : grams / baseWeight;
  const baseProtPerG = perGram(scannedMeal.proteinGrams);
  const baseCarbPerG = perGram(scannedMeal.carbsGrams);
  const baseFatPerG = perGram(scannedMeal.fatsGrams);
  const hasAllMacros = baseProtPerG !== null && baseCarbPerG !== null && baseFatPerG !== null;

  const [weightText, setWeightText] = useState(String(baseWeight));
  const weight = Math.min(5000, Math.max(0, parseInt(weightText || '0', 10) || 0));
  const setWeight = (update: (w: number) => number) =>
    setWeightText(String(Math.min(5000, Math.max(0, update(weight)))));
  const [prep, setPrep] = useState<'lean' | 'oil'>('lean');
  const [dressing, setDressing] = useState<'plain' | 'sauce'>('plain');
  const [isLogging, setIsLogging] = useState(false);

  const prepAddedFat = prep === 'oil' ? 8 : 0;
  const sauceCarb = dressing === 'sauce' ? 6 : 0;
  const sauceFat = dressing === 'sauce' ? 4 : 0;

  const protein = baseProtPerG === null ? null : Math.max(0, Math.round(weight * baseProtPerG));
  const carbs =
    baseCarbPerG === null ? null : Math.max(0, Math.round(weight * baseCarbPerG + sauceCarb));
  const fat =
    baseFatPerG === null
      ? null
      : Math.max(0, Math.round(weight * baseFatPerG + prepAddedFat + sauceFat));
  const calories =
    protein === null || carbs === null || fat === null
      ? null
      : Math.round(protein * 4 + carbs * 4 + fat * 9);

  const handleSave = () => {
    if (protein === null || carbs === null || fat === null || calories === null) return;
    setIsLogging(true);
    tactileEngine.playPRCelebration();
    const tag = [prep === 'oil' ? 'Oil' : 'Lean', dressing === 'sauce' ? 'Sauce' : '']
      .filter(Boolean)
      .join(', ');
    const name = tag ? `${scannedMeal.dishName} (${tag})` : scannedMeal.dishName;
    onCommitMeal(name, calories, protein, carbs, fat, weight);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black text-white select-none">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Scanned meal"
                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/[0.07]"
              />
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white font-tactical break-words">
                {scannedMeal.dishName}
              </h4>
              <span className="text-o1-label text-o1-muted font-num block">
                {scannedMeal.servingDescription || `${weight}g portion`}
              </span>
              {onScanAgain && (
                <button
                  type="button"
                  onClick={onScanAgain}
                  className="mt-0.5 text-o1-label font-num text-o1-muted underline underline-offset-2 cursor-pointer"
                >
                  Scan another
                </button>
              )}
            </div>
          </div>
          {isBarcode ? (
            <span className="text-o1-label font-num px-2 py-0.5 rounded-full bg-o1-olive/20 text-o1-olive border border-o1-olive/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-o1-olive" />
              100% Match
            </span>
          ) : confidence !== null && confidence > 0 ? (
            <span className="text-o1-label font-num px-2 py-0.5 rounded-full bg-o1-teal/15 text-o1-teal border border-o1-teal/30">
              {confidence}% Match
            </span>
          ) : null}
        </div>

        {/* Universal Modifiers */}
        <div className="space-y-1.5 pt-1 border-t border-white/[0.05] text-o1-label">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-num text-o1-muted w-9">Prep:</span>
            {(['lean', 'oil'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setPrep(p);
                }}
                className={`px-2 py-0.5 rounded-xl font-tactical font-bold transition cursor-pointer border ${
                  prep === p
                    ? 'bg-o1-crimson text-white border-o1-crimson'
                    : 'bg-white/5 text-o1-muted border-white/[0.07]'
                }`}
              >
                {p === 'lean' ? 'Lean / Air-Fried' : 'Cooked in Oil (+8g Fat)'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-num text-o1-muted w-9">Extra:</span>
            {(['plain', 'sauce'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setDressing(d);
                }}
                className={`px-2 py-0.5 rounded-xl font-tactical font-bold transition cursor-pointer border ${
                  dressing === d
                    ? 'bg-o1-yellow text-black border-o1-yellow'
                    : 'bg-white/5 text-o1-muted border-white/[0.07]'
                }`}
              >
                {d === 'plain' ? 'Plain' : 'Sauce (+6g C, +4g F)'}
              </button>
            ))}
          </div>
        </div>

        {/* Stepper (+/- 10g & +/- 25g) */}
        <div className="p-2 rounded-2xl bg-o1-well border border-white/[0.07] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-tactical font-bold text-o1-stone">
            <span>Portion Weight</span>
            <div className="flex items-center gap-1 bg-black px-2 py-0.5 rounded-xl border border-white/[0.07]">
              <input
                type="text"
                inputMode="numeric"
                value={weightText}
                placeholder="0"
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setWeightText(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-12 bg-transparent text-center font-num font-bold text-xs text-white focus:outline-hidden"
              />
              <span className="text-o1-label font-num text-o1-muted">g</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[-25, -10, 10, 25].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setWeight((w) => w + delta);
                }}
                className="py-1 rounded-xl bg-white/10 hover:bg-white/20 text-o1-label font-num font-bold text-o1-ink-soft transition cursor-pointer active:scale-95"
              >
                {delta > 0 ? `+${delta}g` : `${delta}g`}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Macro Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { label: 'CAL', val: calories ?? '--', color: 'text-white' },
            {
              label: 'PRO',
              val: protein === null ? '--' : `${protein}g`,
              color: 'text-o1-crimson',
            },
            { label: 'CARB', val: carbs === null ? '--' : `${carbs}g`, color: 'text-o1-yellow' },
            { label: 'FAT', val: fat === null ? '--' : `${fat}g`, color: 'text-o1-olive' },
          ].map((m) => (
            <div key={m.label} className="p-1.5 rounded-xl bg-o1-well border border-white/[0.07]">
              <span className="text-o1-label text-o1-muted block font-sans font-semibold">
                {m.label}
              </span>
              <span className={`text-xs font-bold font-num ${m.color}`}>{m.val}</span>
            </div>
          ))}
        </div>

        {!hasAllMacros && (
          <p className="text-o1-label font-num text-o1-yellow text-center">
            Some macros could not be read. Add this meal manually to log exact values.
          </p>
        )}
      </div>

      {/* Pinned footer: the log button stays in view while the rest scrolls */}
      <div className="sticky bottom-0 z-20 shrink-0 bg-[#0d0d0d] pt-2 pb-safe px-3 border-t border-white/[0.07] space-y-1.5">
        <button
          type="button"
          disabled={isLogging || !hasAllMacros || weight <= 0}
          onClick={handleSave}
          className="o1-pill mx-auto bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white font-sans font-semibold text-xs cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{isLogging ? 'Saving' : 'Log meal'}</span>
        </button>

        {/* Apple 1.4.1 / Google Health Compliance Disclaimer Footer */}
        <p className="text-o1-label font-num text-o1-muted text-center leading-tight pt-0.5">
          Nutritional values are estimates for general wellness only. Not medical or dietetic
          advice.
        </p>
      </div>
    </div>
  );
};
