import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HeartPulse, Flame, BatteryCharging, ShieldCheck, Dna, BarChart3 } from 'lucide-react';
import { useModalBackHandler } from '../utils/modalHistory';
import {
  getCachedTelemetry,
  fetchHealthTelemetry,
  fetchRecentTelemetryHistory,
  HealthTelemetry,
} from '../utils/healthTelemetryStore';
import { calculateRecoveryScore } from '../utils/recoveryScore';

export type BiometricType = 'hrv' | 'strain' | 'recovery';

interface BiometricModalProps {
  type: BiometricType | null;
  onClose: () => void;
  wearables?: Record<string, boolean>;
  onToggleWearable?: (deviceKey: string) => void;
  userEmail?: string;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  type,
  onClose,
  userEmail = 'athlete@o1fc.app',
}) => {
  const [telemetry, setTelemetry] = useState<HealthTelemetry>(() => getCachedTelemetry(userEmail));
  const [history, setHistory] = useState<{ date: string; dayLabel: string; telemetry: HealthTelemetry | null }[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default latest day

  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
      // Fetch genuine telemetry and 7-day history
      fetchHealthTelemetry(userEmail).then((tel) => {
        setTelemetry(tel);
      });
      fetchRecentTelemetryHistory(userEmail, 7).then((hist) => {
        setHistory(hist);
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [type, userEmail]);

  useModalBackHandler(!!type, onClose, 'biometric_modal');

  if (!type) return null;

  // Compute genuine strain from workouts and steps
  const workoutsToday = telemetry.workout_count || 0;
  const stepsToday = telemetry.steps || 0;
  const hasStrainActivity = workoutsToday > 0 || stepsToday > 0;
  const computedStrain = hasStrainActivity
    ? Math.min(21, workoutsToday * 4.5 + (stepsToday / 10000) * 5.5).toFixed(1)
    : '0.0';

  // Compute genuine recovery score
  const recovery = calculateRecoveryScore({
    hrvMs: telemetry.hrv_ms > 0 ? telemetry.hrv_ms : undefined,
    sleepHours: telemetry.sleep_hours > 0 ? telemetry.sleep_hours : undefined,
    recentWorkouts: workoutsToday,
  });
  const hasRecoveryData = recovery.hasSensorHrv || telemetry.sleep_hours > 0;

  // Build genuine 7-day trend arrays from history
  const safeHistory = history.length === 7 ? history : Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      date: d.toISOString().split('T')[0],
      dayLabel: days[d.getDay()],
      telemetry: i === 6 ? telemetry : null,
    };
  });

  const DATA_MAP = {
    hrv: {
      title: 'Heart Rhythm (HRV)',
      badge: telemetry.hrv_ms > 0 ? 'REAL-TIME SENSOR' : 'SENSOR REQUIRED',
      badgeBg:
        telemetry.hrv_ms > 0
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
      value: telemetry.hrv_ms > 0 ? `${telemetry.hrv_ms} ms` : '--',
      status:
        telemetry.hrv_ms > 0
          ? telemetry.hrv_ms >= 65
            ? 'Optimal Rhythm'
            : telemetry.hrv_ms >= 45
            ? 'Normal Baseline'
            : 'Suppressed Rhythm'
          : 'No Sensor Stream',
      statusColor:
        telemetry.hrv_ms > 0
          ? telemetry.hrv_ms >= 65
            ? 'text-emerald-500'
            : 'text-amber-500'
          : 'text-neutral-400',
      explanation:
        telemetry.hrv_ms > 0
          ? 'Heart Rate Variability measures beat-to-beat variations (rMSSD) captured from your connected wearable. Higher variability indicates parasympathetic dominance and prime training readiness.'
          : 'Heart Rate Variability requires a connected BLE heart rate monitor, Apple HealthKit, or Health Connect stream. Connect your sensor in Settings > Devices to stream genuine rMSSD readings.',
      trend: safeHistory.map((h, i) => {
        const tel = i === 6 ? telemetry : h.telemetry;
        const val = tel?.hrv_ms;
        const hasVal = typeof val === 'number' && val > 0;
        return {
          day: h.dayLabel,
          val: hasVal ? `${val} ms` : '--',
          height: hasVal ? `${Math.min(100, Math.max(15, (val / 100) * 100))}%` : '8%',
          hasData: hasVal,
        };
      }),
    },
    strain: {
      title: 'Daily Activity (Workout Load)',
      badge: hasStrainActivity ? 'TRAINING EFFORT' : 'REST / BASELINE',
      badgeBg: hasStrainActivity
        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
        : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
      value: `${computedStrain} / 21`,
      status: hasStrainActivity
        ? parseFloat(computedStrain) >= 14
          ? 'High Volume Load'
          : parseFloat(computedStrain) >= 8
          ? 'Active Training'
          : 'Light Movement'
        : 'No Recorded Workouts',
      statusColor: hasStrainActivity ? 'text-red-500' : 'text-neutral-400',
      explanation:
        'Daily Activity measures total cardiovascular and muscular load on a 0 to 21 scale based on completed workouts and verified step accumulation.',
      trend: safeHistory.map((h, i) => {
        const tel = i === 6 ? telemetry : h.telemetry;
        const w = tel?.workout_count || 0;
        const s = tel?.steps || 0;
        const st = w > 0 || s > 0 ? Math.min(21, w * 4.5 + (s / 10000) * 5.5) : 0;
        return {
          day: h.dayLabel,
          val: st > 0 ? st.toFixed(1) : '--',
          height: st > 0 ? `${Math.min(100, Math.max(12, (st / 21) * 100))}%` : '8%',
          hasData: st > 0,
        };
      }),
    },
    recovery: {
      title: 'Recovery & Energy',
      badge: hasRecoveryData ? recovery.status.toUpperCase() : 'DATA PENDING',
      badgeBg: hasRecoveryData
        ? recovery.badgeBg
        : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
      value: hasRecoveryData ? `${recovery.score}%` : '--',
      status: hasRecoveryData ? recovery.statusLabel : 'Awaiting Sleep / HRV Stream',
      statusColor: hasRecoveryData ? 'text-red-500' : 'text-neutral-400',
      explanation: hasRecoveryData
        ? recovery.recommendation
        : 'Composite recovery requires real sleep duration and resting heart rate or HRV from your connected health ecosystem. Connect Apple Health or wearable to compute genuine recovery.',
      trend: safeHistory.map((h, i) => {
        const tel = i === 6 ? telemetry : h.telemetry;
        if (!tel || (!tel.hrv_ms && !tel.sleep_hours)) {
          return { day: h.dayLabel, val: '--', height: '8%', hasData: false };
        }
        const sc = calculateRecoveryScore({
          hrvMs: tel.hrv_ms > 0 ? tel.hrv_ms : undefined,
          sleepHours: tel.sleep_hours > 0 ? tel.sleep_hours : undefined,
          recentWorkouts: tel.workout_count || 0,
        });
        return {
          day: h.dayLabel,
          val: `${sc.score}%`,
          height: `${Math.min(100, Math.max(15, sc.score))}%`,
          hasData: true,
        };
      }),
    },
  };

  const currentData = DATA_MAP[type];
  const safeIndex = Math.min(selectedDayIndex, currentData.trend.length - 1);
  const activePoint = currentData.trend[safeIndex] || currentData.trend[currentData.trend.length - 1];

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#16171B] border-t sm:border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white w-full max-w-sm rounded-t-[1.75rem] sm:rounded-2xl p-4 sm:p-4 shadow-2xl relative animate-slideUpFade space-y-3 select-none pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto -mt-1 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-neutral-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase ${currentData.badgeBg}`}>
                {currentData.badge}
              </span>
            </div>
            <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white mt-1 font-mono">
              {currentData.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 active:scale-90 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10"
            title="Close modal"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Current Metric Display */}
        <div className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 flex justify-between items-center shadow-xs">
          <div>
            <div className="text-[9px] font-mono font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider">
              Live Sensor Reading
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-neutral-900 dark:text-white my-0.5">
              {currentData.value}
            </div>
            <div className={`text-[10px] font-mono font-bold ${currentData.statusColor}`}>
              ● {currentData.status}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1C28] border border-neutral-200 dark:border-white/10 flex items-center justify-center shadow-2xs">
            {type === 'hrv' ? (
              <HeartPulse className="w-5 h-5 text-red-500" />
            ) : type === 'strain' ? (
              <Flame className="w-5 h-5 text-amber-500" />
            ) : (
              <BatteryCharging className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Physiological Explanation */}
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-display font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-red-500" />
            <span>Biometric Context</span>
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-gray-300 leading-snug font-sans bg-neutral-50 dark:bg-[#12141C] p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 shadow-2xs">
            {currentData.explanation}
          </p>
        </div>

        {/* Interactive Trend Chart */}
        <div className="bg-neutral-50 dark:bg-[#12141C] border border-neutral-200 dark:border-white/10 rounded-xl p-3 space-y-2 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-red-500" />
              7-Day Telemetry Log
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-stone-400 bg-neutral-100 dark:bg-stone-900/40 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-stone-700/40">
              {activePoint.day}: {activePoint.val}
            </span>
          </div>

          <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1">
            {currentData.trend.map((point, i) => {
              const isSelected = i === safeIndex;
              return (
                <button
                  key={point.day}
                  onClick={() => setSelectedDayIndex(i)}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-pointer group"
                >
                  <span className={`text-[8.5px] font-mono font-bold transition-colors ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-gray-500'}`}>
                    {point.val}
                  </span>
                  <div className="w-full bg-neutral-200/70 dark:bg-[#1A1C28] rounded-lg h-16 relative overflow-hidden p-0.5 flex items-end border border-neutral-200/60 dark:border-transparent">
                    <div
                      className={`w-full rounded transition-all duration-300 ${
                        isSelected
                          ? 'bg-[#DC2626]'
                          : point.hasData
                          ? 'bg-neutral-400 dark:bg-white/20 group-hover:bg-red-400/50'
                          : 'bg-neutral-300/40 dark:bg-white/5'
                      }`}
                      style={{ height: point.height }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-neutral-900 dark:text-white font-black' : 'text-neutral-400 dark:text-gray-500'}`}>
                    {point.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-mono font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs mt-1 flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <ShieldCheck className="w-4 h-4 text-red-500" />
          Dismiss
        </button>
      </div>
    </div>,
    document.body
  );
};
