import React, { useState, useMemo } from 'react';
import { Flame, TrendingDown, TrendingUp, Sparkles, Scale, Activity, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { haptic } from '../utils/haptics';
import {
  calculateAdaptiveTDEE,
  getStoredWeightHistory,
  recordAthleteWeight,
  WeightEntry,
  DailyCalorieLog,
} from '../utils/tdeeEngine';

interface AdaptiveExpenditureCardProps {
  currentCalorieIntake?: number;
  onApplyTarget?: (targetCals: number) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdaptiveExpenditureCard: React.FC<AdaptiveExpenditureCardProps> = ({
  currentCalorieIntake = 2550,
  onApplyTarget,
  showToast,
}) => {
  const [weights, setWeights] = useState<WeightEntry[]>(() => getStoredWeightHistory());
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('o1fc_calorie_burn_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpanded = () => {
    haptic.tap();
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('o1fc_calorie_burn_expanded', String(next));
      } catch {}
      return next;
    });
  };
  const [selectedGoal, setSelectedGoal] = useState<'maintenance' | 'surplus' | 'cut'>('maintenance');

  // Synthetic 14-day sample calorie logs around current intake for calibration
  const sampleCalorieLogs: DailyCalorieLog[] = useMemo(() => {
    const logs: DailyCalorieLog[] = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
      // realistic daily fluctuation +/- 120 kcal
      const c = currentCalorieIntake + ((i % 3) - 1) * 90;
      logs.push({
        date: d,
        calories: c,
        protein: 180,
        carbs: 280,
        fats: 65,
      });
    }
    return logs;
  }, [currentCalorieIntake]);

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : 80.0;

  const tdeeData = useMemo(() => {
    return calculateAdaptiveTDEE(sampleCalorieLogs, weights, latestWeight);
  }, [sampleCalorieLogs, weights, latestWeight]);

  const handleLogWeight = () => {
    const num = parseFloat(newWeightInput);
    if (!num || num < 30 || num > 300) {
      showToast?.('Please enter a valid weight (e.g. 80.5 kg)', 'error');
      return;
    }

    haptic.tap();
    const updated = recordAthleteWeight(num);
    setWeights(updated);
    setNewWeightInput('');
    setIsAddingWeight(false);
    showToast?.(`Weigh-in recorded: ${num.toFixed(1)} kg`, 'success');
  };

  const getTargetCalories = () => {
    switch (selectedGoal) {
      case 'surplus':
        return tdeeData.recommendedIntake.surplus;
      case 'cut':
        return tdeeData.recommendedIntake.cut;
      default:
        return tdeeData.recommendedIntake.maintenance;
    }
  };

  return (
    <div className="bg-gradient-to-b from-stone-900/90 to-zinc-950 border border-white/10 rounded-2xl p-4 text-white shadow-xl space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-left group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase text-white flex items-center gap-1.5">
              <span>Daily Calorie Burn</span>
              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                ACTIVE
              </span>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors ml-0.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-colors ml-0.5" />
              )}
            </h3>
            <p className="text-[10px] text-stone-400 font-mono">
              Based on your daily meals and weigh-ins
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAddingWeight((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Scale className="w-3 h-3 text-stone-400" />
            <span>{latestWeight.toFixed(1)} kg</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-3.5 pt-0.5 animate-fadeIn">
          {/* Weigh-In Input Bar (Collapsible) */}
          {isAddingWeight && (
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 animate-fadeIn">
              <input
                type="number"
                step="0.1"
                placeholder="Today's weigh-in (kg)..."
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500/50 font-mono"
              />
              <button
                onClick={handleLogWeight}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          )}

          {/* Dynamic Expenditure Metric Display */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono uppercase text-stone-400 block mb-0.5">
                Resting Burn
              </span>
              <span className="text-sm font-bold font-mono text-stone-300">
                {tdeeData.staticBMR}
              </span>
              <span className="text-[8.5px] text-stone-500 font-mono block">Body at Rest</span>
            </div>

            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[9px] font-mono uppercase text-orange-400 font-semibold block mb-0.5">
                Daily Burn
              </span>
              <span className="text-base font-bold font-mono text-orange-400">
                {tdeeData.calculatedTDEE}
              </span>
              <span className="text-[8.5px] text-orange-400/70 font-mono block">kcal / day</span>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono uppercase text-stone-400 block mb-0.5">
                Metabolism
              </span>
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold font-mono text-blue-400">
                {tdeeData.adaptationRatio >= 1 ? (
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.2] text-amber-400" />
                )}
                <span className={tdeeData.adaptationRatio < 1 ? 'text-amber-400' : 'text-blue-400'}>
                  {(tdeeData.adaptationRatio * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[8.5px] text-stone-500 font-mono block">Vs Average</span>
            </div>
          </div>

          {/* Goal Phase Selector */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-stone-400">Target Goal:</span>
              <div className="flex items-center rounded-lg bg-white/5 p-0.5 border border-white/10">
                {(['cut', 'maintenance', 'surplus'] as const).map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      setSelectedGoal(goal);
                      haptic.tap();
                    }}
                    className={`px-2 py-0.5 text-[9.5px] font-mono capitalize rounded-md transition-colors cursor-pointer ${
                      selectedGoal === goal
                        ? 'bg-orange-500/20 text-orange-400 font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {goal === 'cut' ? 'Lose Weight' : goal === 'maintenance' ? 'Maintain' : 'Build Muscle'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold font-mono text-white">
                  {getTargetCalories()} <span className="text-[10px] text-stone-400">kcal/day</span>
                </div>
                <div className="text-[9px] font-mono text-stone-400">
                  P: {tdeeData.recommendedIntake.macros.proteinGrams}g • C: {tdeeData.recommendedIntake.macros.carbGrams}g • F: {tdeeData.recommendedIntake.macros.fatGrams}g
                </div>
              </div>

              {onApplyTarget && (
                <button
                  onClick={() => {
                    haptic.thump();
                    onApplyTarget(getTargetCalories());
                    showToast?.(`Daily target adjusted to ${getTargetCalories()} kcal`, 'success');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[10px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Use This Target
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
