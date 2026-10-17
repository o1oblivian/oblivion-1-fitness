import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, Flame } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useUserStore } from '../../../stores/useUserStore';
import type { BiologicalSex } from '../store/useFuelStore';
import { MifflinBodyDetailsSection } from './mifflin/MifflinBodyDetailsSection';
import { MifflinGoalSection, BodyGoal, PaceRate } from './mifflin/MifflinGoalSection';
import { MifflinMacroSection, MacroSplitKey } from './mifflin/MifflinMacroSection';

interface EnergyBody {
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  sex: BiologicalSex | null;
}

interface MifflinStJeorModalProps {
  isOpen: boolean;
  body: EnergyBody;
  onClose: () => void;
  onApplyTargets: (cal: number, p: number, c: number, f: number, body: EnergyBody) => void;
}

export const MifflinStJeorModal: React.FC<MifflinStJeorModalProps> = ({
  isOpen,
  body,
  onClose,
  onApplyTargets,
}) => {
  const [weightKg, setWeightKg] = useState<number>(0);
  const [heightCm, setHeightCm] = useState<number>(0);
  const [ageYrs, setAgeYrs] = useState<number>(0);
  const [gender, setGender] = useState<BiologicalSex | null>(null);
  const [activityFactor, setActivityFactor] = useState<number>(1.55);

  const [useBodyFat, setUseBodyFat] = useState<boolean>(false);
  const [bodyFatPct, setBodyFatPct] = useState<number>(0);

  const [goal, setGoal] = useState<BodyGoal>('maintain');
  const [targetWeightKg, setTargetWeightKg] = useState<number>(0);
  const [paceRate, setPaceRate] = useState<PaceRate>(0.5);

  const [macroKey, setMacroKey] = useState<MacroSplitKey>('balanced');
  const [proteinPerKg, setProteinPerKg] = useState<number>(2.0);

  useEffect(() => {
    if (!isOpen) return;
    setWeightKg(body.weightKg ?? 0);
    setHeightCm(body.heightCm ?? 0);
    setAgeYrs(body.ageYears ?? 0);
    setGender(body.sex);
    setTargetWeightKg(body.weightKg ?? 0);
  }, [isOpen, body.weightKg, body.heightCm, body.ageYears, body.sex]);

  const isComplete =
    weightKg > 0 &&
    (useBodyFat ? bodyFatPct > 0 && bodyFatPct < 70 : heightCm > 0 && ageYrs > 0 && gender != null);

  // Lean body mass calculation
  const leanBodyMassKg = useMemo(() => {
    return Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
  }, [weightKg, bodyFatPct]);

  // BMR calculation (Mifflin-St Jeor or Katch-McArdle if Body Fat is active)
  const bmr = useMemo(() => {
    if (!isComplete) return 0;
    if (useBodyFat && leanBodyMassKg > 0) {
      // Katch-McArdle: BMR = 370 + (21.6 * LBM)
      return Math.round(370 + 21.6 * leanBodyMassKg);
    }
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYrs;
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }, [isComplete, useBodyFat, leanBodyMassKg, weightKg, heightCm, ageYrs, gender]);

  const tdee = useMemo(() => {
    return Math.round(bmr * activityFactor);
  }, [bmr, activityFactor]);

  const targetDeltaKg = useMemo(() => {
    return Math.round((targetWeightKg - weightKg) * 10) / 10;
  }, [targetWeightKg, weightKg]);

  // Timeline
  const timelineWeeks = useMemo(() => {
    if (goal === 'maintain' || targetWeightKg <= 0 || weightKg <= 0) return 0;
    const absDelta = Math.abs(targetDeltaKg);
    return Math.max(1, Math.round(absDelta / paceRate));
  }, [goal, targetDeltaKg, paceRate, targetWeightKg, weightKg]);

  const targetDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + timelineWeeks * 7);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [timelineWeeks]);

  // Net Target Calories based on Goal
  const netTargetCalories = useMemo(() => {
    if (tdee <= 0) return 0;
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
      <div className="o1-sheet-card bg-o1-sheet border border-white/[0.08] p-3.5 shadow-xl flex flex-col overflow-hidden text-o1-text">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson shrink-0">
              <Flame className="w-4 h-4 text-o1-crimson" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-o1-text leading-tight truncate">
                Energy Engine
              </h3>
              <p className="text-[10px] text-o1-muted truncate">
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
            className="w-8 h-8 rounded-full bg-o1-surface hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer transition-colors shrink-0 ml-2"
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
          <div className="o1-unread border border-white/[0.08] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tabular-nums font-bold text-o1-muted">Blueprint</span>
              <span className="text-[10px] tabular-nums font-bold text-o1-crimson">
                {isComplete ? `${netTargetCalories.toLocaleString()} kcal/day` : '--'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center tabular-nums mb-2">
              <div>
                <span className="text-[9px] text-o1-muted block">BMR</span>
                <span className="text-xs font-bold">
                  {isComplete ? bmr.toLocaleString() : '--'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-o1-muted block">TDEE</span>
                <span className="text-xs font-bold">
                  {isComplete ? tdee.toLocaleString() : '--'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-o1-crimson block">Target</span>
                <span className="text-xs font-bold text-o1-crimson">
                  {isComplete ? netTargetCalories.toLocaleString() : '--'}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${isComplete ? macroBreakdown.pPct : 0}%` }}
                className="bg-o1-crimson h-full"
              />
              <div
                style={{ width: `${isComplete ? macroBreakdown.cPct : 0}%` }}
                className="bg-amber-600 h-full"
              />
              <div
                style={{ width: `${isComplete ? macroBreakdown.fPct : 0}%` }}
                className="bg-emerald-600 h-full"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center tabular-nums mt-2">
              <span className="text-[10px] text-o1-crimson">
                {isComplete ? `${macroBreakdown.proteinG}g P` : '-- P'}
              </span>
              <span className="text-[10px] text-amber-500">
                {isComplete ? `${macroBreakdown.carbsG}g C` : '-- C'}
              </span>
              <span className="text-[10px] text-emerald-500">
                {isComplete ? `${macroBreakdown.fatsG}g F` : '-- F'}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={!isComplete}
            onClick={() => {
              if (!isComplete) return;
              tactileEngine.playPRCelebration();
              useUserStore.getState().setWeightKg(weightKg);
              if (targetWeightKg > 0) useUserStore.getState().setTargetWeightKg(targetWeightKg);
              onApplyTargets(
                netTargetCalories,
                macroBreakdown.proteinG,
                macroBreakdown.carbsG,
                macroBreakdown.fatsG,
                {
                  weightKg,
                  heightCm: heightCm > 0 ? heightCm : null,
                  ageYears: ageYrs > 0 ? ageYrs : null,
                  sex: gender,
                },
              );
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-40 disabled:cursor-not-allowed text-o1-text font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isComplete
                ? `Apply Blueprint (${netTargetCalories.toLocaleString()} kcal)`
                : 'Add weight, height, age and sex'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
