import React, { useState, useEffect, useMemo } from 'react';
import { Flame, MapPin, Heart, Timer, Gauge, Activity, BarChart3, Orbit, Utensils } from 'lucide-react';
import { pedometer, type PedometerState } from '@/utils/pedometer';
import { getTodayCardioTotals, subscribeCardioUpdates } from '@/utils/cardioStorage';
import type { DailyMeals } from '../types';
import { BiometricModal, BiometricType } from './BiometricModal';
import { DialChronoGauge } from './dials/DialChronoGauge';
import { DialPulseRing } from './dials/DialPulseRing';
import { DialSplitColumn } from './dials/DialSplitColumn';
import { DialOrbital } from './dials/DialOrbital';
import { DialHorizon } from './dials/DialHorizon';
import { DialRadial } from './dials/DialRadial';
import { DialApex } from './dials/DialApex';

type DialMode = 'chrono' | 'pulse' | 'split' | 'orbital' | 'horizon' | 'radial' | 'apex';

interface WatchDialProps {
  weeklySchedule: Record<string, string>;
  onUpdateWeeklySchedule?: (newSchedule: Record<string, string>) => void;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onOpenScheduleModal: () => void;
  todayDayName: string;
  stepTarget: number;
  setStepTarget: (val: number) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  restTimerSecs: number;
  setRestTimerSecs: React.Dispatch<React.SetStateAction<number>>;
  restTimerRunning: boolean;
  onToggleRestTimer: () => void;
  onOpenDial?: (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => void;
  onOpenCommitModal?: () => void;
  theme?: 'dark' | 'light' | 'system';
  embedded?: boolean;
  onOpenProfile?: () => void;
  profileInitials?: string;
  profileImage?: string;
  onDialModeChange?: (mode: DialMode, label: string) => void;
  requestedDialMode?: DialMode | null;
  dailyMeals?: DailyMeals;
  dailyIntake?: number;
}

export type { DialMode };

export const DIAL_MODE_LIST: { key: DialMode; label: string }[] = [
  { key: 'chrono', label: 'Chrono' },
  { key: 'pulse', label: 'Pulse' },
  { key: 'split', label: 'Split' },
  { key: 'orbital', label: 'Orbital' },
  { key: 'horizon', label: 'Horizon' },
  { key: 'radial', label: 'Radial' },
  { key: 'apex', label: 'Apex' },
];

const DIAL_MODES: { key: DialMode; icon: React.ReactNode; label: string }[] = [
  { key: 'chrono', icon: <Gauge className="w-3.5 h-3.5" />, label: 'Chrono' },
  { key: 'pulse', icon: <Activity className="w-3.5 h-3.5" />, label: 'Pulse' },
  { key: 'split', icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Split' },
  { key: 'orbital', icon: <Orbit className="w-3.5 h-3.5" />, label: 'Orbital' },
  { key: 'horizon', icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Horizon' },
  { key: 'radial', icon: <Gauge className="w-3.5 h-3.5" />, label: 'Radial' },
  { key: 'apex', icon: <Activity className="w-3.5 h-3.5" />, label: 'Apex' },
];

const DAY_DIAL_MAP: Record<string, DialMode> = {
  Mon: 'apex',
  Tue: 'horizon',
  Wed: 'orbital',
  Thu: 'pulse',
  Fri: 'radial',
  Sat: 'split',
  Sun: 'chrono',
};

export const WatchDial: React.FC<WatchDialProps> = ({
  weeklySchedule = {},
  selectedDay = 'Mon',
  onSelectDay = () => {},
  stepTarget = 10000,
  setStepTarget = () => {},
  showToast = () => {},
  restTimerSecs = 90,
  setRestTimerSecs = () => {},
  restTimerRunning = false,
  onToggleRestTimer = () => {},
  onOpenDial,
  embedded = false,
  onDialModeChange,
  requestedDialMode,
  dailyMeals,
  dailyIntake,
}) => {
  const dialMode: DialMode = requestedDialMode || DAY_DIAL_MAP[selectedDay || 'Mon'] || 'chrono';

  useEffect(() => {
    const modeInfo = DIAL_MODES.find(m => m.key === dialMode);
    onDialModeChange?.(dialMode, modeInfo?.label || dialMode);
  }, [dialMode]);

  const [pedometerState, setPedometerState] = useState<PedometerState>(pedometer.getState());
  useEffect(() => {
    const unsub = pedometer.subscribe(setPedometerState);
    pedometer.start().catch(() => {});
    return () => unsub();
  }, []);

  const [cardioTotals, setCardioTotals] = useState(getTodayCardioTotals);
  useEffect(() => {
    return subscribeCardioUpdates(() => {
      setCardioTotals(getTodayCardioTotals());
    });
  }, []);

  const [dailySteps, setDailyStepsState] = useState<number>(0);
  const [dailyMove, setDailyMoveState] = useState<number>(0);
  const [dailyDist, setDailyDistState] = useState<number>(0);

  const [activeBiometricModal, setActiveBiometricModal] = useState<BiometricType | null>(null);
  const [wearables, setWearables] = useState<Record<string, boolean>>({
    appleHealth: true, googleFit: false, whoop: true, oura: true,
  });

  const handleToggleWearable = (key: string) => {
    setWearables((prev) => {
      const nextVal = !prev[key];
      showToast(`${key} connection ${nextVal ? 'enabled' : 'disabled'}`);
      return { ...prev, [key]: nextVal };
    });
  };

  const setDailySteps = (val: number) => { setDailyStepsState(val); };
  const setDailyMove = (val: number) => { setDailyMoveState(val); };
  const setDailyDist = (val: number) => { setDailyDistState(val); };

  const goalMove = 500;
  const goalDist = 5.0;

  // Real-time recalculation of total steps, calories burn, and distance
  useEffect(() => {
    const cTotals = getTodayCardioTotals();
    const totalSteps = (pedometerState.stepCount || 0) + (cTotals.totalSteps || 0);
    let totalBurn = (pedometerState.caloriesBurned || 0) + (cTotals.totalCalories || 0);
    // If steps are logged (e.g. 5508 steps) but calories were 0, auto-estimate 0.045 kcal/step
    if (totalSteps > 0 && totalBurn === 0) {
      totalBurn = Math.round(totalSteps * 0.045);
    }
    const totalDistance = parseFloat(((pedometerState.distanceKm || 0) + (cTotals.totalDistance || 0)).toFixed(2));

    setDailyStepsState(totalSteps);
    setDailyMoveState(Math.round(totalBurn));
    setDailyDistState(totalDistance);
  }, [pedometerState.stepCount, pedometerState.caloriesBurned, pedometerState.distanceKm, cardioTotals]);

  // Real-time calculation of consumed calories
  const dailyIntakeCals = useMemo(() => {
    if (typeof dailyIntake === 'number' && dailyIntake > 0) return dailyIntake;
    if (dailyMeals) {
      let sum = 0;
      (['breakfast', 'lunch', 'dinner', 'snack', 'drinks'] as const).forEach(m => {
        (dailyMeals[m] || []).forEach(item => {
          sum += (item.cals || 0);
        });
      });
      if (sum > 0) return sum;
    }
    try {
      const raw = localStorage.getItem('o1fc_meal_logs');
      if (raw) {
        const logs = JSON.parse(raw);
        if (Array.isArray(logs)) {
          const sum = logs.reduce((acc: number, curr: any) => acc + (curr.cals || curr.calories || 0), 0);
          if (sum > 0) return sum;
        }
      }
    } catch {}
    return 0;
  }, [dailyIntake, dailyMeals]);

  const handleOpenStepDial = () => {
    if (onOpenDial) {
      onOpenDial('Step Target', 50000, stepTarget, (v) => {
        setStepTarget(v);
        showToast(`Step goal set to ${v.toLocaleString()} steps!`, 'success');
      });
    } else {
      const nextTarget = stepTarget >= 20000 ? 5000 : stepTarget + 2500;
      setStepTarget(nextTarget);
      showToast(`Step target updated to ${nextTarget.toLocaleString()} steps!`, 'success');
    }
  };

  const movePct = Math.min(dailyMove / goalMove, 1);
  const distPct = Math.min(dailyDist / goalDist, 1);
  const intakePct = Math.min(dailyIntakeCals / 2500, 1);

  const bpm = 0;

  const getWorkoutLabel = (val: string | undefined): string => {
    if (!val || val === 'rest' || val === 'unassigned') return 'REST / UNASSIGNED';
    return val.replace(/_/g, ' ').toUpperCase();
  };

  const dialSharedProps = {
    dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist,
    dailyIntake: dailyIntakeCals,
    onOpenStepDial: handleOpenStepDial,
  };

  return (
    <div className="w-full flex flex-col justify-center items-center select-none font-sans relative">
      <div className="relative w-full max-w-[400px]">



        {/* Dial Variants - 7 premium faces */}
        {dialMode === 'chrono' && <DialChronoGauge {...dialSharedProps} />}
        {dialMode === 'pulse' && <DialPulseRing {...dialSharedProps} />}
        {dialMode === 'split' && <DialSplitColumn {...dialSharedProps} />}
        {dialMode === 'orbital' && <DialOrbital {...dialSharedProps} />}
        {dialMode === 'horizon' && <DialHorizon {...dialSharedProps} />}
        {dialMode === 'radial' && <DialRadial {...dialSharedProps} />}
        {dialMode === 'apex' && <DialApex {...dialSharedProps} />}

        {!embedded && <>
        {/* Complication Pills Row */}
        <div className="flex items-stretch gap-2 mt-6 px-1">
          <button
            onClick={() => showToast(`Move Goal: ${dailyMove}/${goalMove} kcal`, 'success')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/[0.06] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(234,67,53,0.15)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 15 * movePct} ${2 * Math.PI * 15}`}
                  className="transition-all duration-700"
                />
              </svg>
              <Flame className="absolute inset-0 m-auto w-3 h-3 text-[#EA4335]" />
            </div>
            <span className="text-base font-mono font-black text-white tabular-nums">{Math.round(dailyMove)}</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/50">BURN</span>
          </button>

          <button
            onClick={() => showToast(`Food Intake: ${Math.round(dailyIntakeCals)} kcal`, 'success')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/[0.06] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251,188,5,0.15)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#FBBC05" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 15 * intakePct} ${2 * Math.PI * 15}`}
                  className="transition-all duration-700"
                />
              </svg>
              <Utensils className="absolute inset-0 m-auto w-3 h-3 text-[#FBBC05]" />
            </div>
            <span className="text-base font-mono font-black text-white tabular-nums">{Math.round(dailyIntakeCals)}</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/50">INTAKE</span>
          </button>

          <button
            onClick={() => showToast(`Distance Goal: ${dailyDist.toFixed(2)}/${goalDist} km`, 'success')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/[0.06] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(52,168,83,0.18)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 15 * distPct} ${2 * Math.PI * 15}`}
                  className="transition-all duration-700"
                />
              </svg>
              <MapPin className="absolute inset-0 m-auto w-3 h-3 text-[#34A853]" />
            </div>
            <span className="text-base font-mono font-black text-white tabular-nums">{dailyDist.toFixed(1)}</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/50">KM</span>
          </button>

          <button
            onClick={() => setActiveBiometricModal('hrv')}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/[0.06] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-[#EA4335]/70" />
              <span className="absolute 1 1 w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
            </div>
            <span className="text-base font-mono font-black text-white tabular-nums">{bpm}</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/35">BPM</span>
          </button>
        </div>

        {/* Rest Timer */}
        <div
          className="flex items-center justify-between mt-3 px-4 py-2.5 rounded-2xl border border-white/10 text-xs font-mono"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2">
            <Timer className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] text-white/45 font-bold uppercase">Rest</span>
            <span className="font-bold text-sm text-white tabular-nums">
              {Math.floor(restTimerSecs / 60)}:{String(restTimerSecs % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setRestTimerSecs((s) => Math.max(15, s - 15))}
              className="w-6 h-6 rounded-lg font-bold flex items-center justify-center active:scale-95 cursor-pointer bg-white/8 hover:bg-white/15 text-white/70 text-sm">-</button>
            <button onClick={() => setRestTimerSecs((s) => s + 15)}
              className="w-6 h-6 rounded-lg font-bold flex items-center justify-center active:scale-95 cursor-pointer bg-white/8 hover:bg-white/15 text-white/70 text-sm">+</button>
            <button onClick={onToggleRestTimer}
              className={`px-3 py-1 rounded-lg font-bold text-[10px] tracking-wide transition-all active:scale-95 cursor-pointer ${
                restTimerRunning ? 'bg-red-500/60 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}>
              {restTimerRunning ? 'PAUSE' : 'START'}
            </button>
          </div>
        </div>

        {/* Biometric Quick Cards */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button onClick={() => setActiveBiometricModal('hrv')}
            className="rounded-xl py-2 px-1 flex flex-col items-center border border-white/8 cursor-pointer hover:bg-white/[0.04] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[8px] font-mono font-bold text-white/35 uppercase tracking-wider">HRV</span>
            <span className="text-[13px] font-mono font-black text-white mt-0.5">68 ms</span>
            <span className="text-[8px] font-mono font-medium text-white/30">Optimal</span>
          </button>
          <button onClick={() => setActiveBiometricModal('strain')}
            className="rounded-xl py-2 px-1 flex flex-col items-center border border-white/8 cursor-pointer hover:bg-white/[0.04] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[8px] font-mono font-bold text-white/35 uppercase tracking-wider">Strain</span>
            <span className="text-[13px] font-mono font-black text-amber-100/70 mt-0.5">14.2</span>
            <span className="text-[8px] font-mono font-medium text-white/30">High</span>
          </button>
          <button onClick={() => setActiveBiometricModal('recovery')}
            className="rounded-xl py-2 px-1 flex flex-col items-center border border-white/8 cursor-pointer hover:bg-white/[0.04] active:scale-95 transition-all"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[8px] font-mono font-bold text-white/35 uppercase tracking-wider">Recovery</span>
            <span className="text-[13px] font-mono font-black text-white mt-0.5">88%</span>
            <span className="text-[8px] font-mono font-medium text-white/30">Primed</span>
          </button>
        </div>
        </>}

      </div>

      <BiometricModal
        type={activeBiometricModal}
        onClose={() => setActiveBiometricModal(null)}
        wearables={wearables}
        onToggleWearable={handleToggleWearable}
      />
    </div>
  );
};
