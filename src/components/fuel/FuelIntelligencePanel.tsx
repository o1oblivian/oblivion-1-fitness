import React, { useState } from 'react';
import { ChevronDown, Target, Zap, TrendingUp, Calculator } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

type Tab = 'targets' | 'energy' | 'trends';

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
  const [activeTab, setActiveTab] = useState<Tab>('targets');
  const [isSaving, setIsSaving] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Derived values
  const remainingCals = goalCals - totalIntakeCals + trainingBurn;
  const totalDailyExpenditure = bmr + trainingBurn;
  const netCals = totalIntakeCals - totalDailyExpenditure;
  const balanceLabel =
    Math.abs(netCals) <= 150 ? 'BALANCED' : netCals < -150 ? 'DEFICIT' : 'SURPLUS';

  const totalMacroGrams = totalP + totalC + totalF;
  const goalMacroGrams = goalP + goalC + goalF;
  const totalMacroCals = totalP * 4 + totalC * 4 + totalF * 9;
  const goalMacroCals = goalP * 4 + goalC * 4 + goalF * 9;

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
        showToast('Targets saved to cloud!', 'success');
      } catch {
        showToast('Saved locally (cloud sync failed)', 'success');
      }
    } else {
      showToast('Targets saved!', 'success');
    }
    setIsSaving(false);
  };

  // Pie chart data for trends
  const currentPieData =
    totalMacroGrams === 0
      ? [
          { name: 'Protein (0g)', value: 1, color: '#E11D4833', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Carbs (0g)', value: 1, color: '#F59E0B33', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Fat (0g)', value: 1, color: '#10B98133', unit: 'g', calories: 0, isPlaceholder: true },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: totalP, color: '#E11D48', unit: 'g', calories: totalP * 4, goal: goalP },
          { name: 'Carbs', value: totalC, color: '#F59E0B', unit: 'g', calories: totalC * 4, goal: goalC },
          { name: 'Fat', value: totalF, color: '#10B981', unit: 'g', calories: totalF * 9, goal: goalF },
        ]
      : [
          { name: 'Protein', value: totalP * 4, color: '#E11D48', unit: 'kcal', calories: totalP * 4, goal: goalP * 4 },
          { name: 'Carbs', value: totalC * 4, color: '#F59E0B', unit: 'kcal', calories: totalC * 4, goal: goalC * 4 },
          { name: 'Fat', value: totalF * 9, color: '#10B981', unit: 'kcal', calories: totalF * 9, goal: goalF * 9 },
        ];

  const targetPieData =
    goalMacroGrams === 0
      ? [
          { name: 'Protein Goal', value: 1, color: '#E11D4833', unit: 'g', calories: 0 },
          { name: 'Carbs Goal', value: 1, color: '#F59E0B33', unit: 'g', calories: 0 },
          { name: 'Fat Goal', value: 1, color: '#10B98133', unit: 'g', calories: 0 },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: goalP, color: '#E11D48', unit: 'g', calories: goalP * 4 },
          { name: 'Carbs', value: goalC, color: '#F59E0B', unit: 'g', calories: goalC * 4 },
          { name: 'Fat', value: goalF, color: '#10B981', unit: 'g', calories: goalF * 9 },
        ]
      : [
          { name: 'Protein', value: goalP * 4, color: '#E11D48', unit: 'kcal', calories: goalP * 4 },
          { name: 'Carbs', value: goalC * 4, color: '#F59E0B', unit: 'kcal', calories: goalC * 4 },
          { name: 'Fat', value: goalF * 9, color: '#10B981', unit: 'kcal', calories: goalF * 9 },
        ];

  const tabs: { id: Tab; label: string; icon: typeof Target }[] = [
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  return (
    <div className="glass-premium rounded-2xl overflow-hidden text-[#000000] dark:text-[#FFFFFF] card-lift">
      {/* Unified Header — borderless, separated by negative space */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-2 rounded-xl bg-[#FF3B30]/10 dark:bg-[#FF453A]/10 text-[#FF3B30] dark:text-[#FF453A] shrink-0">
            <Target className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-[16px] font-bold tracking-tight truncate text-[#000000] dark:text-white">Fuel Intelligence</h2>
            <p className="text-[11px] sm:text-[12px] font-medium text-[#5A5F5D] dark:text-gray-500 truncate mt-0.5">
              {totalIntakeCals} / {goalCals} kcal · {remainingCals >= 0 ? `${remainingCals} left` : `${Math.abs(remainingCals)} over`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-mono font-black px-2 py-1 rounded-full uppercase tracking-widest ${
            balanceLabel === 'BALANCED'
              ? 'bg-[#10B981]/15 text-[#10B981]'
              : balanceLabel === 'DEFICIT'
              ? 'bg-[#FF3B30]/10 dark:bg-[#FF453A]/10 text-[#FF3B30] dark:text-[#FF453A]'
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {balanceLabel}
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-xl bg-[#F2F2F7] dark:bg-white/5 flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all duration-200"
          >
            <ChevronDown className={`w-4 h-4 text-[#5A5F5D] dark:text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Tab Selector — borderless, floating glass */}
          <div className="flex gap-1 px-3 py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#1C1C1E] dark:bg-[#1A1E1D] text-white'
                      : 'text-[#5A5F5D] dark:text-gray-500 hover:text-[#000000] dark:hover:text-white hover:bg-[#F2F2F7] dark:hover:bg-white/5'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="px-3 pb-3 pt-1.5 space-y-2.5">
            {/* TARGETS TAB */}
            {activeTab === 'targets' && (
              <>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  <div className="col-span-2">
                    <label className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#5A5F5D] dark:text-gray-500 uppercase mb-1.5 block">
                      Daily Cals
                    </label>
                    <input
                      type="number"
                      value={goalCals === 0 ? '' : goalCals}
                      placeholder="0"
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
                      className="w-full bg-[#F2F2F7] dark:bg-white/5 border border-transparent rounded-xl px-3 py-2 outline-none font-mono font-black text-base text-[#000000] dark:text-white transition-all duration-200 focus:border-[#FF3B30] dark:focus:border-[#FF453A] active:scale-[0.98]"
                    />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#FF3B30] dark:text-[#FF453A] uppercase mb-1.5 block text-center">
                      Pro(g)
                    </label>
                    <input
                      type="number"
                      value={goalP === 0 ? '' : goalP}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalP(parseInt(clean) || 0);
                      }}
                      className="w-full bg-[#F2F2F7] dark:bg-white/5 border border-transparent rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-[#000000] dark:text-white transition-all duration-200 focus:border-[#FF3B30] dark:focus:border-[#FF453A] active:scale-[0.98]"
                    />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#F59E0B] uppercase mb-1.5 block text-center">
                      Carb(g)
                    </label>
                    <input
                      type="number"
                      value={goalC === 0 ? '' : goalC}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalC(parseInt(clean) || 0);
                      }}
                      className="w-full bg-[#F2F2F7] dark:bg-white/5 border border-transparent rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-[#000000] dark:text-white transition-all duration-200 focus:border-[#F59E0B] active:scale-[0.98]"
                    />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#10B981] uppercase mb-1.5 block text-center">
                      Fat(g)
                    </label>
                    <input
                      type="number"
                      value={goalF === 0 ? '' : goalF}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/^0+(?=\d)/, '');
                        setGoalF(parseInt(clean) || 0);
                      }}
                      className="w-full bg-[#F2F2F7] dark:bg-white/5 border border-transparent rounded-xl px-1 py-2 outline-none font-mono font-bold text-center text-xs text-[#000000] dark:text-white transition-all duration-200 focus:border-[#10B981] active:scale-[0.98]"
                    />
                  </div>
                </div>

                {/* BMR row — separated by negative space, no dividing line */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#5A5F5D] dark:text-gray-500 uppercase">
                    Base Metabolic Rate
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={bmr}
                      onChange={(e) => setBmr(parseInt(e.target.value) || 0)}
                      className="w-24 bg-[#F2F2F7] dark:bg-white/5 border border-transparent text-right rounded-xl px-2 py-1 font-mono font-bold text-[#000000] dark:text-white outline-none text-xs focus:border-[#FF3B30] dark:focus:border-[#FF453A] transition-all duration-200"
                    />
                    <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#5A5F5D] dark:text-gray-500 uppercase">kcal</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-1.5">
                  <button
                    onClick={onOpenAutoPilot}
                    className="text-[13px] font-semibold text-[#000000] dark:text-gray-200 bg-[#F2F2F7] dark:bg-white/5 hover:bg-[#E5E5EA] dark:hover:bg-white/10 px-3 py-2 rounded-xl active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                    Macro Calculator
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-[13px] font-semibold text-white bg-[#FF3B30] dark:bg-[#FF453A] hover:bg-[#E52E24] dark:hover:bg-[#FF3B30] px-4 py-2 rounded-xl active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save Targets'}
                  </button>
                </div>
              </>
            )}

            {/* ENERGY TAB */}
            {activeTab === 'energy' && (
              <>
                <div className="grid grid-cols-4 gap-2 text-center items-center">
                  <div className="flex flex-col items-center bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-2xl">
                    <div className="text-lg font-black font-mono text-[#000000] dark:text-white">
                      {goalCals}
                    </div>
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#5A5F5D] dark:text-gray-500 uppercase mt-0.5">
                      Target
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-2xl">
                    <div className="text-lg font-black font-mono text-[#000000] dark:text-white">
                      {totalIntakeCals}
                    </div>
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#5A5F5D] dark:text-gray-500 uppercase mt-0.5">
                      Intake
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-2xl">
                    <div className="text-lg font-black font-mono text-[#FF3B30] dark:text-[#FF453A]">
                      {trainingBurn}
                    </div>
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#FF3B30] dark:text-[#FF453A] uppercase mt-0.5">
                      Burn
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-[#10B981]/10 p-2 rounded-2xl">
                    <div className="text-lg font-black font-mono text-[#10B981]">
                      {remainingCals}
                    </div>
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#10B981] uppercase mt-0.5">
                      Remain
                    </div>
                  </div>
                </div>

                {/* Energy balance bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] sm:text-[12px] font-medium text-[#5A5F5D] dark:text-gray-500">
                    <span>Intake: {totalIntakeCals} kcal</span>
                    <span>Expenditure: {totalDailyExpenditure} kcal</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-[#E5E5EA] dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF3B30] to-[#10B981] rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (totalIntakeCals / (totalDailyExpenditure || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-[11px] sm:text-[12px] font-medium text-[#5A5F5D] dark:text-gray-500 px-1 flex-wrap gap-2">
                  <div>
                    Base BMR: <span className="text-[#000000] dark:text-white font-black">{bmr} kcal</span>
                  </div>
                  <div>
                    Exercise Burn: <span className="text-[#FF3B30] dark:text-[#FF453A] font-black">{trainingBurn} kcal</span>
                  </div>
                  <div>
                    Est. Spend: <span className="text-[#000000] dark:text-white font-black">{totalDailyExpenditure} kcal</span>
                  </div>
                </div>
              </>
            )}

            {/* TRENDS TAB */}
            {activeTab === 'trends' && (
              <>
                {/* Unit toggle — borderless glass */}
                <div className="flex justify-end">
                  <div className="flex bg-[#F2F2F7] dark:bg-white/5 p-1 rounded-xl font-mono">
                    <button
                      onClick={() => setTrendUnit('grams')}
                      className={`px-3 py-1 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                        trendUnit === 'grams' ? 'bg-[#1A1E1D] text-white' : 'text-[#5A5F5D] dark:text-gray-500 hover:text-[#000000] dark:hover:text-white'
                      }`}
                    >
                      Grams
                    </button>
                    <button
                      onClick={() => setTrendUnit('calories')}
                      className={`px-3 py-1 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                        trendUnit === 'calories' ? 'bg-[#1A1E1D] text-white' : 'text-[#5A5F5D] dark:text-gray-500 hover:text-[#000000] dark:hover:text-white'
                      }`}
                    >
                      kcal
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Compact Donut Charts — borderless tiles */}
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div className="bg-[#F2F2F7] dark:bg-white/5 rounded-2xl p-3 flex flex-col items-center">
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#000000] dark:text-white uppercase mb-1.5 flex items-center gap-1 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] dark:bg-[#FF453A]" /> Current
                    </div>
                    <div className="w-full h-24 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={currentPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={34} paddingAngle={3} dataKey="value" stroke="none">
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
                                    <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl text-[10px] font-mono text-[#5A5F5D] shadow-2xs">
                                      No meals logged
                                    </div>
                                  );
                                }
                                const totalSum = currentPieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                const pct = Math.round((d.value / totalSum) * 100);
                                return (
                                  <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                                    <div className="font-bold" style={{ color: d.color }}>{d.name}</div>
                                    <div className="text-[#000000] mt-0.5">{d.value} {d.unit} ({pct}%)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-3">
                        <span className="text-[11px] sm:text-[12px] font-medium font-mono text-[#000000] leading-none">
                          {trendUnit === 'grams' ? `${totalMacroGrams}g` : `${totalMacroCals}`}
                        </span>
                        <span className="text-[7px] font-mono text-[#5A5F5D] uppercase leading-none mt-0.5">
                          {trendUnit === 'grams' ? 'Intake' : 'kcal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F2F2F7] dark:bg-white/5 rounded-2xl p-3 flex flex-col items-center">
                    <div className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#000000] dark:text-white uppercase mb-1.5 flex items-center gap-1 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Target
                    </div>
                    <div className="w-full h-24 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={targetPieData} cx="50%" cy="50%" innerRadius={22} outerRadius={34} paddingAngle={3} dataKey="value" stroke="none">
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
                                  <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                                    <div className="font-bold" style={{ color: d.color }}>{d.name}</div>
                                    <div className="text-[#000000] mt-0.5">Target: {d.value} {d.unit} ({pct}%)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-3">
                        <span className="text-[11px] sm:text-[12px] font-medium font-mono text-[#000000] leading-none">
                          {trendUnit === 'grams' ? `${goalMacroGrams}g` : `${goalMacroCals}`}
                        </span>
                        <span className="text-[7px] font-mono text-[#5A5F5D] uppercase leading-none mt-0.5">
                          {trendUnit === 'grams' ? 'Target' : 'kcal'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Compact Badges — borderless tiles, negative space separation */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono">
                  <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#FF3B30] dark:text-[#FF453A] uppercase">Protein</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-[#000000] dark:text-white mt-0.5">{totalP}g / {goalP}g</span>
                    <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10 mt-1 overflow-hidden">
                      <div className="h-full bg-[#FF3B30] dark:bg-[#FF453A] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalP / (goalP || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#F59E0B] uppercase">Carbs</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-[#000000] dark:text-white mt-0.5">{totalC}g / {goalC}g</span>
                    <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10 mt-1 overflow-hidden">
                      <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalC / (goalC || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wide text-[#10B981] uppercase">Fat</span>
                    <span className="text-[11px] sm:text-[12px] font-medium text-[#000000] dark:text-white mt-0.5">{totalF}g / {goalF}g</span>
                    <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10 mt-1 overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalF / (goalF || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
