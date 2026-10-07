import React from 'react';
import { parseCleanNumber, parseCleanInt } from '../../../../utils/numberInputUtils';

interface MifflinBodyDetailsSectionProps {
  weightKg: number;
  setWeightKg: (val: number) => void;
  heightCm: number;
  setHeightCm: (val: number) => void;
  ageYrs: number;
  setAgeYrs: (val: number) => void;
  gender: 'male' | 'female';
  setGender: (val: 'male' | 'female') => void;
  activityFactor: number;
  setActivityFactor: (val: number) => void;
  useBodyFat: boolean;
  setUseBodyFat: (val: boolean) => void;
  bodyFatPct: number;
  setBodyFatPct: (val: number) => void;
  leanBodyMassKg: number;
}

export const MifflinBodyDetailsSection: React.FC<MifflinBodyDetailsSectionProps> = ({
  weightKg,
  setWeightKg,
  heightCm,
  setHeightCm,
  ageYrs,
  setAgeYrs,
  gender,
  setGender,
  activityFactor,
  setActivityFactor,
  useBodyFat,
  setUseBodyFat,
  bodyFatPct,
  setBodyFatPct,
  leanBodyMassKg,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
          1. Your Body Details
        </span>
        <button
          type="button"
          onClick={() => setUseBodyFat(!useBodyFat)}
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
            useBodyFat
              ? 'bg-sky-950/60 border-sky-600 text-sky-300'
              : 'bg-o1-well border-white/[0.07] text-neutral-400 hover:text-white'
          }`}
        >
          {useBodyFat ? 'Body Fat Active' : '+ Add Body Fat %'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-2.5">
          <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="0"
            value={weightKg === 0 ? '' : weightKg}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setWeightKg(parseCleanNumber(e.target.value))}
            className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
          />
        </div>

        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-2.5">
          <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">
            Height (cm)
          </label>
          <input
            type="number"
            placeholder="0"
            value={heightCm === 0 ? '' : heightCm}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setHeightCm(parseCleanInt(e.target.value))}
            className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
          />
        </div>

        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-2.5">
          <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold">
            Age (yrs)
          </label>
          <input
            type="number"
            placeholder="0"
            value={ageYrs === 0 ? '' : ageYrs}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAgeYrs(parseCleanInt(e.target.value))}
            className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Optional Body Fat % & Lean Mass readout */}
      {useBodyFat && (
        <div className="p-2.5 bg-sky-950/20 border border-sky-800/50 rounded-2xl grid grid-cols-2 gap-2 animate-in fade-in duration-150">
          <div>
            <label className="text-[9px] font-mono uppercase text-sky-400 block font-bold mb-1">
              Body Fat %
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="0"
              value={bodyFatPct === 0 ? '' : bodyFatPct}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setBodyFatPct(parseCleanNumber(e.target.value))}
              className="w-full bg-o1-card border border-sky-800/60 rounded-xl px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-neutral-400 block font-bold mb-1">
              Lean Body Mass
            </span>
            <span className="text-xs font-mono font-bold text-sky-300 block py-1">
              {leanBodyMassKg} kg LBM
            </span>
          </div>
        </div>
      )}

      {/* Gender & Activity Multiplier */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
            className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-200 focus:outline-none"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-mono uppercase text-neutral-400 block font-bold mb-1">
            Daily Movement / Activity
          </label>
          <select
            value={activityFactor}
            onChange={(e) => setActivityFactor(parseFloat(e.target.value))}
            className="w-full h-9 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-200 focus:outline-none"
          >
            <option value={1.2}>Sedentary (Desk work, little exercise)</option>
            <option value={1.375}>Light (1-3 days training / week)</option>
            <option value={1.55}>Moderate (3-5 days training / week)</option>
            <option value={1.725}>Heavy (6-7 days hard training)</option>
            <option value={1.9}>Elite Athlete (Twice daily training)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
