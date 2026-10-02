import React from 'react';
import { Flame, Activity, Target } from 'lucide-react';

interface DailyEnergySplitTabProps {
  proteinG: number;
  proteinTarget: number;
  carbsG: number;
  carbsTarget: number;
  fatsG: number;
  fatsTarget: number;
  dailyTargetKcal: number;
  eatenKcal?: number;
  burnedKcal?: number;
}

export const DailyEnergySplitTab: React.FC<DailyEnergySplitTabProps> = ({
  proteinG,
  proteinTarget,
  carbsG,
  carbsTarget,
  fatsG,
  fatsTarget,
  dailyTargetKcal,
  eatenKcal = 0,
  burnedKcal = 0,
}) => {
  const effectiveTargetKcal = dailyTargetKcal > 0 ? dailyTargetKcal : 2200;
  const consumedKcal = eatenKcal > 0 ? eatenKcal : proteinG * 4 + carbsG * 4 + fatsG * 9;
  const remainingKcal = Math.max(0, effectiveTargetKcal + burnedKcal - consumedKcal);
  const budgetPct = Math.min(100, Math.round((consumedKcal / effectiveTargetKcal) * 100));

  const totalTargetGrams = Math.round(proteinTarget + carbsTarget + fatsTarget);
  const totalConsumedGrams = Math.round(proteinG + carbsG + fatsG);

  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((proteinG / proteinTarget) * 100)) : 0;
  const carbsPct = carbsTarget > 0 ? Math.min(100, Math.round((carbsG / carbsTarget) * 100)) : 0;
  const fatsPct = fatsTarget > 0 ? Math.min(100, Math.round((fatsG / fatsTarget) * 100)) : 0;

  const bmr = 2000;
  const totalDailyBurn = bmr + burnedKcal;

  const formatKcal = (val: number) => {
    if (val % 1 !== 0) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    }
    return val.toLocaleString();
  };

  // SVG Radial Gauge Geometry
  const radius = 56;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, budgetPct)) / 100) * circumference;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none">
      {/* Hero Kinetic Energy Dial & Core Telemetry Hub */}
      <div className="relative rounded-2xl bg-neutral-50 dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800/80 p-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Radial Gauge Visual */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 136 136">
              {/* Background Track - High-contrast on OLED */}
              <circle
                cx="68"
                cy="68"
                r={radius}
                stroke="currentColor"
                className="text-neutral-200 dark:text-white/10"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Dynamic Crimson Progress Ring with explicit SVG stroke for OLED */}
              {consumedKcal > 0 && (
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  stroke="#C4121A"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              )}
            </svg>

            {/* Inner Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight leading-none">
                {formatKcal(remainingKcal)}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                Kcal Left
              </span>
              <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {dailyTargetKcal > 0 ? `${budgetPct}% Used` : `${budgetPct}% (2,200 Goal)`}
              </span>
            </div>
          </div>

          {/* 3 Telemetry Pill Cards */}
          <div className="w-full sm:w-auto flex-1 grid grid-cols-3 gap-2">
            {/* Eaten */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <Target className="w-3 h-3 text-neutral-400" />
                <span>Eaten</span>
              </div>
              <span className="text-sm font-black font-mono text-neutral-900 dark:text-white mt-0.5">
                {Math.round(consumedKcal).toLocaleString()}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">kcal</span>
            </div>

            {/* Burned */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-red-200/70 dark:border-red-950/60 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C4121A]">
                <Activity className="w-3 h-3 text-[#C4121A]" />
                <span>Burn</span>
              </div>
              <span className="text-sm font-black font-mono text-[#C4121A] mt-0.5">
                +{formatKcal(burnedKcal)}
              </span>
              <span className="text-[10px] text-[#C4121A]/80 font-mono">kcal</span>
            </div>

            {/* Budget */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <Flame className="w-3 h-3 text-neutral-400" />
                <span>Budget</span>
              </div>
              <span className="text-sm font-black font-mono text-neutral-900 dark:text-white mt-0.5">
                {dailyTargetKcal > 0 ? Math.round(dailyTargetKcal).toLocaleString() : 'Not Set'}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">kcal</span>
            </div>
          </div>
        </div>

        {/* Linear Progress Sub-Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>Daily Budget Progress</span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {dailyTargetKcal > 0
                ? `${Math.round(consumedKcal)} / ${Math.round(dailyTargetKcal)} kcal`
                : `${Math.round(consumedKcal)} kcal logged (no target set)`}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C4121A] to-[#a50f16] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, budgetPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Macronutrients Section Header */}
      <div className="flex items-center justify-between px-0.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            Macro Partitioning
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/20">
            {totalConsumedGrams}g / {totalTargetGrams}g
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400">
          Target Ratio
        </span>
      </div>

      {/* 3 Dedicated High-Contrast Macro Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Protein Card (Oblivion 1 Crimson) */}
        <div className="bg-neutral-50 dark:bg-[#18181b] border border-red-200/80 dark:border-red-950/60 rounded-2xl p-3 flex flex-col justify-between space-y-2.5 shadow-2xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C4121A] shadow-xs" />
              <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                Protein
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/50 text-[#C4121A]">
              {proteinPct}%
            </span>
          </div>

          <div>
            <div className="text-sm sm:text-base font-black text-neutral-900 dark:text-white font-mono leading-none">
              {Math.round(proteinG)}g
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 block">
              of {proteinTarget}g target
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C4121A] transition-all duration-300"
                style={{ width: `${proteinPct}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 font-mono block text-right">
              {Math.max(0, proteinTarget - Math.round(proteinG))}g left
            </span>
          </div>
        </div>

        {/* Carbs Card (Warm Solar Amber) */}
        <div className="bg-neutral-50 dark:bg-[#18181b] border border-amber-200/80 dark:border-amber-950/60 rounded-2xl p-3 flex flex-col justify-between space-y-2.5 shadow-2xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-xs" />
              <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                Carbs
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              {carbsPct}%
            </span>
          </div>

          <div>
            <div className="text-sm sm:text-base font-black text-neutral-900 dark:text-white font-mono leading-none">
              {Math.round(carbsG)}g
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 block">
              of {carbsTarget}g target
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#f59e0b] transition-all duration-300"
                style={{ width: `${carbsPct}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 font-mono block text-right">
              {Math.max(0, carbsTarget - Math.round(carbsG))}g left
            </span>
          </div>
        </div>

        {/* Fats Card (Slate / Sky Blue) */}
        <div className="bg-neutral-50 dark:bg-[#18181b] border border-sky-200/80 dark:border-sky-950/60 rounded-2xl p-3 flex flex-col justify-between space-y-2.5 shadow-2xs transition-transform hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shadow-xs" />
              <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                Fats
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              {fatsPct}%
            </span>
          </div>

          <div>
            <div className="text-sm sm:text-base font-black text-neutral-900 dark:text-white font-mono leading-none">
              {Math.round(fatsG)}g
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 block">
              of {fatsTarget}g target
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0284c7] transition-all duration-300"
                style={{ width: `${fatsPct}%` }}
              />
            </div>
            <span className="text-[9px] text-neutral-400 font-mono block text-right">
              {Math.max(0, fatsTarget - Math.round(fatsG))}g left
            </span>
          </div>
        </div>
      </div>

      {/* Metabolic Footprint Summary */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-[#18181b]/50 border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#C4121A]" />
          <span>Total Metabolic Burn:</span>
          <strong className="text-neutral-900 dark:text-white font-bold">{formatKcal(totalDailyBurn)} kcal</strong>
        </span>
        <span className="text-[10px] text-neutral-400">BMR: {bmr} kcal</span>
      </div>
    </div>
  );
};

export default DailyEnergySplitTab;
