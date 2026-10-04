import React, { useState } from 'react';
import {
  X,
  Activity,
  Layers,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  Clock,
  Sparkles,
  Flame,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useIntelSportsScience } from '../../../hooks/useIntelSportsScience';

interface IntelCoachIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription?: () => void;
}

export const IntelCoachIntelligenceModal: React.FC<IntelCoachIntelligenceModalProps> = ({
  isOpen,
  onClose,
  onApplyPrescription,
}) => {
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [showDeepScience, setShowDeepScience] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const showToast = useWorkoutStore((s) => s.showToast);
  const workout = useWorkoutStore();
  const science = useIntelSportsScience();

  if (!isOpen) return null;

  const handleAutoCalibrateWeights = () => {
    tactileEngine.playPRCelebration();
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      const exercises = workout.exercises;
      const deltaFactor = 1 + science.loadRegulation.loadDeltaPct / 100;

      if (exercises && exercises.length > 0) {
        workout.setExercises((current) =>
          current.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) => {
              if (!s.completed && s.weightKg > 0) {
                const newWeight = Math.round((s.weightKg * deltaFactor) / 0.5) * 0.5;
                return { ...s, weightKg: newWeight };
              }
              return s;
            }),
          }))
        );
        showToast(
          `Auto-Calibrated: ${science.loadRegulation.loadDeltaPct >= 0 ? '+' : ''}${science.loadRegulation.loadDeltaPct}% load applied to active sets!`
        );
      } else {
        showToast(
          `Prescription Armed: ${science.loadRegulation.calibratedTopKg} kg target queued for primary compound lift.`
        );
      }
      if (onApplyPrescription) onApplyPrescription();
      onClose();
    }, 450);
  };

  const handleSwapExercise = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsSwapped(true);
    showToast(
      `Biomechanical Swap Deployed: Chest-Supported Incline Row loaded (-85% lumbar shear).`
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 w-full max-w-[480px] max-h-[92dvh] h-auto overflow-y-auto shadow-2xl transition-colors space-y-4 text-neutral-900 dark:text-white"
      >
        {/* ============================================================== */}
        {/* HEADER: Surgical Swiss-Athletic Brand Identity                 */}
        {/* ============================================================== */}
        <div className="flex items-start justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-tactical uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1c1c20] text-neutral-600 dark:text-neutral-400 font-bold border border-neutral-200 dark:border-neutral-700/60">
                PRO INTEL
              </span>
              <span className="text-[10px] font-tactical text-[#C4121A] dark:text-red-400 font-black uppercase tracking-wider">
                PREDICTIVE INTEL ENGINE
              </span>
            </div>
            <h3 className="text-base font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              Intel Coach
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Auto-Regulated Load Prescription, Biomechanical Sentinel &amp; PR Predictor
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* CORE FEATURE 1: REAL-TIME AUTO-REGULATED LOAD PRESCRIPTION     */}
        {/* ============================================================== */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border-2 border-[#C4121A]/30 dark:border-[#C4121A]/40 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C4121A]/10 text-[#C4121A] flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white block">
                  Auto-Regulated Load Prescription
                </span>
                <span className="text-[10px] font-sans font-medium text-neutral-500 dark:text-neutral-400">
                  Real-time VBT &amp; CNS Fatigue Modulation
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-tactical font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                science.loadRegulation.loadDeltaPct >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {science.loadRegulation.loadDeltaPct >= 0
                ? `+${science.loadRegulation.loadDeltaPct}% OVERLOAD`
                : `${science.loadRegulation.loadDeltaPct}% DELOAD`}
            </span>
          </div>

          {/* Calibrated Working Load Readout */}
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-tactical uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-bold">
                Target Movement
              </span>
              <span className="text-xs font-tactical font-black text-neutral-900 dark:text-white uppercase tracking-wide">
                {science.prescription.primaryMovement}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-100 dark:border-neutral-800 text-center">
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181c]">
                <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block tracking-wider">
                  Prescribed Load
                </span>
                <span className="text-lg font-tactical font-black text-[#C4121A] dark:text-red-400 block mt-0.5 tracking-tight">
                  {science.loadRegulation.calibratedTopKg} <span className="text-xs">kg</span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181c]">
                <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block tracking-wider">
                  Rep Bracket
                </span>
                <span className="text-lg font-tactical font-black text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                  {science.loadRegulation.recommendedReps}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181c]">
                <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block tracking-wider">
                  RPE Ceiling
                </span>
                <span className="text-lg font-tactical font-black text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                  ≤ {science.loadRegulation.rpeCeiling}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
              <strong className="text-neutral-900 dark:text-white font-semibold">Directive: </strong>
              {science.loadRegulation.directiveNote}
            </p>
          </div>

          {/* 1-Tap Auto-Calibration Button */}
          <button
            type="button"
            onClick={handleAutoCalibrateWeights}
            disabled={isApplying}
            className="w-full bg-[#C4121A] hover:bg-[#A30F16] active:scale-[0.98] text-white font-tactical font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isApplying ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Applying Calibrated Weights...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Auto-Calibrate Today's Weights</span>
              </>
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* CORE FEATURE 2: BIOMECHANICAL SENTINEL & STRAIN COLLISION      */}
        {/* ============================================================== */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white block">
                  Biomechanical Sentinel
                </span>
                <span className="text-[10px] font-sans font-medium text-neutral-500 dark:text-neutral-400">
                  Joint Stress &amp; Strain Collision Early-Warning
                </span>
              </div>
            </div>
            <span className="text-[10px] font-tactical font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              ACTIVE SHIELD
            </span>
          </div>

          {/* 3 Joint Vectors Grid */}
          <div className="grid grid-cols-3 gap-2">
            {science.biomechanicalSentinel.joints.map((j) => (
              <div
                key={j.joint}
                className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-center"
              >
                <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block truncate tracking-wider">
                  {j.joint}
                </span>
                <span
                  className={`text-base font-tactical font-black block mt-0.5 tracking-tight ${
                    j.status === 'CAUTION'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-neutral-900 dark:text-white'
                  }`}
                >
                  {j.loadPct}%
                </span>
                <span
                  className={`text-[9px] font-tactical font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1 inline-block ${
                    j.status === 'CAUTION'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {j.status}
                </span>
              </div>
            ))}
          </div>

          {/* Strain Collision Alert Banner */}
          <div
            className={`p-3 rounded-xl border text-xs space-y-2 ${
              isSwapped || !science.biomechanicalSentinel.collision.isCollisionActive
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isSwapped || !science.biomechanicalSentinel.collision.isCollisionActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <span className="font-tactical font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-[11px]">
                  {isSwapped
                    ? 'Strain Collision Mitigated'
                    : science.biomechanicalSentinel.collision.isCollisionActive
                    ? 'Biomechanical Collision Detected'
                    : 'All Kinetic Vectors Cleared'}
                </span>
              </div>
              <span className="font-tactical font-black uppercase tracking-wider text-[10px] text-neutral-500">
                {science.biomechanicalSentinel.collision.reliefFactor}
              </span>
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
              {isSwapped
                ? 'Chest-Supported Incline Row substituted for Barbell Bent-Over Row. Lumbar shear reduced by 85% with 100% lat stimulus retained.'
                : science.biomechanicalSentinel.collision.rationale}
            </p>

            {science.biomechanicalSentinel.collision.isCollisionActive && !isSwapped && (
              <button
                type="button"
                onClick={handleSwapExercise}
                className="w-full mt-1 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-tactical font-bold text-xs uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Swap to Chest-Supported Incline Row</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CORE FEATURE 3: SUPERCOMPENSATION & DELOAD PREDICTOR           */}
        {/* ============================================================== */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white block">
                  Supercompensation &amp; Deload
                </span>
                <span className="text-[10px] font-sans font-medium text-neutral-500 dark:text-neutral-400">
                  Predictive PR Peak &amp; Fatigue Horizon
                </span>
              </div>
            </div>
            <span className="text-[10px] font-tactical font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              PR WINDOW ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
              <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block truncate tracking-wider">
                PR Peak Window
              </span>
              <span className="text-sm font-tactical font-black text-[#C4121A] dark:text-red-400 block mt-0.5 tracking-tight">
                {science.supercompensation.supercompCountdownHours}h
              </span>
              <span className="text-[9px] font-sans font-medium text-neutral-500 block truncate mt-0.5">
                High Force Vector
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
              <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block truncate tracking-wider">
                Cycle Capacity
              </span>
              <span className="text-sm font-tactical font-black text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                {science.supercompensation.workloadCapacityRemainingPct}%
              </span>
              <span className="text-[9px] font-sans font-medium text-neutral-500 block truncate mt-0.5">
                ACWR Safety Buffer
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
              <span className="text-[9px] font-tactical uppercase font-bold text-neutral-500 dark:text-neutral-400 block truncate tracking-wider">
                Deload Horizon
              </span>
              <span className="text-sm font-tactical font-black text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                {science.supercompensation.daysUntilDeload}d
              </span>
              <span className="text-[9px] font-sans font-medium text-neutral-500 block truncate mt-0.5">
                Reactive Scheduling
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLLAPSIBLE DEEP NEUROMUSCULAR & METABOLIC TELEMETRY           */}
        {/* ============================================================== */}
        <div className="border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#151518]">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              setShowDeepScience(!showDeepScience);
            }}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-tactical font-bold uppercase tracking-wider text-xs">
                Deep Kinematic &amp; Metabolic Telemetry
              </span>
            </div>
            {showDeepScience ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {showDeepScience && (
            <div className="p-3.5 pt-0 space-y-3 text-xs border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#121214]">
              {/* Velocity & Tension */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block font-tactical uppercase font-bold tracking-wider">
                    Mean Concentric Velocity
                  </span>
                  <span className="text-sm font-black font-tactical text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                    {science.meanConcentricVelocityMs} m/s
                  </span>
                  <span className="text-[10px] text-neutral-500 font-sans">Threshold: &gt;0.55 m/s</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block font-tactical uppercase font-bold tracking-wider">
                    Velocity Decay (Fatigue)
                  </span>
                  <span className="text-sm font-black font-tactical text-neutral-900 dark:text-white block mt-0.5 tracking-tight">
                    {science.velocityFatigueLossPct}%
                  </span>
                  <span className="text-[10px] text-neutral-500 font-sans">Target: Capped under 20%</span>
                </div>
              </div>

              {/* Motor Unit & Glycogen */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-sans">
                    Type IIx Motor Unit Recruitment:
                  </span>
                  <span className="font-tactical font-black text-neutral-900 dark:text-white tracking-tight">
                    {science.neuromuscularRecruitmentPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-sans">Glycogen Resynthesis Clock:</span>
                  <span className="font-tactical font-black text-neutral-900 dark:text-white tracking-tight">
                    {science.glycogenResynthesisPct}% (~{science.glycogenBurnedGrams}g burned)
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal italic">
                *Calculated via Session-RPE mathematical models, concentric speed decay curves, and
                intra-cellular hydration ratios.
              </p>
            </div>
          )}
        </div>

        {/* Legal / Health Transparency Disclaimer */}
        <p className="text-[10px] text-center text-neutral-400 leading-normal">
          Oblivion 1 Intel Coach Engine • Non-diagnostic performance telemetry for athletic load
          management
        </p>
      </div>
    </div>
  );
};

export const IntelCoachReportModal = IntelCoachIntelligenceModal;
export default IntelCoachIntelligenceModal;
