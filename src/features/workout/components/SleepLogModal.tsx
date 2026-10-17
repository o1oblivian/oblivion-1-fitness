import React, { useState } from 'react';
import { X, Moon, Check, RotateCcw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useLogStore } from '../../../stores/useLogStore';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { parseCleanInt } from '../../../utils/numberInputUtils';

const QUALITY_OPTIONS = [
  { label: 'Poor', value: 40 },
  { label: 'Fair', value: 65 },
  { label: 'Good', value: 82 },
  { label: 'Great', value: 95 },
] as const;

interface SleepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SleepLogModal: React.FC<SleepLogModalProps> = ({ isOpen, onClose }) => {
  const currentSleep = useLogStore((s) => s.subModules?.sleep);
  const initialDuration =
    currentSleep?.durationHours && currentSleep.durationHours > 0
      ? currentSleep.durationHours
      : 7.5;
  const initialQuality =
    currentSleep?.sleepPerformancePercent && currentSleep.sleepPerformancePercent > 0
      ? currentSleep.sleepPerformancePercent
      : null;
  const initialHr =
    currentSleep?.restingHeartRate && currentSleep.restingHeartRate > 0
      ? currentSleep.restingHeartRate
      : null;

  const [hours, setHours] = useState<number>(initialDuration);
  const [qualityScore, setQualityScore] = useState<number | null>(initialQuality);
  const [bedtime, setBedtime] = useState<string>('');
  const [wakeTime, setWakeTime] = useState<string>('');
  const [restingHr, setRestingHr] = useState<number | null>(initialHr);

  if (!isOpen) return null;

  const setClock = (nextBed: string, nextWake: string) => {
    setBedtime(nextBed);
    setWakeTime(nextWake);
    const toMin = (t: string) => {
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };
    if (!nextBed || !nextWake) return;
    const span = (toMin(nextWake) - toMin(nextBed) + 1440) % 1440;
    if (span >= 180 && span <= 840) setHours(Math.round((span / 60) * 4) / 4);
  };

  const presets = [
    { label: '6.5h', hours: 6.5, sub: 'Maintenance' },
    { label: '7.5h', hours: 7.5, sub: 'Athletic Standard' },
    { label: '8.0h', hours: 8.0, sub: 'Optimal Recovery' },
    { label: '9.0h', hours: 9.0, sub: 'Deep recovery' },
  ];

  const handlePreset = (val: number) => {
    tactileEngine.triggerSelectionBuzz();
    setHours(val);
  };

  const adjustHours = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    setHours((prev) => Math.max(3.0, Math.min(14.0, Number((prev + delta).toFixed(1)))));
  };

  const handleSave = () => {
    if (qualityScore === null) return;
    const bpm = restingHr !== null && restingHr >= 25 && restingHr <= 220 ? restingHr : null;
    tactileEngine.triggerSelectionBuzz();

    // 1. Update active session in useLogStore
    useLogStore.getState().updateSubModule('sleep', {
      durationHours: hours,
      deepSleepMinutes: 0,
      remSleepMinutes: 0,
      deepPercentage: 0,
      remPercentage: 0,
      sleepPerformancePercent: qualityScore,
      restingHeartRate: bpm ?? 0,
      hrvMs: 0,
    });

    // 2. Persist to telemetry history store for today
    try {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      useTelemetryHistoryStore.getState().updateDayRecord(todayKey, 'sleep', {
        hasData: true,
        durationHours: hours,
        durationMinutes: Math.round(hours * 60),
        recoveryPercent: qualityScore,
        deepSleepMinutes: 0,
        remSleepMinutes: 0,
        sleepEfficiencyPercent: 0,
        restingHeartRate: bpm ?? 0,
        bedtime,
        wakeTime,
      });
    } catch {
      // safe fallback
    }

    onClose();
  };

  // Convert decimal hours to formatted string (e.g. 7h 30m)
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);

  return (
    <div
      id="sleep-log-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60000] bg-black/85 backdrop-blur-md o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="o1-sheet-card bg-o1-card text-white w-full border border-white/[0.07] flex flex-col overflow-y-auto shadow-xl p-3.5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Crystal Clear, Zero Dark Fog */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tactical font-medium text-sm tracking-wider text-white">
                  Sleep Architecture Log
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-white/10 text-sky-600">
                  Circadian
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Nocturnal Restoration &amp; REM Depth
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Sleep Duration Display & Fine Stepper (Zero Dark Fog) */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 font-medium block">
                Total Duration Recorded
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-light text-white tracking-tight">
                  {h}h {m > 0 ? `${m}m` : ''}
                </span>
                <span className="text-xs font-mono text-neutral-400">({hours}h total)</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-sky-600 tracking-wider block">
                {hours >= 8
                  ? 'Optimal Anabolic Restoration'
                  : hours >= 7
                    ? 'Sufficient neural clearance'
                    : 'sleep deficit recovery needed'}
              </span>
            </div>

            {/* Quality Score Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-right">
              <span className="text-lg font-mono font-light text-sky-600 leading-none block">
                {qualityScore === null ? '--' : `${qualityScore}%`}
              </span>
              <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Quality</span>
            </div>
          </div>

          {/* Stepper Buttons (-30m, -15m, +15m, +30m) */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => adjustHours(-0.5)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-medium text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              -30m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(-0.25)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-medium text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              -15m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(0.25)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-medium text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(0.5)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-medium text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              +30m
            </button>
          </div>
        </div>

        {/* 4 Fast Athletic Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono tracking-wider text-neutral-400">
            Athletic Sleep Protocols
          </span>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const isSelected = Math.abs(hours - p.hours) < 0.1;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handlePreset(p.hours)}
                  className={`min-h-[64px] p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-colors active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-o1-sheet border-o1-crimson'
                      : 'bg-o1-surface border-white/[0.07] hover:border-white/[0.14]'
                  }`}
                >
                  <span className="flex items-start justify-between gap-2 min-w-0">
                    <span className="text-base font-mono font-light text-o1-text leading-none">
                      {p.label}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 rounded-full border border-o1-crimson/60 px-1.5 py-px text-[10px] leading-4 text-o1-text">
                        Active
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-o1-muted leading-tight truncate">{p.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono tracking-wider text-neutral-400">
            How rested do you feel?
          </span>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Sleep quality">
            {QUALITY_OPTIONS.map((q) => {
              const isSelected = qualityScore === q.value;
              return (
                <button
                  key={q.label}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setQualityScore(q.value);
                  }}
                  className={`min-h-[44px] rounded-xl border text-[12px] font-medium transition-colors active:scale-[0.97] cursor-pointer ${
                    isSelected
                      ? 'bg-o1-sheet border-o1-crimson text-o1-text'
                      : 'bg-o1-surface border-white/[0.07] text-o1-muted hover:text-o1-text'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Circadian Timestamps & Resting Heart Rate */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-medium">Bedtime</span>
            <input
              type="time"
              value={bedtime}
              aria-label="Bedtime"
              onChange={(e) => setClock(e.target.value, wakeTime)}
              className="w-full bg-transparent text-xs font-mono font-medium text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-medium">
              Wake Time
            </span>
            <input
              type="time"
              value={wakeTime}
              aria-label="Wake time"
              onChange={(e) => setClock(bedtime, e.target.value)}
              className="w-full bg-transparent text-xs font-mono font-medium text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-medium">
              Resting Hr
            </span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                inputMode="numeric"
                placeholder="--"
                aria-label="Resting heart rate, optional"
                value={restingHr ?? ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setRestingHr(parseCleanInt(e.target.value) || null)}
                onBlur={() => setRestingHr((v) => (v !== null && v >= 25 && v <= 220 ? v : null))}
                className="w-12 bg-transparent text-xs font-mono font-medium text-white focus:outline-none"
              />
              <span className="text-[9px] font-mono text-neutral-400">bpm</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-o1-muted leading-relaxed px-0.5">
          Bed and wake times fill the duration for you. Resting heart rate is optional; leave it
          blank if you didn&apos;t measure it.
        </p>

        {/* Footer Actions */}
        <div className="sticky bottom-0 z-10 -mx-3.5 -mb-3.5 px-3.5 pt-2.5 pb-[max(env(safe-area-inset-bottom),14px)] bg-o1-card border-t border-white/[0.05] flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setHours(7.5);
              setQualityScore(null);
              setBedtime('');
              setWakeTime('');
              setRestingHr(null);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] text-xs font-mono font-medium text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={qualityScore === null}
            className="flex-2 py-2.5 px-5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{qualityScore === null ? 'Rate how rested you feel' : 'Log sleep'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
