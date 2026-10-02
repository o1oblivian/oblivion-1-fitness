import React, { useState } from 'react';
import { PieChart, Sliders } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { DailyEnergySplitTab } from './DailyEnergySplitTab';
import { DailyEnergyTargetsTab } from './DailyEnergyTargetsTab';
import { MifflinStJeorModal } from './MifflinStJeorModal';

export type DailyEnergyCardTab = 'Today' | 'Adjust Targets';

export interface DailyEnergyCardProps {
  remainingKcal?: number;
  eatenKcal?: number;
  burnedKcal?: number;
  dailyTargetKcal: number;
  proteinG: number;
  proteinTarget: number;
  carbsG: number;
  carbsTarget: number;
  fatsG: number;
  fatsTarget: number;
  weightKg?: number;
  activeTab?: DailyEnergyCardTab;
  defaultTab?: DailyEnergyCardTab;
  onViewChange?: (tab: DailyEnergyCardTab) => void;
  onUpdateWeight?: (newWeight: number) => void;
  onSaveWeight?: (newWeight: number) => void;
  onApplyTargets?: (
    kcal: number,
    protein: number,
    carbs: number,
    fats: number,
    weight?: number
  ) => void;
}

export const DailyEnergyCard: React.FC<DailyEnergyCardProps> = ({
  remainingKcal: propRemainingKcal,
  eatenKcal = 0,
  burnedKcal = 0,
  dailyTargetKcal = 0,
  proteinG = 0,
  proteinTarget = 0,
  carbsG = 0,
  carbsTarget = 0,
  fatsG = 0,
  fatsTarget = 0,
  weightKg = 78.5,
  activeTab: controlledActiveTab,
  defaultTab = 'Today',
  onViewChange,
  onUpdateWeight,
  onSaveWeight,
  onApplyTargets,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<DailyEnergyCardTab>(defaultTab);
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const [isMifflinOpen, setIsMifflinOpen] = useState<boolean>(false);

  // Target inputs for the Adjust Targets tab
  const [targetKcalInput, setTargetKcalInput] = useState<number>(dailyTargetKcal || 2200);
  const [targetProteinInput, setTargetProteinInput] = useState<number>(proteinTarget || 165);
  const [targetCarbsInput, setTargetCarbsInput] = useState<number>(carbsTarget || 250);
  const [targetFatsInput, setTargetFatsInput] = useState<number>(fatsTarget || 60);

  // Sync inputs if props update
  React.useEffect(() => {
    if (dailyTargetKcal > 0) setTargetKcalInput(dailyTargetKcal);
    if (proteinTarget > 0) setTargetProteinInput(proteinTarget);
    if (carbsTarget > 0) setTargetCarbsInput(carbsTarget);
    if (fatsTarget > 0) setTargetFatsInput(fatsTarget);
  }, [dailyTargetKcal, proteinTarget, carbsTarget, fatsTarget]);

  const consumedKcal = proteinG * 4 + carbsG * 4 + fatsG * 9;
  const remainingKcal =
    typeof propRemainingKcal === 'number'
      ? propRemainingKcal
      : dailyTargetKcal > 0
      ? Math.max(0, dailyTargetKcal + burnedKcal - consumedKcal)
      : burnedKcal;

  const handleTabClick = (tab: DailyEnergyCardTab) => {
    tactileEngine.triggerSelectionBuzz();
    if (onViewChange) {
      onViewChange(tab);
    }
    setInternalActiveTab(tab);
  };

  const handleSaveTargets = () => {
    tactileEngine.triggerImpactPulse();
    onApplyTargets?.(targetKcalInput, targetProteinInput, targetCarbsInput, targetFatsInput, weightKg);
    handleTabClick('Today');
  };

  return (
    <div
      id="daily-energy-dashboard"
      className="bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-3xl p-4 sm:p-5 space-y-4 transition-colors shadow-sm dark:shadow-xl select-none"
    >
      {/* Segmented 2-Tab Native Controller (Top of Card) */}
      <div className="flex items-center bg-neutral-100 dark:bg-[#18181b] p-1 rounded-2xl border border-neutral-200/90 dark:border-neutral-800/80 text-xs font-semibold text-neutral-400 shadow-inner">
        <button
          type="button"
          onClick={() => handleTabClick('Today')}
          className={`relative flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'Today'
              ? 'bg-[#C4121A] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Today</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('Adjust Targets')}
          className={`relative flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'Adjust Targets'
              ? 'bg-[#C4121A] text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Adjust Targets</span>
        </button>
      </div>

      {/* Active Tab Views */}
      {activeTab === 'Today' && (
        <DailyEnergySplitTab
          proteinG={proteinG}
          proteinTarget={proteinTarget}
          carbsG={carbsG}
          carbsTarget={carbsTarget}
          fatsG={fatsG}
          fatsTarget={fatsTarget}
          dailyTargetKcal={dailyTargetKcal}
          eatenKcal={consumedKcal}
          burnedKcal={burnedKcal}
        />
      )}

      {activeTab === 'Adjust Targets' && (
        <DailyEnergyTargetsTab
          targetKcalInput={targetKcalInput}
          setTargetKcalInput={setTargetKcalInput}
          targetProteinInput={targetProteinInput}
          setTargetProteinInput={setTargetProteinInput}
          targetCarbsInput={targetCarbsInput}
          setTargetCarbsInput={setTargetCarbsInput}
          targetFatsInput={targetFatsInput}
          setTargetFatsInput={setTargetFatsInput}
          bmr={weightKg ? Math.round(10 * weightKg + 6.25 * 180 - 5 * 28 + 5) : 2000}
          onOpenMifflinModal={() => setIsMifflinOpen(true)}
          onSaveTargets={handleSaveTargets}
        />
      )}

      {/* Advanced Engine: Mifflin-St Jeor & Lean Mass Calculator Modal */}
      <MifflinStJeorModal
        isOpen={isMifflinOpen}
        currentWeightKg={weightKg || 78.5}
        onClose={() => setIsMifflinOpen(false)}
        onApplyTargets={(cal, p, c, f, weight) => {
          setTargetKcalInput(cal);
          setTargetProteinInput(p);
          setTargetCarbsInput(c);
          setTargetFatsInput(f);
          onApplyTargets?.(cal, p, c, f, weight);
          setIsMifflinOpen(false);
          handleTabClick('Today');
        }}
      />
    </div>
  );
};

export default DailyEnergyCard;
