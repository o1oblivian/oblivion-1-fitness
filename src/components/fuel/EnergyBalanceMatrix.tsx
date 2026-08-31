import React from 'react';
import { Zap } from 'lucide-react';

interface EnergyBalanceMatrixProps {
  goalCals: number;
  totalIntakeCals: number;
  trainingBurn: number;
  bmr: number;
}

export const EnergyBalanceMatrix: React.FC<EnergyBalanceMatrixProps> = ({
  goalCals,
  totalIntakeCals,
  trainingBurn,
  bmr,
}) => {
  const totalDailyExpenditure = bmr + trainingBurn;
  const remainingCals = goalCals - totalIntakeCals + trainingBurn;

  // Determine metabolic balance status label
  const netCals = totalIntakeCals - totalDailyExpenditure;
  const balanceLabel =
    Math.abs(netCals) <= 150
      ? 'BALANCED'
      : netCals < -150
      ? 'DEFICIT MODE'
      : 'SURPLUS MODE';

  return (
    <div className="bg-[#FDFCFB] dark:bg-[#181B20] rounded-3xl p-4 sm:p-5 shadow-2xs border border-[rgba(0,0,0,0.08)] dark:border-white/10 relative text-[#1A1E1D] dark:text-[#F7F5F0] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-mono font-bold text-[#1A1E1D] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Energy Balance & BMR Matrix</span>
          </h3>
          <span className="text-[9px] font-mono font-bold bg-[#34A853]/15 text-[#34A853] px-2.5 py-0.5 rounded-full border border-[#34A853]/30 uppercase">
            {balanceLabel}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center items-center mb-3">
          <div className="flex flex-col items-center bg-white dark:bg-[#22262B] p-2.5 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 shadow-2xs">
            <div className="text-lg sm:text-xl font-black font-mono text-[#1A1E1D] dark:text-white">
              {goalCals}
            </div>
            <div className="text-[8.5px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-tight mt-0.5">
              Target
            </div>
          </div>

          <div className="flex flex-col items-center bg-white dark:bg-[#22262B] p-2.5 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 shadow-2xs">
            <div className="text-lg sm:text-xl font-black font-mono text-[#1A1E1D] dark:text-white">
              {totalIntakeCals}
            </div>
            <div className="text-[8.5px] font-mono font-bold text-[#5A5F5D] dark:text-gray-400 uppercase tracking-tight mt-0.5">
              Intake
            </div>
          </div>

          <div className="flex flex-col items-center bg-white dark:bg-[#22262B] p-2.5 rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 shadow-2xs">
            <div className="text-lg sm:text-xl font-black font-mono text-[#EA4335]">
              {trainingBurn}
            </div>
            <div className="text-[8.5px] font-mono font-bold text-[#EA4335] uppercase tracking-tight mt-0.5">
              Burn
            </div>
          </div>

          <div className="flex flex-col items-center bg-[#34A853]/10 p-2.5 rounded-2xl border border-[#34A853]/30 shadow-2xs">
            <div className="text-lg sm:text-xl font-black font-mono text-[#34A853]">
              {remainingCals}
            </div>
            <div className="text-[8.5px] font-mono font-bold text-[#34A853] uppercase tracking-tight mt-0.5">
              Remain
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#5A5F5D] dark:text-gray-400 px-1 flex-wrap gap-2">
        <div>
          Base BMR: <span className="text-[#1A1E1D] dark:text-white font-black">{bmr} kcal</span>
        </div>
        <div>
          Exercise Burn: <span className="text-[#EA4335] font-black">{trainingBurn} kcal</span>
        </div>
        <div>
          Est. Spend: <span className="text-[#1A1E1D] dark:text-white font-black">{totalDailyExpenditure} kcal</span>
        </div>
      </div>
    </div>
  );
};
