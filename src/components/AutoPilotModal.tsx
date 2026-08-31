import React, { useState, useEffect } from 'react';
import { X, Activity, TrendingDown, Scale, TrendingUp, Check, PieChart, Calendar, Target } from 'lucide-react';
import { getSmartDefault, recordSmartInput } from '../utils/frequencyDefaults';

interface AutoPilotModalProps {
  isOpen: boolean;
  onApply: (bmr: number, targetCals: number, p: number, c: number, f: number) => void;
  onClose: () => void;
}

type MacroSplit = 'balanced' | 'high_protein' | 'low_carb' | 'zone';
type GoalMode = 'fat_loss' | 'maintain' | 'mass_gain';
type PaceLevel = 'conservative' | 'optimal' | 'aggressive';

export const AutoPilotModal: React.FC<AutoPilotModalProps> = ({
  isOpen,
  onApply,
  onClose,
}) => {
  // Retrieve intelligent defaults from recent logs or smart frequency storage
  const getInitialWeight = () => {
    const smart = getSmartDefault('autopilot_weight', 0);
    if (smart > 0) return smart;
    try {
      const raw = localStorage.getItem('o1fc_bodyweight_logs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          if (last?.weight && last.weight > 30) return last.weight;
        }
      }
    } catch {}
    return 75;
  };

  const [weight, setWeight] = useState<number>(() => getInitialWeight());
  const [targetWeight, setTargetWeight] = useState<number>(() => {
    const w = getInitialWeight();
    return Math.max(30, Math.round(w - 5)); // Sensible default: 5kg fat loss goal
  });
  const [height, setHeight] = useState<number>(() => {
    const smart = getSmartDefault('autopilot_height', 0);
    return smart > 0 ? smart : 178;
  });
  const [age, setAge] = useState<number>(() => {
    const smart = getSmartDefault('autopilot_age', 0);
    return smart > 0 ? smart : 28;
  });
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activity, setActivity] = useState<number>(1.55);
  const [goalMode, setGoalMode] = useState<GoalMode>('fat_loss');
  const [pace, setPace] = useState<PaceLevel>('optimal');
  const [macroSplit, setMacroSplit] = useState<MacroSplit>('high_protein');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Validated physical stats
  const activeW = Math.max(30, weight || 75);
  const activeH = Math.max(100, height || 178);
  const activeA = Math.max(14, age || 28);
  const activeGoalW = Math.max(30, targetWeight || activeW);

  // Mifflin-St Jeor Clinical Equation:
  // Men: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) + 5
  // Women: BMR = (10 * weight in kg) + (6.25 * height in cm) - (5 * age in years) - 161
  let rawBmr = 10 * activeW + 6.25 * activeH - 5 * activeA;
  if (gender === 'male') {
    rawBmr += 5;
  } else {
    rawBmr -= 161;
  }
  const calculatedBmr = Math.round(Math.max(900, rawBmr));

  // TDEE (Total Daily Energy Expenditure)
  const tdee = Math.round(calculatedBmr * activity);

  // Weekly Rate of Change (kg/week) and Calorie Offset (1 kg fat ~ 7700 kcal)
  let weeklyRateKg = 0;
  let offset = 0;

  if (goalMode === 'fat_loss') {
    if (pace === 'conservative') {
      weeklyRateKg = 0.25;
      offset = -275;
    } else if (pace === 'optimal') {
      weeklyRateKg = 0.50;
      offset = -550;
    } else {
      weeklyRateKg = 0.75;
      offset = -825;
    }
  } else if (goalMode === 'mass_gain') {
    if (pace === 'conservative') {
      weeklyRateKg = 0.20;
      offset = 220;
    } else if (pace === 'optimal') {
      weeklyRateKg = 0.35;
      offset = 385;
    } else {
      weeklyRateKg = 0.50;
      offset = 550;
    }
  } else {
    // Maintain
    weeklyRateKg = 0;
    offset = 0;
  }

  // Net Caloric Target (Clamped for safety)
  let targetCals = Math.round(tdee + offset);
  if (targetCals < 1200) targetCals = 1200;

  // Weight Delta & Target Arrival Projection
  const weightDeltaKg = +(activeGoalW - activeW).toFixed(1);
  const totalKgToChange = Math.abs(weightDeltaKg);
  const weeksToGoal = weeklyRateKg > 0 && totalKgToChange > 0 ? Math.ceil(totalKgToChange / weeklyRateKg) : 0;
  
  const estimatedArrivalDate = weeksToGoal > 0
    ? new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Substrate Partitioning (ISSN / ACSM Guidelines)
  let pPerKg = 1.8;
  let fPerKg = 1.0;

  if (macroSplit === 'high_protein') {
    pPerKg = 2.2;
    fPerKg = 0.8;
  } else if (macroSplit === 'low_carb') {
    pPerKg = 2.0;
    fPerKg = 1.2;
  } else if (macroSplit === 'zone') {
    pPerKg = 1.8;
    fPerKg = 1.0;
  }

  const pGrams = Math.round(pPerKg * activeW);
  const fGrams = Math.round(fPerKg * activeW);
  const pCals = pGrams * 4;
  const fCals = fGrams * 9;
  const remainingCals = Math.max(0, targetCals - pCals - fCals);
  const cGrams = Math.round(remainingCals / 4);
  const cCals = cGrams * 4;
  const totalCalculatedCals = pCals + fCals + cCals;

  // Macro Energy Percentages
  const pPercent = Math.round((pCals / (totalCalculatedCals || 1)) * 100);
  const cPercent = Math.round((cCals / (totalCalculatedCals || 1)) * 100);
  const fPercent = Math.max(0, 100 - pPercent - cPercent);

  const handleConfirm = () => {
    if (weight) recordSmartInput('autopilot_weight', weight);
    if (height) recordSmartInput('autopilot_height', height);
    if (age) recordSmartInput('autopilot_age', age);
    onApply(calculatedBmr, targetCals, pGrams, cGrams, fGrams);
    onClose();
  };

  const handleGoalSelect = (mode: GoalMode) => {
    setGoalMode(mode);
    if (mode === 'fat_loss') {
      setTargetWeight(Math.max(30, Math.round(activeW - 5)));
      setMacroSplit('high_protein'); // Auto-recommend high protein to protect lean mass in deficit
    } else if (mode === 'mass_gain') {
      setTargetWeight(Math.round(activeW + 4));
      setMacroSplit('balanced');
    } else {
      setTargetWeight(activeW);
      setMacroSplit('balanced');
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#12141A] text-zinc-900 dark:text-white w-full max-w-lg rounded-[28px] border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slideUpFade">
        
        {/* Apple HIG Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/[0.06] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-red-500/10 dark:bg-red-500/20 text-[#DC2626] dark:text-[#EF4444] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight">
                Mifflin-St Jeor Energy Engine
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Goal Weight, Body Composition & Evidence-Based Macros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-nude-close"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1 hide-scrollbar">
          
          {/* Section 1: Anthropometric Inputs (Apple Inset Group) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider block">
              1. Anthropometrics & Demographics
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5 focus-within:border-[#DC2626] transition-colors">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                  Current (kg)
                </label>
                <input
                  type="number"
                  value={weight || ''}
                  placeholder="75"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setWeight(clean === '' ? 0 : parseFloat(clean));
                  }}
                  className="w-full bg-transparent font-mono font-bold text-sm outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5 focus-within:border-[#DC2626] transition-colors">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height || ''}
                  placeholder="178"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setHeight(clean === '' ? 0 : parseFloat(clean));
                  }}
                  className="w-full bg-transparent font-mono font-bold text-sm outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5 focus-within:border-[#DC2626] transition-colors">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                  Age (yrs)
                </label>
                <input
                  type="number"
                  value={age || ''}
                  placeholder="28"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^0+(?=\d)/, '');
                    setAge(clean === '' ? 0 : parseInt(clean));
                  }}
                  className="w-full bg-transparent font-mono font-bold text-sm outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                  Biological Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full bg-transparent font-semibold text-xs outline-none text-zinc-800 dark:text-white cursor-pointer py-0.5"
                >
                  <option value="male" className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Male (Mifflin +5)</option>
                  <option value="female" className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Female (Mifflin -161)</option>
                </select>
              </div>

              <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                  Training Activity
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(parseFloat(e.target.value))}
                  className="w-full bg-transparent font-semibold text-xs outline-none text-zinc-800 dark:text-white cursor-pointer py-0.5 truncate"
                >
                  <option value={1.2} className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Sedentary (1.2x)</option>
                  <option value={1.375} className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Light: 1-3x/wk (1.375x)</option>
                  <option value={1.55} className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Moderate: 3-5x/wk (1.55x)</option>
                  <option value={1.725} className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Heavy: 6-7x/wk (1.725x)</option>
                  <option value={1.9} className="bg-white dark:bg-[#1E1F24] text-zinc-900 dark:text-white">Athlete Pro: 2x/day (1.9x)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Goal Objective, Goal Weight & Pace */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider block">
              2. Body Composition Goal & Target Weight
            </span>
            
            {/* 3 Core Objectives */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleGoalSelect('fat_loss')}
                className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  goalMode === 'fat_loss'
                    ? 'border-[#FF2D55] bg-red-50 dark:bg-red-500/15 text-[#FF2D55] shadow-xs'
                    : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span className="text-[11px]">Fat Loss</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoalSelect('maintain')}
                className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  goalMode === 'maintain'
                    ? 'border-zinc-800 dark:border-white/40 bg-zinc-200/80 dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs'
                    : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="text-[11px]">Maintain</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoalSelect('mass_gain')}
                className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  goalMode === 'mass_gain'
                    ? 'border-[#34C759] bg-emerald-50 dark:bg-emerald-500/15 text-[#34C759] shadow-xs'
                    : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[11px]">Mass Gain</span>
              </button>
            </div>

            {/* Goal Weight & Pace Selection */}
            {goalMode !== 'maintain' && (
              <div className="space-y-2 pt-0.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5 focus-within:border-[#DC2626] transition-colors">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                      Target Goal Weight
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={targetWeight || ''}
                        placeholder={activeW.toString()}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/^0+(?=\d)/, '');
                          setTargetWeight(clean === '' ? 0 : parseFloat(clean));
                        }}
                        className="w-full bg-transparent font-mono font-bold text-sm outline-none text-zinc-900 dark:text-white"
                      />
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400">kg</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-1.5 px-2.5 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                      Target Delta
                    </span>
                    <span className={`text-sm font-mono font-extrabold ${weightDeltaKg < 0 ? 'text-[#FF2D55]' : weightDeltaKg > 0 ? 'text-[#34C759]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {weightDeltaKg > 0 ? `+${weightDeltaKg}` : weightDeltaKg} kg
                    </span>
                  </div>
                </div>

                {/* Pace / Intensity Prescription */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-400 uppercase block">
                    Pace / Weekly Rate
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'conservative', label: 'Conservative', rate: goalMode === 'fat_loss' ? '0.25 kg/wk' : '0.20 kg/wk' },
                      { key: 'optimal', label: 'Optimal Pro', rate: goalMode === 'fat_loss' ? '0.50 kg/wk' : '0.35 kg/wk' },
                      { key: 'aggressive', label: 'Aggressive', rate: goalMode === 'fat_loss' ? '0.75 kg/wk' : '0.50 kg/wk' },
                    ].map((p) => {
                      const isActive = pace === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPace(p.key as PaceLevel)}
                          className={`py-1.5 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-black font-bold'
                              : 'border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-white/[0.03]'
                          }`}
                        >
                          <div className="text-[10px] font-bold leading-tight">{p.label}</div>
                          <div className="text-[8.5px] font-mono opacity-80 mt-0.5">{p.rate}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intelligent Timeline Telemetry Banner */}
                {weeksToGoal > 0 && estimatedArrivalDate && (
                  <div className="bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl py-2 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#DC2626] dark:text-[#EF4444]" />
                      <span>Est. Timeline: <strong className="text-zinc-900 dark:text-white font-mono">{weeksToGoal} wks</strong></span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                      Target: {estimatedArrivalDate}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Substrate Partitioning Strategy */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider block">
              3. Macro Substrate Partitioning
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'balanced', label: 'Balanced Athletic', p: '1.8 g/kg P', f: '1.0 g/kg F', desc: 'Standard hyper-performance split' },
                { key: 'high_protein', label: 'High Protein Cutting', p: '2.2 g/kg P', f: '0.8 g/kg F', desc: 'Max lean mass retention in deficit' },
                { key: 'low_carb', label: 'Keto / Low Carb', p: '2.0 g/kg P', f: '1.2 g/kg F', desc: 'Insulin-sensitive substrate shift' },
                { key: 'zone', label: 'Zone 40/30/30', p: '1.8 g/kg P', f: '1.0 g/kg F', desc: 'Metabolic conditioning balance' },
              ].map((m) => {
                const isActive = macroSplit === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMacroSplit(m.key as MacroSplit)}
                    className={`py-2 px-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#DC2626] bg-red-500/10 dark:bg-red-500/15 shadow-xs'
                        : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isActive ? 'text-[#DC2626] dark:text-[#EF4444]' : 'text-zinc-900 dark:text-white'}`}>
                        {m.label}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#DC2626] dark:text-[#EF4444]" />}
                    </div>
                    <div className="text-[9.5px] font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {m.p} • {m.f}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Live Calculated Target Card (Apple Pro Obsidian) */}
          <div className="bg-[#121316] text-white rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Prescribed Targets Preview
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold text-xs">
                {targetCals.toLocaleString()} kcal/day
              </div>
            </div>

            {/* BMR / TDEE / Target Metric Trio */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-white/[0.04] rounded-2xl p-2.5 border border-white/[0.06]">
                <div className="text-[9px] text-zinc-400 uppercase font-semibold">Basal (BMR)</div>
                <div className="text-xs font-bold text-white mt-0.5">{calculatedBmr} kcal</div>
              </div>
              <div className="bg-white/[0.04] rounded-2xl p-2.5 border border-white/[0.06]">
                <div className="text-[9px] text-zinc-400 uppercase font-semibold">Maintenance (TDEE)</div>
                <div className="text-xs font-bold text-white mt-0.5">{tdee} kcal</div>
              </div>
              <div className="bg-white/[0.04] rounded-2xl p-2.5 border border-white/[0.06]">
                <div className="text-[9px] text-zinc-400 uppercase font-semibold">Net Target</div>
                <div className="text-xs font-extrabold text-red-400 mt-0.5">{targetCals} kcal</div>
              </div>
            </div>

            {/* Proportional Macro Energy Ratio Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-zinc-300 px-0.5">
                <span>Protein {pPercent}%</span>
                <span>Carbs {cPercent}%</span>
                <span>Fat {fPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-white/10">
                <div style={{ width: `${pPercent}%` }} className="bg-[#EF4444] h-full" title={`Protein ${pPercent}%`} />
                <div style={{ width: `${cPercent}%` }} className="bg-zinc-300 h-full" title={`Carbs ${cPercent}%`} />
                <div style={{ width: `${fPercent}%` }} className="bg-[#F59E0B] h-full" title={`Fat ${fPercent}%`} />
              </div>
            </div>

            {/* Clean Grams & Energy Breakdown Cards (Pure Neutral & OFC Crimson) */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                <div className="text-[9px] text-red-400 uppercase font-bold tracking-wide">Protein</div>
                <div className="text-lg font-black text-white mt-0.5">{pGrams}g</div>
                <div className="text-[10px] text-zinc-400">{pCals} kcal</div>
              </div>

              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3">
                <div className="text-[9px] text-zinc-300 uppercase font-bold tracking-wide">Carbs</div>
                <div className="text-lg font-black text-white mt-0.5">{cGrams}g</div>
                <div className="text-[10px] text-zinc-400">{cCals} kcal</div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
                <div className="text-[9px] text-amber-400 uppercase font-bold tracking-wide">Fat</div>
                <div className="text-lg font-black text-white mt-0.5">{fGrams}g</div>
                <div className="text-[10px] text-zinc-400">{fCals} kcal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Prescribed Targets ({targetCals.toLocaleString()} kcal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};




