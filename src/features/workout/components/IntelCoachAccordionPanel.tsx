import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Clock,
  Compass,
  Flame,
  Dumbbell,
  Activity,
  Zap,
  Check,
  ChevronDown,
  BatteryCharging,
  Gauge,
  Droplets,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem } from '../../../types';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { DurationSelectModal } from './DurationSelectModal';
import {
  EnergyLevel,
  TrainingGoal,
  computePrescriptionCalories,
  generateIntelPrescription,
} from '../utils/intelPrescriptionGenerator';
import { getAthleteWeightKg } from '../../../utils/physiologyEngine';
import { IntelPrescriptionCard } from './IntelPrescriptionCard';

interface IntelCoachAccordionPanelProps {
  onClose: () => void;
  onDeployProtocol: (exercises: ExerciseItem[]) => void;
}

const MOVEMENT_FOCUS_OPTIONS = [
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Chest',
  'Back & Lats',
  'Traps & Upper Back',
  'Shoulders & Delts',
  'Biceps',
  'Triceps',
  'Arms & Shoulders',
  'Forearms & Grip',
  'Quads',
  'Hamstrings',
  'Glute Power',
  'Hips & Adductors',
  'Calves',
  'Abs & Core',
  'Push (Chest/Delts)',
  'Pull (Back/Bis)',
  'Legs & Calves',
  'Olympic & Power',
] as const;

export const IntelCoachAccordionPanel: React.FC<IntelCoachAccordionPanelProps> = ({
  onClose,
  onDeployProtocol,
}) => {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('STEADY');
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>('muscle');
  const [movementFocus, setMovementFocus] = useState<string>('Full Body');
  const [selectedDuration, setSelectedDuration] = useState<number>(45);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [prescription, setPrescription] = useState<ExerciseItem[] | null>(null);
  const [isDesigning, setIsDesigning] = useState(false);

  const { deployProtocol, setActiveSession, setMode } = useWorkoutStore();
  const athleteWeightKg = getAthleteWeightKg();

  const estCalories = useMemo(() => {
    return computePrescriptionCalories(
      trainingGoal,
      selectedDuration,
      energyLevel,
      athleteWeightKg,
      movementFocus
    );
  }, [trainingGoal, selectedDuration, energyLevel, athleteWeightKg, movementFocus]);

  const handleDesignSession = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsDesigning(true);
    setTimeout(() => {
      // Real live generation from EXERCISE_DATABASE
      const generated = generateIntelPrescription(
        trainingGoal,
        energyLevel,
        selectedDuration,
        movementFocus
      );
      tactileEngine.playPRCelebration();
      setPrescription(generated);
      setIsDesigning(false);
    }, 280);
  };

  const handleLoadPrescription = () => {
    if (!prescription || prescription.length === 0) return;
    tactileEngine.playPRCelebration();
    deployProtocol(prescription);
    setActiveSession(true);
    setMode('Lift');
    onDeployProtocol(prescription);
    onClose();
  };

  const getDurationSubLabel = (mins: number) => {
    switch (mins) {
      case 5:
        return 'Express';
      case 10:
        return 'Quick';
      case 15:
        return 'Primer';
      case 20:
        return 'Solid';
      case 30:
        return 'Power';
      case 45:
        return 'Deep';
      case 60:
        return 'Total';
      case 75:
        return 'Volume';
      case 90:
        return 'Marathon';
      default:
        return `${mins}m Session`;
    }
  };

  return (
    <div
      id="intel-session-engine-card"
      className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 shadow-xl space-y-2.5 animate-in fade-in duration-200 select-none text-white"
    >
      {/* Header matching Screenshot 1 & 3 */}
      <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-300">
            <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold tracking-wider text-white leading-tight">
              Intel Session Engine
            </h3>
            <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
              Autoregulated training prescription
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-o1-crimson bg-o1-crimson/10 border border-o1-crimson/30 px-2.5 py-1 rounded-xl tracking-wider">
          Intel Adaptive
        </span>
      </div>

      {/* 1. ENERGY CHECK-IN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-300 tracking-wider font-mono">
            1. Energy CHECK-IN
          </span>
          <span className="text-[11px] font-mono font-medium text-neutral-400">
            {energyLevel === 'LOW'
              ? 'Reset & Ease'
              : energyLevel === 'PRIME'
              ? 'Full Attack'
              : 'Standard Baseline'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'LOW', label: 'LOW', sub: 'Reset & Ease', icon: Droplets, color: 'text-sky-500' },
              { key: 'STEADY', label: 'STEADY', sub: 'Solid Work', icon: Zap, color: 'text-amber-500' },
              { key: 'PRIME', label: 'PRIME', sub: 'Full Attack', icon: BatteryCharging, color: 'text-emerald-500' },
            ] as const
          ).map((lvl) => {
            const isSelected = energyLevel === lvl.key;
            const Icon = lvl.icon;
            return (
              <button
                key={lvl.key}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setEnergyLevel(lvl.key);
                }}
                className={`py-2 px-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-950 border-transparent shadow-md'
                    : 'bg-o1-well text-neutral-300 border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold font-mono tracking-wider">
                    {lvl.label}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isSelected
                        ? lvl.color
                        : 'text-neutral-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] block truncate font-medium ${
                    isSelected
                      ? 'text-neutral-600'
                      : 'text-neutral-400'
                  }`}
                >
                  {lvl.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TRAINING GOAL MODE */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-neutral-300 tracking-wider font-mono">
          2. training goal mode
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* Card 1: Burn kcal */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setTrainingGoal('burn');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
              trainingGoal === 'burn'
                ? 'bg-white text-neutral-950 border-transparent shadow-md'
                : 'bg-o1-well text-neutral-300 border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Burn kcal</span>
              <Flame className="w-4 h-4 text-o1-crimson" />
            </div>
            <p
              className={`text-[10px] ${
                trainingGoal === 'burn'
                  ? 'text-neutral-600 font-medium'
                  : 'text-neutral-400'
              }`}
            >
              Metabolic Torch
            </p>
          </button>

          {/* Card 2: Build Muscle (Selected in Screenshot) */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setTrainingGoal('muscle');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
              trainingGoal === 'muscle'
                ? 'bg-white text-neutral-950 border-transparent shadow-md'
                : 'bg-o1-well text-neutral-300 border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Build Muscle</span>
              </div>
              <div className="flex items-center gap-1">
                <Dumbbell className="w-4 h-4 text-o1-crimson" />
                {trainingGoal === 'muscle' && (
                  <Check className="w-3.5 h-3.5 text-o1-crimson stroke-[3]" />
                )}
              </div>
            </div>
            <p
              className={`text-[10px] ${
                trainingGoal === 'muscle'
                  ? 'text-neutral-600 font-medium'
                  : 'text-neutral-400'
              }`}
            >
              Hypertrophy
            </p>
          </button>

          {/* Card 3: Reset & Move */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setTrainingGoal('reset');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
              trainingGoal === 'reset'
                ? 'bg-white text-neutral-950 border-transparent shadow-md'
                : 'bg-o1-well text-neutral-300 border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Reset &amp; Move</span>
              <Activity className="w-4 h-4 text-sky-500" />
            </div>
            <p
              className={`text-[10px] ${
                trainingGoal === 'reset'
                  ? 'text-neutral-600 font-medium'
                  : 'text-neutral-400'
              }`}
            >
              Recovery &amp; Joint Flow
            </p>
          </button>

          {/* Card 4: Athletic Peak */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setTrainingGoal('athletic');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
              trainingGoal === 'athletic'
                ? 'bg-white text-neutral-950 border-transparent shadow-md'
                : 'bg-o1-well text-neutral-300 border-white/[0.07] hover:border-white/[0.14]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Athletic Peak</span>
              <Zap className="w-4 h-4 text-sky-500" />
            </div>
            <p
              className={`text-[10px] ${
                trainingGoal === 'athletic'
                  ? 'text-neutral-600 font-medium'
                  : 'text-neutral-400'
              }`}
            >
              Speed &amp; Explosiveness
            </p>
          </button>
        </div>
      </div>

      {/* 3. AVAILABLE DURATION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-300 tracking-wider font-mono">
            3. Available Duration
          </span>
          <span className="text-[11px] font-mono font-medium text-neutral-400">
            {selectedDuration} Minutes Selected
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsDurationModalOpen(true);
          }}
          className="w-full p-3.5 rounded-2xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] flex items-center justify-between transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-white">
              {selectedDuration} Minutes — {selectedDuration}m {getDurationSubLabel(selectedDuration)}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* 4. MOVEMENT FOCUS */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-bold text-neutral-300 tracking-wider font-mono">
            4. Movement Focus
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOVEMENT_FOCUS_OPTIONS.map((foc) => {
            const isSelected = movementFocus === foc;
            return (
              <button
                key={foc}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setMovementFocus(foc);
                }}
                className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-950 font-bold shadow-xs border border-transparent'
                    : 'bg-o1-well text-neutral-300 border border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                {foc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Execution Footer matching Screenshot 1 & 3 */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-neutral-300">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            {selectedDuration}m
          </span>
          <span className="flex items-center gap-1 text-o1-crimson">
            <Flame className="w-3.5 h-3.5 text-o1-crimson" />
            ~{estCalories} kcal
          </span>
        </div>
        <button
          type="button"
          disabled={isDesigning}
          onClick={handleDesignSession}
          className="px-5 py-2.5 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 active:scale-95 font-mono text-xs font-bold tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-o1-crimson fill-o1-crimson" />
          <span>{isDesigning ? 'Synthesizing...' : 'Design Session'}</span>
        </button>
      </div>

      {/* Generated Prescription from Live EXERCISE_DATABASE */}
      {prescription && (
        <IntelPrescriptionCard
          prescription={prescription}
          estCalories={estCalories}
          onLoadPrescription={handleLoadPrescription}
        />
      )}

      {/* Duration Bottom Sheet */}
      <DurationSelectModal
        isOpen={isDurationModalOpen}
        selectedMinutes={selectedDuration}
        onSelect={(min) => setSelectedDuration(min)}
        onClose={() => setIsDurationModalOpen(false)}
      />
    </div>
  );
};

export default IntelCoachAccordionPanel;
