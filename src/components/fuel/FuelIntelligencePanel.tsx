import React, { useState } from 'react';
import { ChevronDown, Zap, Scale, Check, Calculator, SlidersHorizontal, PieChart as PieChartIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getStoredWeightHistory, recordAthleteWeight, WeightEntry } from '../../utils/tdeeEngine';
import { haptic } from '../../utils/haptics';

interface FuelIntelligencePanelProps {
  goalCals: number;
  setGoalCals: (cals: number) => void;
  goalP: number;
  setGoalP: (p: number) => void;
  goalC: number;
  setGoalC: (c: number) => void;
  goalF: number;
  setGoalF: (f: number) => void;
  bmr: number;
  setBmr: (bmr: number) => void;
  totalIntakeCals: number;
  totalP: number;
  totalC: number;
  totalF: number;
  trainingBurn: number;
  trendUnit: 'grams' | 'calories';
  setTrendUnit: (unit: 'grams' | 'calories') => void;
  onOpenAutoPilot: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

type TabMode = 'today' | 'macros' | 'adjust';

export const FuelIntelligencePanel: React.FC<FuelIntelligencePanelProps> = ({
  goalCals, setGoalCals,
  goalP, setGoalP,
  goalC, setGoalC,
  goalF, setGoalF,
  bmr, setBmr,
  totalIntakeCals, totalP, totalC, totalF,
  trainingBurn,
  trendUnit, setTrendUnit,
  onOpenAutoPilot, showToast, currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('today');
  const [isSaving, setIsSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [weights, setWeights] = useState<WeightEntry[]>(() => getStoredWeightHistory());
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : 80.0;

  // Derived budget & balance numbers
  const totalBudget = goalCals + trainingBurn;
  const remainingCals = totalBudget - totalIntakeCals;
  const totalDailyExpenditure = bmr + trainingBurn;
  const netEnergyBalance = totalIntakeCals - totalDailyExpenditure;

  // Percentage consumed of daily budget
  const budgetConsumedPct = totalBudget > 0
    ? Math.min(100, Math.max(0, Math.round((totalIntakeCals / totalBudget) * 100)))
    : 0;

  // Macro progress percentages
  const pPct = goalP > 0 ? Math.min(100, Math.round((totalP / goalP) * 100)) : 0;
  const cPct = goalC > 0 ? Math.min(100, Math.round((totalC / goalC) * 100)) : 0;
  const fPct = goalF > 0 ? Math.min(100, Math.round((totalF / goalF) * 100)) : 0;

  const totalMacroGrams = totalP + totalC + totalF;
  const goalMacroGrams = goalP + goalC + goalF;
  const totalMacroCals = totalP * 4 + totalC * 4 + totalF * 9;
  const goalMacroCals = goalP * 4 + goalC * 4 + goalF * 9;
  const hasMacroMismatch = goalCals > 0 && Math.abs(goalMacroCals - goalCals) > 15;

  const handleSaveWeight = () => {
    const num = parseFloat(weightInput);
    if (!num || num < 30 || num > 300) {
      showToast('Please enter a valid weight (30 - 300 kg)', 'error');
      return;
    }
    haptic.tap();
    const updated = recordAthleteWeight(num);
    setWeights(updated);
    setWeightInput('');
    setIsWeighInOpen(false);
    showToast(`Weight recorded: ${num.toFixed(1)} kg`, 'success');
  };

  const handleApplyPreset = (type: 'lose' | 'maintain' | 'build') => {
    haptic.tap();
    const baseSpend = bmr > 0 ? (bmr + trainingBurn) : 2000;
    let target = baseSpend;
    if (type === 'lose') {
      target = Math.max(1200, Math.round(baseSpend - 400));
    } else if (type === 'build') {
      target = Math.round(baseSpend + 300);
    } else {
      target = Math.round(baseSpend);
    }
    setGoalCals(target);
    // Balanced athletic split: 30% Protein, 45% Carbs, 25% Fat
    const p = Math.round((target * 0.30) / 4);
    const c = Math.round((target * 0.45) / 4);
    const f = Math.round((target * 0.25) / 9);
    setGoalP(p);
    setGoalC(c);
    setGoalF(f);
    showToast(
      type === 'lose'
        ? `Target set to Lose Fat (${target.toLocaleString()} kcal)`
        : type === 'build'
        ? `Target set to Build Muscle (${target.toLocaleString()} kcal)`
        : `Target set to Maintain Weight (${target.toLocaleString()} kcal)`,
      'success'
    );
  };

  const syncCalsFromMacros = () => {
    haptic.tap();
    const total = goalP * 4 + goalC * 4 + goalF * 9;
    setGoalCals(total);
    showToast(`Daily calories set to macro total (${total.toLocaleString()} kcal)`, 'success');
  };

  const autoBalanceMacros = () => {
    if (goalCals <= 0) return;
    haptic.tap();
    const p = Math.round((goalCals * 0.30) / 4);
    const c = Math.round((goalCals * 0.45) / 4);
    const f = Math.round((goalCals * 0.25) / 9);
    setGoalP(p);
    setGoalC(c);
    setGoalF(f);
    showToast(`Macros balanced to ${goalCals.toLocaleString()} kcal`, 'success');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('daily_macros')
          .upsert({
            user_email: currentUserEmail,
            record_date: today,
            calorie_target: goalCals,
            protein_target: goalP,
            carbs_target: goalC,
            fat_target: goalF,
          }, { onConflict: 'user_email,record_date' });
        if (error) throw error;
        showToast('Targets saved to your account', 'success');
      } catch {
        showToast('Saved on device', 'success');
      }
    } else {
      showToast('Targets saved', 'success');
    }
    setIsSaving(false);
  };

  // Pie chart data for trends
  const currentPieData =
    totalMacroGrams === 0
      ? [
          { name: 'Protein', value: 1, color: '#C4121A22', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Carbs', value: 1, color: '#E8B04A22', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Fat', value: 1, color: '#3FB98E22', unit: 'g', calories: 0, isPlaceholder: true },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: totalP, color: '#C4121A', unit: 'g', calories: totalP * 4, goal: goalP },
          { name: 'Carbs', value: totalC, color: '#E8B04A', unit: 'g', calories: totalC * 4, goal: goalC },
          { name: 'Fat', value: totalF, color: '#3FB98E', unit: 'g', calories: totalF * 9, goal: goalF },
        ]
      : [
          { name: 'Protein', value: totalP * 4, color: '#C4121A', unit: 'kcal', calories: totalP * 4, goal: goalP * 4 },
          { name: 'Carbs', value: totalC * 4, color: '#E8B04A', unit: 'kcal', calories: totalC * 4, goal: goalC * 4 },
          { name: 'Fat', value: totalF * 9, color: '#3FB98E', unit: 'kcal', calories: totalF * 9, goal: goalF * 9 },
        ];

  const targetPieData =
    goalMacroGrams === 0
      ? [
          { name: 'Protein Goal', value: 1, color: '#C4121A22', unit: 'g', calories: 0 },
          { name: 'Carbs Goal', value: 1, color: '#E8B04A22', unit: 'g', calories: 0 },
          { name: 'Fat Goal', value: 1, color: '#3FB98E22', unit: 'g', calories: 0 },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: goalP, color: '#C4121A', unit: 'g', calories: goalP * 4 },
          { name: 'Carbs', value: goalC, color: '#E8B04A', unit: 'g', calories: goalC * 4 },
          { name: 'Fat', value: goalF, color: '#3FB98E', unit: 'g', calories: goalF * 9 },
        ]
      : [
          { name: 'Protein', value: goalP * 4, color: '#C4121A', unit: 'kcal', calories: goalP * 4 },
          { name: 'Carbs', value: goalC * 4, color: '#E8B04A', unit: 'kcal', calories: goalC * 4 },
          { name: 'Fat', value: goalF * 9, color: '#3FB98E', unit: 'kcal', calories: goalF * 9 },
        ];

  return (
    <div className="bg-white dark:bg-[#121214] border border-[#EAE8E3] dark:border-white/10 rounded-2xl overflow-hidden text-zinc-900 dark:text-white shadow-2xs">
      {/* 1. Header Surface */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-[#C4121A]/10 text-[#C4121A] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              Daily Energy
            </h2>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {remainingCals >= 0 ? `${remainingCals.toLocaleString()} kcal left today` : `${Math.abs(remainingCals).toLocaleString()} kcal over target`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Weigh-in quick button */}
          <button
            onClick={() => setIsWeighInOpen(!isWeighInOpen)}
            className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Record body weight"
          >
            <Scale className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{latestWeight.toFixed(1)} kg</span>
          </button>

          {/* Simple status badge */}
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            remainingCals >= 0
              ? 'bg-[#3FB98E]/15 text-[#3FB98E]'
              : 'bg-[#C4121A]/10 text-[#C4121A]'
          }`}>
            {remainingCals >= 0 ? 'On Track' : 'Over Target'}
          </span>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Toggle panel"
          >
            <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Inline Weigh-In Bar */}
      {isWeighInOpen && (
        <div className="px-3.5 py-2 flex items-center gap-2 bg-zinc-50/80 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/5 animate-in fade-in duration-150">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-xl px-2.5 py-1.5 border border-zinc-200 dark:border-white/10 focus-within:border-[#C4121A]">
            <Scale className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="number"
              step="0.1"
              placeholder={`Enter weight in kg (current: ${latestWeight.toFixed(1)})...`}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveWeight()}
              className="w-full bg-transparent outline-none font-mono text-xs text-zinc-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSaveWeight}
            className="px-3 py-1.5 rounded-xl bg-[#C4121A] hover:bg-[#9B0E14] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Save Weight
          </button>
        </div>
      )}

      {!collapsed && (
        <>
          {/* Segmented Tab Navigation */}
          <div className="px-3 pt-2 pb-0.5 flex gap-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setActiveTab('macros')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'macros'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <PieChartIcon className="w-3 h-3" />
              <span>Macro Split</span>
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'adjust'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Adjust Targets</span>
            </button>
          </div>

          <div className="p-3 space-y-2.5">
            {/* ----------------- TAB 1: TODAY (LIVE TELEMETRY) ----------------- */}
            {activeTab === 'today' && (
              <div className="space-y-2 animate-in fade-in duration-150">
                {/* Unified Energy HUD Box */}
                <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white">
                        {remainingCals >= 0 ? remainingCals.toLocaleString() : Math.abs(remainingCals).toLocaleString()}
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                        kcal
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-0.5">
                        {remainingCals >= 0 ? 'Remaining' : 'Over Target'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 text-right">
                      <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                        {budgetConsumedPct}%
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-medium">
                        budget
                      </span>
                    </div>
                  </div>

                  {/* Clean progress bar */}
                  <div className="relative h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        remainingCals >= 0
                          ? 'bg-zinc-900 dark:bg-white'
                          : 'bg-[#C4121A]'
                      }`}
                      style={{ width: `${budgetConsumedPct}%` }}
                    />
                  </div>

                  {/* 3-Column Clean Glance */}
                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-zinc-200/50 dark:border-white/5 text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Eaten
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white mt-0.5">
                        {totalIntakeCals.toLocaleString()} <span className="text-[9px] font-normal text-zinc-400">kcal</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[9.5px] font-semibold text-[#C4121A] uppercase tracking-wider">
                        Exercise Burn
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-[#C4121A] mt-0.5">
                        +{trainingBurn.toLocaleString()} <span className="text-[9px] font-normal text-zinc-400">kcal</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] sm:text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Daily Target
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white mt-0.5">
                        {goalCals.toLocaleString()} <span className="text-[9px] font-normal text-zinc-400">kcal</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Macronutrient Tracking - High-density 3-column glance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Macronutrients
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                      {totalMacroGrams}g / {goalMacroGrams}g consumed
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Protein */}
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.05]">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A]" />
                          Protein
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {goalP > totalP ? `${goalP - totalP}g` : 'Met'}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mb-1">
                        {totalP}g <span className="text-[9.5px] font-normal text-zinc-400">/ {goalP}g</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#C4121A] rounded-full transition-all duration-500"
                          style={{ width: `${pPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Carbohydrates */}
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.05]">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8B04A]" />
                          Carbs
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {goalC > totalC ? `${goalC - totalC}g` : 'Met'}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mb-1">
                        {totalC}g <span className="text-[9.5px] font-normal text-zinc-400">/ {goalC}g</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#E8B04A] rounded-full transition-all duration-500"
                          style={{ width: `${cPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Fats */}
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.05]">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3FB98E]" />
                          Fats
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {goalF > totalF ? `${goalF - totalF}g` : 'Met'}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-zinc-900 dark:text-white mb-1">
                        {totalF}g <span className="text-[9.5px] font-normal text-zinc-400">/ {goalF}g</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#3FB98E] rounded-full transition-all duration-500"
                          style={{ width: `${fPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer note & shortcut */}
                <div className="flex items-center justify-between px-0.5 pt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>
                    Total Daily Burn: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{totalDailyExpenditure.toLocaleString()}</strong> kcal (BMR: {bmr})
                  </span>
                  <button
                    onClick={() => setActiveTab('adjust')}
                    className="text-[#C4121A] hover:underline font-semibold cursor-pointer text-[10.5px]"
                  >
                    Adjust Targets
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- TAB 2: MACRO SPLIT (RATIOS & DONUT CHARTS) ----------------- */}
            {activeTab === 'macros' && (
              <div className="space-y-2 animate-in fade-in duration-150">
                {/* Unit Switcher */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Ratio Breakdown
                  </span>
                  <div className="flex bg-zinc-100 dark:bg-white/5 p-0.5 rounded-xl font-mono text-[11px]">
                    <button
                      onClick={() => setTrendUnit('grams')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        trendUnit === 'grams'
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      Grams
                    </button>
                    <button
                      onClick={() => setTrendUnit('calories')}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        trendUnit === 'calories'
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      Calories
                    </button>
                  </div>
                </div>

                {/* Side-by-side charts */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl p-2 flex flex-col items-center">
                    <div className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 self-start">
                      Current Intake
                    </div>
                    <div className="w-full h-20 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={currentPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={34}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {currentPieData.map((entry, index) => (
                              <Cell key={`cell-curr-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                if (d.isPlaceholder) {
                                  return (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-1.5 rounded-xl text-[10px] font-mono text-zinc-500 shadow-2xs">
                                      No food logged today
                                    </div>
                                  );
                                }
                                const totalSum = currentPieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                const pct = Math.round((d.value / totalSum) * 100);
                                return (
                                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                                    <div className="font-bold" style={{ color: d.color }}>{d.name}</div>
                                    <div className="text-zinc-700 dark:text-zinc-200 mt-0.5">{d.value} {d.unit} ({pct}%)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-3">
                        <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-white leading-none">
                          {trendUnit === 'grams' ? `${totalMacroGrams}g` : `${totalMacroCals}`}
                        </span>
                        <span className="text-[7.5px] font-mono text-zinc-400 uppercase leading-none mt-0.5">
                          {trendUnit === 'grams' ? 'Intake' : 'kcal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl p-2 flex flex-col items-center">
                    <div className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 self-start">
                      Target Goal
                    </div>
                    <div className="w-full h-20 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={targetPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={22}
                            outerRadius={34}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {targetPieData.map((entry, index) => (
                              <Cell key={`cell-tgt-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                const totalSum = targetPieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                const pct = Math.round((d.value / totalSum) * 100);
                                return (
                                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                                    <div className="font-bold" style={{ color: d.color }}>{d.name}</div>
                                    <div className="text-zinc-700 dark:text-zinc-200 mt-0.5">Target: {d.value} {d.unit} ({pct}%)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-3">
                        <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-white leading-none">
                          {trendUnit === 'grams' ? `${goalMacroGrams}g` : `${goalMacroCals}`}
                        </span>
                        <span className="text-[7.5px] font-mono text-zinc-400 uppercase leading-none mt-0.5">
                          {trendUnit === 'grams' ? 'Target' : 'kcal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro Summary Stats */}
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] p-2 rounded-xl">
                    <span className="text-[9.5px] font-bold text-[#C4121A] uppercase block">Protein</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{totalP}g / {goalP}g</span>
                    <span className="text-[9px] text-zinc-400 block">{totalP * 4} kcal</span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] p-2 rounded-xl">
                    <span className="text-[9.5px] font-bold text-[#E8B04A] uppercase block">Carbs</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{totalC}g / {goalC}g</span>
                    <span className="text-[9px] text-zinc-400 block">{totalC * 4} kcal</span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] p-2 rounded-xl">
                    <span className="text-[9.5px] font-bold text-[#3FB98E] uppercase block">Fats</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{totalF}g / {goalF}g</span>
                    <span className="text-[9px] text-zinc-400 block">{totalF * 9} kcal</span>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TAB 3: ADJUST GOALS & TARGETS ----------------- */}
            {activeTab === 'adjust' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                {/* 1. Quick Presets (Clean, simple language, no jargon!) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Quick Goal Presets
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleApplyPreset('lose')}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/70 dark:border-white/[0.06] text-left transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">Lose Fat</div>
                      <div className="text-[9.5px] font-mono text-[#C4121A] font-semibold mt-0.5">-400 kcal</div>
                    </button>
                    <button
                      onClick={() => handleApplyPreset('maintain')}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/70 dark:border-white/[0.06] text-left transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">Maintain</div>
                      <div className="text-[9.5px] font-mono text-[#3FB98E] font-semibold mt-0.5">Stay Same</div>
                    </button>
                    <button
                      onClick={() => handleApplyPreset('build')}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-zinc-200/70 dark:border-white/[0.06] text-left transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">Build Muscle</div>
                      <div className="text-[9.5px] font-mono text-[#E8B04A] font-semibold mt-0.5">+300 kcal</div>
                    </button>
                  </div>
                </div>

                {/* 2. Target Inputs */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  <div className="col-span-2">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-0.5">
                      Daily Target
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={goalCals === 0 ? '' : goalCals}
                        placeholder="2000"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/^0+(?=\d)/, '');
                          const val = parseInt(clean) || 0;
                          setGoalCals(val);
                          if (val > 0) {
                            setGoalP(Math.round((val * 0.3) / 4));
                            setGoalC(Math.round((val * 0.45) / 4));
                            setGoalF(Math.round((val * 0.25) / 9));
                          }
                        }}
                        className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl px-2.5 py-1.5 font-mono font-bold text-sm text-zinc-900 dark:text-white outline-none focus:border-[#C4121A] transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9.5px] font-mono text-zinc-400 pointer-events-none">
                        kcal
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#C4121A] block text-center mb-0.5">
                      Protein
                    </label>
                    <input
                      type="number"
                      value={goalP === 0 ? '' : goalP}
                      placeholder="150"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalP(parseInt(clean) || 0);
                      }}
                      className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl py-1.5 font-mono font-bold text-xs text-center text-zinc-900 dark:text-white outline-none focus:border-[#C4121A] transition-colors"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#E8B04A] block text-center mb-0.5">
                      Carbs
                    </label>
                    <input
                      type="number"
                      value={goalC === 0 ? '' : goalC}
                      placeholder="200"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalC(parseInt(clean) || 0);
                      }}
                      className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl py-1.5 font-mono font-bold text-xs text-center text-zinc-900 dark:text-white outline-none focus:border-[#E8B04A] transition-colors"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#3FB98E] block text-center mb-0.5">
                      Fats
                    </label>
                    <input
                      type="number"
                      value={goalF === 0 ? '' : goalF}
                      placeholder="60"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalF(parseInt(clean) || 0);
                      }}
                      className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] rounded-xl py-1.5 font-mono font-bold text-xs text-center text-zinc-900 dark:text-white outline-none focus:border-[#3FB98E] transition-colors"
                    />
                  </div>
                </div>

                {/* Macro calorie verification line */}
                {hasMacroMismatch ? (
                  <div className="flex items-center justify-between text-[10.5px] font-mono px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1.5">
                    <span className="truncate">
                      Macros total {goalMacroCals} kcal ({goalMacroCals > goalCals ? `+${goalMacroCals - goalCals}` : `${goalMacroCals - goalCals}`} vs target)
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={syncCalsFromMacros}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        Match Calories
                      </button>
                      <button
                        onClick={autoBalanceMacros}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        Auto-Balance
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] font-mono px-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400">
                    <span>Protein: {goalP * 4} · Carbs: {goalC * 4} · Fat: {goalF * 9} kcal</span>
                    <span className="text-[#3FB98E] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Balanced
                    </span>
                  </div>
                )}

                {/* 3. Resting Burn (BMR) with simple helper text */}
                <div className="flex justify-between items-center pt-0.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Resting Burn (BMR)
                    </span>
                    <span className="text-[9.5px] text-zinc-400">
                      Calories your body burns at rest
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={bmr}
                      onChange={(e) => setBmr(parseInt(e.target.value) || 0)}
                      className="w-20 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] text-right rounded-xl px-2 py-1 font-mono font-bold text-xs text-zinc-900 dark:text-white outline-none focus:border-[#C4121A] transition-colors"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">kcal</span>
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-100 dark:border-white/5">
                  <button
                    onClick={onOpenAutoPilot}
                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#C4121A]" />
                    <span>Calculate Daily Needs</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs font-semibold text-white bg-[#C4121A] hover:bg-[#9B0E14] px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Targets'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
