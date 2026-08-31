import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ExerciseLog } from '../../types';

interface Zone2CardioLongevityProps {
  activeLogs?: ExerciseLog[];
  bmr?: number;
}

function estimateVO2Max(weeklyMinutes: number, bmr: number): number {
  const base = bmr > 0 ? bmr / 100 : 18;
  const boost = weeklyMinutes / 60 * 0.8;
  return Math.min(75, base + boost);
}

function estimateMetabolicScore(weeklyMinutes: number, targetMinutes: number): number {
  const ratio = Math.min(1, weeklyMinutes / targetMinutes);
  return Math.round(ratio * 100);
}

export const Zone2CardioLongevity: React.FC<Zone2CardioLongevityProps> = ({
  activeLogs = [],
  bmr = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const weeklyMinutes = activeLogs
    .filter((log) => log.exerciseName.toLowerCase().includes('zone') || log.exerciseName.toLowerCase().includes('cardio'))
    .reduce((acc, log) => acc + log.sets.reduce((s, set) => s + (Number(set.reps) || 0), 0) * 0.5, 0);

  const targetMinutes = 180;
  const targetHRLow = Math.round((220 - 30) * 0.6);
  const targetHRHigh = Math.round((220 - 30) * 0.7);

  const vo2Max = estimateVO2Max(weeklyMinutes, bmr);
  const metabolicScore = estimateMetabolicScore(weeklyMinutes, targetMinutes);
  const pct = Math.min(100, (weeklyMinutes / targetMinutes) * 100);

  return (
    <div className="bg-white dark:bg-[#181B20] rounded-xl p-3 shadow-2xs border border-[rgba(0,0,0,0.08)] dark:border-white/10 relative text-[#000000] dark:text-[#FFFFFF] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-mono font-bold text-[#000000] dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>Zone 2 Cardio & Longevity</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold bg-[#DC2626]/10 text-[#DC2626] px-1.5 py-0.5 rounded-full border border-[#DC2626]/30 uppercase">
            {activeLogs.length > 0 ? 'Live Data' : 'No Cardio Logged'}
          </span>
          <button onClick={() => setCollapsed(!collapsed)} className="w-6 h-6 rounded-lg bg-[#F2F2F7] dark:bg-white/10 flex items-center justify-center cursor-pointer active:scale-90 transition-all">
            <ChevronDown className={`w-3.5 h-3.5 text-[#5A5F5D] dark:text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white dark:bg-[#22262B] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-2xl p-2 flex flex-col justify-between shadow-2xs">
              <div className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider mb-1">
                Zone 2 HR Range
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-[#7A9382]">
                {targetHRLow} - {targetHRHigh} <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400">BPM</span>
              </div>
              <div className="text-[8.5px] font-mono text-[#5A5F5D] dark:text-gray-400 mt-1">
                Mitochondrial Efficiency Target
              </div>
            </div>

            <div className="bg-white dark:bg-[#22262B] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-2xl p-2 flex flex-col justify-between shadow-2xs">
              <div className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-wider mb-1">
                Weekly Volume
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-[#000000] dark:text-white">
                {weeklyMinutes} / {targetMinutes} <span className="text-[10px] text-[#5A5F5D] dark:text-gray-400">min</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10 mt-1 overflow-hidden">
                <div
                  className="h-full bg-[#7A9382] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[8.5px] font-mono text-[#7A9382] font-bold mt-1">
                {Math.round(pct)}% Goal Reached
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#5A5F5D] dark:text-gray-400">
              <span>VO2 Max Est:</span>
              <span className="text-[#000000] dark:text-white font-black">{vo2Max.toFixed(1)} mL/kg/min</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#5A5F5D] dark:text-gray-400">
              <span>Metabolic Score:</span>
              <span className="text-[#7A9382] font-black">{metabolicScore} / 100</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
