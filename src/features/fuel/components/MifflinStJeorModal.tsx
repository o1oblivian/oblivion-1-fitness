import React, { useState, useMemo } from 'react';
import { X, Check, Flame } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useUserStore } from '../../../stores/useUserStore';
import { MifflinBodyDetailsSection } from './mifflin/MifflinBodyDetailsSection';
import {
  MifflinGoalSection,
  BodyGoal,
  PaceRate,
} from './mifflin/MifflinGoalSection';
import {
  MifflinMacroSection,
  MacroSplitKey,
} from './mifflin/MifflinMacroSection';

interface MifflinStJeorModalProps {
  isOpen: boolean;
  currentWeightKg: number;
  onClose: () => void;
  onApplyTargets: (cal: number, p: number, c: number, f: number, weight: number) => void;
}

export const MifflinStJeorModal: React.FC<MifflinStJeorModalProps> = ({
  isOpen,
  currentWeightKg,
  onClose,
  onApplyTargets,
}) => {
  // 1. Body Details state
  const [weightKg, setWeightKg] = useState<number>(currentWeightKg && currentWeightKg > 0 ? currentWeightKg : 70);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [ageYrs, setAgeYrs] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityFactor, setActivityFactor] = useState<number>(1.55);

  // Advanced Body Fat & Lean Mass
  const [useBodyFat, setUseBodyFat] = useState<boolean>(false);
  const [bodyFatPct, setBodyFatPct] = useState<number>(15);

  // 2. Goal & Target Weight (Expanded Mass Gain options)
  const [goal, setGoal] = useState<BodyGoal>('lean_mass');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(
    currentWeightKg && currentWeightKg > 0 ? currentWeightKg + 3 : 73
  );
  const [paceRate, setPaceRate] = useState<PaceRate>(0.5);

  // 3. Diet Style & Protein Intake
  const [macroKey, setMacroKey] = useState<MacroSplitKey>('clean_bulk');
  const [proteinPerKg, setProteinPerKg] = useState<number>(2.2);

  // Lean body mass calculation
  const leanBodyMassKg = useMemo(() => {
    return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
  }, [weightKg, bodyFatPct]);

  // BMR calculation (Mifflin-St Jeor or Katch-McArdle if Body Fat is active)
  const bmr = useMemo(() => {
    if (useBodyFat && leanBodyMassKg > 0) {
      // Katch-McArdle: BMR = 370 + (21.6 * LBM)
      return Math.round(370 + 21.6 * leanBodyMassKg);
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYrs;
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }, [useBodyFat, leanBodyMassKg, weightKg, heightCm, ageYrs, gender]);

  const tdee = useMemo(() => {
    return Math.round(bmr * activityFactor);
  }, [bmr, activityFactor]);

  const targetDeltaKg = useMemo(() => {
    return Math.round((targetWeightKg - weightKg) * 10) / 10;
  }, [targetWeightKg, weightKg]);

  // Timeline
  const timelineWeeks = useMemo(() => {
    if (goal === 'maintain') return 0;
    const absDelta = Math.abs(targetDeltaKg);
    return Math.max(1, Math.round(absDelta / paceRate));
  }, [goal, targetDeltaKg, paceRate]);

  const targetDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + timelineWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [timelineWeeks]);

  // Net Target Calories based on Goal
  const netTargetCalories = useMemo(() => {
    if (goal === 'maintain') return tdee;

    const dailyPaceDelta = Math.round((paceRate * 7700) / 7);

    switch (goal) {
      case 'fat_loss':
        return Math.max(1200, tdee - dailyPaceDelta);
      case 'lean_mass':
        return tdee + 250;
      case 'muscle_bulk':
        return tdee + 450;
      case 'heavy_mass':
        return tdee + 700;
      default:
        return tdee;
    }
  }, [goal, tdee, paceRate]);

  // Macro Breakdown
  const macroBreakdown = useMemo(() => {
    const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
    const proteinG = Math.round(weight * proteinPerKg);
    const pKcal = proteinG * 4;

    let fRatio = 0.8;
    if (macroKey === 'low_carb') fRatio = 1.3;
    if (macroKey === 'clean_bulk') fRatio = 0.75;

    const fatsG = Math.round(weight * fRatio);
    const fKcal = fatsG * 9;

    const remainingKcal = Math.max(0, netTargetCalories - pKcal - fKcal);
    const carbsG = Math.round(remainingKcal / 4);
    const cKcal = carbsG * 4;

    const totalKcal = pKcal + fKcal + cKcal;
    const pPct = totalKcal > 0 ? Math.round((pKcal / totalKcal) * 100) : 0;
    const cPct = totalKcal > 0 ? Math.round((cKcal / totalKcal) * 100) : 0;
    const fPct = Math.max(0, 100 - pPct - cPct);

    return {
      proteinG,
      carbsG,
      fatsG,
      pKcal,
      cKcal,
      fKcal,
      pPct,
      cPct,
      fPct,
    };
  }, [weightKg, proteinPerKg, macroKey, netTargetCalories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150 select-none">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] p-3.5 shadow-xl flex flex-col overflow-hidden text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson shrink-0">
              <Flame className="w-4 h-4 text-o1-crimson" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white leading-tight truncate">
                Energy Engine
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">
                Personalized Calories, Mass Goals &amp; Evidence-Based Macros
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer transition-colors shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 flex-1">
          {/* Section 1: Body Details */}
          <MifflinBodyDetailsSection
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            ageYrs={ageYrs}
            setAgeYrs={setAgeYrs}
            gender={gender}
            setGender={setGender}
            activityFactor={activityFactor}
            setActivityFactor={setActivityFactor}
            useBodyFat={useBodyFat}
            setUseBodyFat={setUseBodyFat}
            bodyFatPct={bodyFatPct}
            setBodyFatPct={setBodyFatPct}
            leanBodyMassKg={leanBodyMassKg}
          />

          {/* Section 2: Goal & Target Weight */}
          <MifflinGoalSection
            goal={goal}
            setGoal={setGoal}
            weightKg={weightKg}
            targetWeightKg={targetWeightKg}
            setTargetWeightKg={setTargetWeightKg}
            targetDeltaKg={targetDeltaKg}
            paceRate={paceRate}
            setPaceRate={setPaceRate}
            timelineWeeks={timelineWeeks}
            targetDateStr={targetDateStr}
          />

          {/* Section 3: Diet Style & Macros */}
          <MifflinMacroSection
            macroKey={macroKey}
            setMacroKey={setMacroKey}
            proteinPerKg={proteinPerKg}
            setProteinPerKg={setProteinPerKg}
          />
        </div>

        <div className="pt-3 border-t border-white/[0.05] shrink-0 space-y-2.5">
          <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400">Blueprint</span>
              <span className="text-[10px] font-mono font-bold text-o1-crimson">
                {netTargetCalories.toLocaleString()} kcal/day
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono mb-2">
              <div>
                <span className="text-[9px] text-neutral-400 block">Bmr</span>
                <span className="text-xs font-bold">{bmr.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-400 block">Tdee</span>
                <span className="text-xs font-bold">{tdee.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-o1-crimson block">Target</span>
                <span className="text-xs font-bold text-o1-crimson">{netTargetCalories.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-o1-card rounded-full overflow-hidden flex">
              <div style={{ width: `${macroBreakdown.pPct}%` }} className="bg-o1-crimson h-full" />
              <div style={{ width: `${macroBreakdown.cPct}%` }} className="bg-amber-500 h-full" />
              <div style={{ width: `${macroBreakdown.fPct}%` }} className="bg-emerald-600 h-full" />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center font-mono mt-2">
              <span className="text-[10px] text-o1-crimson">{macroBreakdown.proteinG}g P</span>
              <span className="text-[10px] text-amber-400">{macroBreakdown.carbsG}g C</span>
              <span className="text-[10px] text-emerald-400">{macroBreakdown.fatsG}g F</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.playPRCelebration();
              useUserStore.getState().setWeightKg(weightKg);
              if (targetWeightKg > 0) useUserStore.getState().setTargetWeightKg(targetWeightKg);
              onApplyTargets(
                netTargetCalories,
                macroBreakdown.proteinG,
                macroBreakdown.carbsG,
                macroBreakdown.fatsG,
                weightKg
              );
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply Blueprint ({netTargetCalories.toLocaleString()} kcal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
