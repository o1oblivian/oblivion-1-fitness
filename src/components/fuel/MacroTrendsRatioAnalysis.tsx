import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MacroTrendsRatioAnalysisProps {
  totalP: number;
  totalC: number;
  totalF: number;
  goalP: number;
  goalC: number;
  goalF: number;
  trendUnit: 'grams' | 'calories';
  setTrendUnit: (unit: 'grams' | 'calories') => void;
}

export const MacroTrendsRatioAnalysis: React.FC<MacroTrendsRatioAnalysisProps> = ({
  totalP,
  totalC,
  totalF,
  goalP,
  goalC,
  goalF,
  trendUnit,
  setTrendUnit,
}) => {
  const totalMacroGrams = totalP + totalC + totalF;
  const goalMacroGrams = goalP + goalC + goalF;

  const totalMacroCals = totalP * 4 + totalC * 4 + totalF * 9;
  const goalMacroCals = goalP * 4 + goalC * 4 + goalF * 9;

  const currentPieData =
    totalMacroGrams === 0
      ? [
          { name: 'Protein (0g)', value: 1, color: '#f43f5e33', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Carbs (0g)', value: 1, color: '#06b6d433', unit: 'g', calories: 0, isPlaceholder: true },
          { name: 'Fat (0g)', value: 1, color: '#f59e0b33', unit: 'g', calories: 0, isPlaceholder: true },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: totalP, color: '#f43f5e', unit: 'g', calories: totalP * 4, goal: goalP },
          { name: 'Carbs', value: totalC, color: '#06b6d4', unit: 'g', calories: totalC * 4, goal: goalC },
          { name: 'Fat', value: totalF, color: '#f59e0b', unit: 'g', calories: totalF * 9, goal: goalF },
        ]
      : [
          { name: 'Protein', value: totalP * 4, color: '#f43f5e', unit: 'kcal', calories: totalP * 4, goal: goalP * 4 },
          { name: 'Carbs', value: totalC * 4, color: '#06b6d4', unit: 'kcal', calories: totalC * 4, goal: goalC * 4 },
          { name: 'Fat', value: totalF * 9, color: '#f59e0b', unit: 'kcal', calories: totalF * 9, goal: goalF * 9 },
        ];

  const targetPieData =
    goalMacroGrams === 0
      ? [
          { name: 'Protein Goal', value: 1, color: '#f43f5e33', unit: 'g', calories: 0 },
          { name: 'Carbs Goal', value: 1, color: '#06b6d433', unit: 'g', calories: 0 },
          { name: 'Fat Goal', value: 1, color: '#f59e0b33', unit: 'g', calories: 0 },
        ]
      : trendUnit === 'grams'
      ? [
          { name: 'Protein', value: goalP, color: '#f43f5e', unit: 'g', calories: goalP * 4 },
          { name: 'Carbs', value: goalC, color: '#06b6d4', unit: 'g', calories: goalC * 4 },
          { name: 'Fat', value: goalF, color: '#f59e0b', unit: 'g', calories: goalF * 9 },
        ]
      : [
          { name: 'Protein', value: goalP * 4, color: '#f43f5e', unit: 'kcal', calories: goalP * 4 },
          { name: 'Carbs', value: goalC * 4, color: '#06b6d4', unit: 'kcal', calories: goalC * 4 },
          { name: 'Fat', value: goalF * 9, color: '#f59e0b', unit: 'kcal', calories: goalF * 9 },
        ];

  return (
    <div className="bg-[#FDFCFB] rounded-2xl p-3.5 shadow-2xs border border-[rgba(0,0,0,0.08)] space-y-2.5 text-[#1A1E1D]">
      <div className="flex flex-row justify-between items-center border-b border-[rgba(0,0,0,0.08)] pb-2 gap-2">
        <div>
          <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#1A1E1D] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Macro Trends & Ratio Analysis</span>
          </h3>
          <p className="text-[10px] text-[#5A5F5D] font-mono">
            Intake ratio vs target split
          </p>
        </div>
        <div className="flex bg-[#F7F5F0] p-0.5 rounded-xl border border-[rgba(0,0,0,0.08)] font-mono">
          <button
            onClick={() => setTrendUnit('grams')}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              trendUnit === 'grams'
                ? 'bg-[#1A1E1D] text-white shadow-2xs'
                : 'text-[#5A5F5D] hover:text-[#1A1E1D]'
            }`}
          >
            Grams
          </button>
          <button
            onClick={() => setTrendUnit('calories')}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              trendUnit === 'calories'
                ? 'bg-[#1A1E1D] text-white shadow-2xs'
                : 'text-[#5A5F5D] hover:text-[#1A1E1D]'
            }`}
          >
            kcal
          </button>
        </div>
      </div>

      {/* Side-by-Side Compact Donut Charts */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 items-center">
        {/* Current Intake Pie */}
        <div className="bg-white rounded-xl p-2 border border-[rgba(0,0,0,0.08)] flex flex-col items-center">
          <div className="text-[9px] font-mono font-bold text-[#1A1E1D] uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /> Current
          </div>
          <div className="w-full h-22 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
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
                          <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl text-[10px] font-mono text-[#5A5F5D] shadow-2xs">
                            No meals logged
                          </div>
                        );
                      }
                      const totalSum = currentPieData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                      const pct = Math.round((d.value / totalSum) * 100);
                      return (
                        <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                          <div className="font-bold" style={{ color: d.color }}>
                            {d.name}
                          </div>
                          <div className="text-[#1A1E1D] mt-0.5">
                            {d.value} {d.unit} ({pct}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-black font-mono text-[#1A1E1D]">
                {trendUnit === 'grams' ? `${totalMacroGrams}g` : `${totalMacroCals}`}
              </span>
              <span className="text-[7.5px] font-mono text-[#5A5F5D] uppercase">
                {trendUnit === 'grams' ? 'Intake' : 'kcal'}
              </span>
            </div>
          </div>
        </div>

        {/* Target Goal Pie */}
        <div className="bg-white rounded-xl p-2 border border-[rgba(0,0,0,0.08)] flex flex-col items-center">
          <div className="text-[9px] font-mono font-bold text-[#1A1E1D] uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A9382]" /> Target
          </div>
          <div className="w-full h-22 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={targetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
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
                        <div className="bg-white border border-[rgba(0,0,0,0.08)] p-1.5 rounded-xl shadow-2xs text-[10px] font-mono">
                          <div className="font-bold" style={{ color: d.color }}>
                            {d.name}
                          </div>
                          <div className="text-[#1A1E1D] mt-0.5">
                            Target: {d.value} {d.unit} ({pct}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-black font-mono text-[#1A1E1D]">
                {trendUnit === 'grams' ? `${goalMacroGrams}g` : `${goalMacroCals}`}
              </span>
              <span className="text-[7.5px] font-mono text-[#5A5F5D] uppercase">
                {trendUnit === 'grams' ? 'Target' : 'kcal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Compact Badges */}
      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[rgba(0,0,0,0.08)] text-center font-mono">
        <div className="bg-white p-1.5 rounded-xl border border-[rgba(0,0,0,0.08)] flex flex-col items-center">
          <span className="text-[9px] font-bold text-[#DC2626] uppercase">Protein</span>
          <span className="text-xs font-bold text-[#1A1E1D] mt-0.5">
            {totalP}g / {goalP}g
          </span>
        </div>

        <div className="bg-white p-1.5 rounded-xl border border-[rgba(0,0,0,0.08)] flex flex-col items-center">
          <span className="text-[9px] font-bold text-[#3A3F3D] uppercase">Carbs</span>
          <span className="text-xs font-bold text-[#1A1E1D] mt-0.5">
            {totalC}g / {goalC}g
          </span>
        </div>

        <div className="bg-white p-1.5 rounded-xl border border-[rgba(0,0,0,0.08)] flex flex-col items-center">
          <span className="text-[9px] font-bold text-[#7A9382] uppercase">Fat</span>
          <span className="text-xs font-bold text-[#1A1E1D] mt-0.5">
            {totalF}g / {goalF}g
          </span>
        </div>
      </div>
    </div>
  );
};
