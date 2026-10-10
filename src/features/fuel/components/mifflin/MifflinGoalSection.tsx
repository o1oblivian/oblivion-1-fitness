import React from 'react';
import { Flame, Scale, TrendingUp, Calendar, Zap } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { parseCleanNumber } from '../../../../utils/numberInputUtils';

export type BodyGoal = 'fat_loss' | 'maintain' | 'lean_mass' | 'muscle_bulk' | 'heavy_mass';
export type PaceRate = 0.25 | 0.5 | 0.75;

interface MifflinGoalSectionProps {
  goal: BodyGoal;
  setGoal: (g: BodyGoal) => void;
  weightKg: number;
  targetWeightKg: number;
  setTargetWeightKg: (w: number) => void;
  targetDeltaKg: number;
  paceRate: PaceRate;
  setPaceRate: (p: PaceRate) => void;
  timelineWeeks: number;
  targetDateStr: string;
}

export const MifflinGoalSection: React.FC<MifflinGoalSectionProps> = ({
  goal,
  setGoal,
  weightKg,
  targetWeightKg,
  setTargetWeightKg,
  targetDeltaKg,
  paceRate,
  setPaceRate,
  timelineWeeks,
  targetDateStr,
}) => {
  return (
    <div className="space-y-3 pt-2 border-t border-white/[0.05]">
      <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-400 block">
        2. Choose Your Goal
      </span>

      {/* 5 Goal Selector Cards including multiple Mass Gain options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* 1. Fat Loss */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setGoal('fat_loss');
            setTargetWeightKg(Math.max(40, weightKg - 4));
          }}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            goal === 'fat_loss'
              ? 'border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
              : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 mx-auto mb-1 text-red-500" />
          <span className="text-xs block font-bold">Fat Loss / Cut</span>
          <span className="text-[9px] font-mono opacity-70 block">-400 kcal</span>
        </button>

        {/* 2. Maintain */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setGoal('maintain');
            setTargetWeightKg(weightKg);
          }}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            goal === 'maintain'
              ? 'border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
              : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 mx-auto mb-1 text-sky-400" />
          <span className="text-xs block font-bold">Maintain / Recomp</span>
          <span className="text-[9px] font-mono opacity-70 block">0 kcal</span>
        </button>

        {/* 3. Lean Mass */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setGoal('lean_mass');
            setTargetWeightKg(weightKg + 3);
          }}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            goal === 'lean_mass'
              ? 'border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
              : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-amber-500" />
          <span className="text-xs block font-bold">Lean Mass Gain</span>
          <span className="text-[9px] font-mono opacity-70 block">+250 kcal</span>
        </button>

        {/* 4. Muscle Bulk */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setGoal('muscle_bulk');
            setTargetWeightKg(weightKg + 5);
          }}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
            goal === 'muscle_bulk'
              ? 'border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
              : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <span className="text-xs block font-bold">Muscle Bulk</span>
          <span className="text-[9px] font-mono opacity-70 block">+450 kcal</span>
        </button>

        {/* 5. Heavy Mass */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setGoal('heavy_mass');
            setTargetWeightKg(weightKg + 8);
          }}
          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            goal === 'heavy_mass'
              ? 'border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
              : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 mx-auto mb-1 text-o1-crimson" />
          <span className="text-xs block font-bold">Heavy Mass Gain</span>
          <span className="text-[9px] font-mono opacity-70 block">+700 kcal</span>
        </button>
      </div>

      {/* Target Weight & Delta */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-2.5">
          <label className="text-[9px] font-mono text-neutral-400 block font-bold">
            Target Goal Weight
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              placeholder="0"
              value={targetWeightKg === 0 ? '' : targetWeightKg}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTargetWeightKg(parseCleanNumber(e.target.value))}
              className="w-full bg-transparent font-mono font-bold text-sm text-white focus:outline-none"
            />
            <span className="font-mono text-xs text-neutral-400 font-bold">kg</span>
          </div>
        </div>

        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-2.5">
          <label className="text-[9px] font-mono text-neutral-400 block font-bold">
            Target Difference
          </label>
          <div className="font-mono font-bold text-sm text-o1-crimson pt-0.5">
            {targetDeltaKg > 0 ? `+${targetDeltaKg} kg` : `${targetDeltaKg} kg`}
          </div>
        </div>
      </div>

      {/* Target Pace (Weekly Rate) */}
      <div>
        <label className="text-[9px] font-mono text-neutral-400 block font-bold mb-1">
          Target Pace
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { rate: 0.25 as PaceRate, label: 'Gentle', sub: '0.25 kg/wk' },
            { rate: 0.5 as PaceRate, label: 'Optimal', sub: '0.50 kg/wk' },
            { rate: 0.75 as PaceRate, label: 'Fast', sub: '0.75 kg/wk' },
          ].map((p) => (
            <button
              key={p.rate}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setPaceRate(p.rate);
              }}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                paceRate === p.rate
                  ? 'border-white/[0.07] bg-white/[0.08] text-white font-bold shadow-xs'
                  : 'border-white/[0.07] bg-o1-well text-neutral-400 hover:text-white'
              }`}
            >
              <span className="text-[11px] block font-bold">{p.label}</span>
              <span className="text-[9px] font-mono opacity-80 block">{p.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Banner */}
      <div className="p-2.5 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-neutral-200">
          <Calendar className="w-3.5 h-3.5 text-o1-crimson" />
          <span>
            Est. Timeline: <strong className="text-white">{timelineWeeks} wks</strong>
          </span>
        </div>
        <span className="text-neutral-400 text-[10px]">Target: {targetDateStr}</span>
      </div>
    </div>
  );
};
