import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Clock,
  Compass,
  Flame,
  Dumbbell,
  Activity,
  Zap,
  ChevronDown,
  BatteryCharging,
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
import { IntelInsightsModal } from './IntelInsightsModal';
import { useConsultationStore } from '../../induction/useConsultationStore';
import type { Goal } from '../../induction/consultationTypes';

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

/** Shown before "More": enough for most sessions without a wall of choices. */
const CORE_FOCUS: readonly string[] = [
  'Full Body',
  'Upper Body',
  'Lower Body',
  'Push (Chest/Delts)',
  'Pull (Back/Bis)',
  'Abs & Core',
];

const PILL_OFF = 'bg-o1-canvas text-o1-pure border border-white/[0.14] hover:bg-white/[0.06]';
const PILL_ON = 'bg-o1-cream text-o1-surface border border-o1-cream';
const PILL_SUB_OFF = 'text-o1-muted';
const PILL_SUB_ON = 'text-o1-surface/60';

const GOAL_CARDS: {
  key: TrainingGoal;
  label: string;
  sub: string;
  icon: typeof Flame;
  color: string;
}[] = [
  {
    key: 'burn',
    label: 'Burn calories',
    sub: 'Sweat and fitness',
    icon: Flame,
    color: 'text-o1-crimson',
  },
  {
    key: 'muscle',
    label: 'Build muscle',
    sub: 'Size and strength',
    icon: Dumbbell,
    color: 'text-o1-amber-deep',
  },
  {
    key: 'reset',
    label: 'Reset and move',
    sub: 'Easy mobility and recovery',
    icon: Activity,
    color: 'text-o1-teal',
  },
  {
    key: 'athletic',
    label: 'Athletic',
    sub: 'Speed and power',
    icon: Zap,
    color: 'text-o1-sky',
  },
];

const GOAL_MODE: Record<Goal, TrainingGoal> = {
  muscle: 'muscle',
  strength: 'muscle',
  fat_loss: 'burn',
  fitness: 'burn',
  sport: 'athletic',
  mobility: 'reset',
};

export const IntelCoachAccordionPanel: React.FC<IntelCoachAccordionPanelProps> = ({
  onClose,
  onDeployProtocol,
}) => {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('STEADY');
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>(() => {
    const { goal } = useConsultationStore.getState();
    return goal ? GOAL_MODE[goal] : 'muscle';
  });
  const [movementFocus, setMovementFocus] = useState<string>('Full Body');
  const [showAllFocus, setShowAllFocus] = useState(false);
  const focusOptions = showAllFocus
    ? [...CORE_FOCUS, ...MOVEMENT_FOCUS_OPTIONS.filter((f) => !CORE_FOCUS.includes(f))]
    : CORE_FOCUS.includes(movementFocus)
      ? CORE_FOCUS
      : [...CORE_FOCUS, movementFocus];
  const [selectedDuration, setSelectedDuration] = useState<number>(
    () => useConsultationStore.getState().sessionMinutes || 45,
  );
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [prescription, setPrescription] = useState<ExerciseItem[] | null>(null);
  const [builtFor, setBuiltFor] = useState('');
  const [isLoadReportOpen, setIsLoadReportOpen] = useState(false);

  const { deployProtocol, setActiveSession, setMode } = useWorkoutStore();
  const athleteWeightKg = getAthleteWeightKg();

  const estCalories = useMemo(() => {
    return computePrescriptionCalories(
      trainingGoal,
      selectedDuration,
      energyLevel,
      athleteWeightKg,
      movementFocus,
    );
  }, [trainingGoal, selectedDuration, energyLevel, athleteWeightKg, movementFocus]);

  // The built workout only counts while the options it was built from are unchanged.
  const optionsKey = `${trainingGoal}|${energyLevel}|${selectedDuration}|${movementFocus}`;
  const isFresh = prescription !== null && builtFor === optionsKey;

  const handleEditOptions = () => {
    tactileEngine.triggerSelectionBuzz();
    setPrescription(null);
    setBuiltFor('');
  };

  const handleDesignSession = () => {
    tactileEngine.triggerSelectionBuzz();
    const generated = generateIntelPrescription(
      trainingGoal,
      energyLevel,
      selectedDuration,
      movementFocus,
    );
    tactileEngine.playPRCelebration();
    setPrescription(generated);
    setBuiltFor(optionsKey);
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
          <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-amber-deep">
            <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-num text-xs font-medium tracking-wider text-white leading-tight">
              Build workout
            </h3>
            <p className="text-o1-label text-o1-muted leading-tight mt-0.5">
              Made for how you feel today
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsLoadReportOpen(true);
          }}
          className="min-h-[44px] px-3 rounded-full bg-o1-well border border-white/[0.1] hover:border-white/[0.2] text-o1-label font-num font-medium text-white tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <Activity className="w-3.5 h-3.5 text-o1-amber-deep" />
          Today's report
        </button>
      </div>

      {/* 1. ENERGY CHECK-IN */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-o1-label font-medium text-o1-stone tracking-wider font-num">
            How do you feel today?
          </span>
          <span className="text-o1-label font-num font-medium text-o1-muted">
            {energyLevel === 'LOW'
              ? 'Take it easy'
              : energyLevel === 'PRIME'
                ? 'Go hard'
                : 'Normal session'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              {
                key: 'LOW',
                label: 'Tired',
                sub: 'Take it easy',
                icon: Droplets,
                color: 'text-o1-sky',
              },
              {
                key: 'STEADY',
                label: 'Okay',
                sub: 'Normal session',
                icon: Zap,
                color: 'text-o1-amber-deep',
              },
              {
                key: 'PRIME',
                label: 'Great',
                sub: 'Go hard',
                icon: BatteryCharging,
                color: 'text-o1-emerald-deep',
              },
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
                className={`py-2 px-2.5 rounded-full text-center transition-all cursor-pointer active:scale-[0.98] ${isSelected ? PILL_ON : PILL_OFF}`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-xs font-medium font-num tracking-wider">{lvl.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${lvl.color}`} />
                </div>
                <span
                  className={`text-o1-label block truncate font-medium ${isSelected ? PILL_SUB_ON : PILL_SUB_OFF}`}
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
        <span className="text-o1-label font-medium text-o1-stone tracking-wider font-num">
          What do you want from it?
        </span>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_CARDS.map(({ key, label, sub, icon: Icon, color }) => {
            const isSelected = trainingGoal === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setTrainingGoal(key);
                }}
                className={`px-4 py-2 rounded-full text-left transition-all cursor-pointer active:scale-[0.98] ${isSelected ? PILL_ON : PILL_OFF}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-medium truncate">{label}</span>
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                </div>
                <p className={`text-o1-label truncate ${isSelected ? PILL_SUB_ON : PILL_SUB_OFF}`}>
                  {sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. AVAILABLE DURATION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-o1-label font-medium text-o1-stone tracking-wider font-num">
            How long have you got?
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsDurationModalOpen(true);
          }}
          className={`w-full px-4 py-2.5 rounded-full flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${PILL_OFF}`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-o1-muted" />
            <span className="text-xs font-medium">
              {selectedDuration} minutes · {getDurationSubLabel(selectedDuration)}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-o1-muted" />
        </button>
      </div>

      {/* 4. MOVEMENT FOCUS */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-o1-muted" />
          <span className="text-o1-label font-medium text-o1-stone tracking-wider font-num">
            What to train
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {focusOptions.map((foc) => {
            const isSelected = movementFocus === foc;
            return (
              <button
                key={foc}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setMovementFocus(foc);
                }}
                className={`min-h-[44px] px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.97] ${isSelected ? PILL_ON : PILL_OFF}`}
              >
                {foc}
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={showAllFocus}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowAllFocus((v) => !v);
            }}
            className="min-h-[44px] px-3.5 rounded-full text-xs font-medium text-o1-muted hover:text-o1-text border border-dashed border-white/[0.18] transition-colors cursor-pointer"
          >
            {showAllFocus ? 'Fewer' : 'More'}
          </button>
        </div>
      </div>

      {/* Stays in view above the dock while the options scroll */}
      <div className="sticky bottom-0 z-10 -mx-2.5 px-2.5 pt-2 pb-1 bg-o1-card flex items-center justify-between gap-3 border-t border-white/[0.05]">
        {isFresh ? (
          <>
            <button
              type="button"
              onClick={handleEditOptions}
              className="min-h-[44px] px-2 text-o1-label font-num font-medium tracking-wider text-o1-muted hover:text-o1-text underline decoration-white/25 underline-offset-2 cursor-pointer shrink-0"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleLoadPrescription}
              className="min-h-[44px] flex-1 px-5 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white active:scale-[0.98] font-num text-xs font-medium tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Load into active log</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-xs font-num font-medium text-o1-stone">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-o1-muted" />
                {selectedDuration}m
              </span>
              <span className="flex items-center gap-1 text-o1-crimson">
                <Flame className="w-3.5 h-3.5 text-o1-crimson" />~{estCalories} kcal
              </span>
            </div>
            <button
              type="button"
              onClick={handleDesignSession}
              className="min-h-[44px] px-5 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white active:scale-95 font-num text-xs font-medium tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Create workout</span>
            </button>
          </>
        )}
      </div>

      {/* Generated Prescription from Live EXERCISE_DATABASE */}
      {prescription && (
        <IntelPrescriptionCard
          prescription={prescription}
          estCalories={estCalories}
          outdated={!isFresh}
        />
      )}

      {/* Duration Bottom Sheet */}
      <DurationSelectModal
        isOpen={isDurationModalOpen}
        selectedMinutes={selectedDuration}
        onSelect={(min) => setSelectedDuration(min)}
        onClose={() => setIsDurationModalOpen(false)}
      />

      <IntelInsightsModal
        isOpen={isLoadReportOpen}
        onClose={() => setIsLoadReportOpen(false)}
        initialTab="today"
      />
    </div>
  );
};
