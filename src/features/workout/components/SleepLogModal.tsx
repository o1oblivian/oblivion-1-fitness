import React, { useState } from 'react';
import { X, Moon, Sparkles, Check, Clock, Heart, Zap, BedDouble, RotateCcw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useLogStore } from '../../../stores/useLogStore';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { parseCleanInt } from '../../../utils/numberInputUtils';

interface SleepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SleepLogModal: React.FC<SleepLogModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const currentSleep = useLogStore((s) => s.subModules?.sleep);
  const initialDuration = currentSleep?.durationHours && currentSleep.durationHours > 0
    ? currentSleep.durationHours
    : 7.5;
  const initialQuality = currentSleep?.sleepPerformancePercent && currentSleep.sleepPerformancePercent > 0
    ? currentSleep.sleepPerformancePercent
    : 92;

  const [hours, setHours] = useState<number>(initialDuration);
  const [qualityScore, setQualityScore] = useState<number>(initialQuality);
  const [bedtime, setBedtime] = useState<string>('22:30');
  const [wakeTime, setWakeTime] = useState<string>('06:30');
  const [restingHr, setRestingHr] = useState<number>(50);

  if (!isOpen) return null;

  const presets = [
    { label: '6.5h', hours: 6.5, sub: 'Maintenance' },
    { label: '7.5h', hours: 7.5, sub: 'Athletic Standard' },
    { label: '8.0h', hours: 8.0, sub: 'Optimal Recovery' },
    { label: '9.0h', hours: 9.0, sub: 'Heavy CNS Rebuild' },
  ];

  const handlePreset = (val: number, label: string) => {
    tactileEngine.triggerSelectionBuzz();
    setHours(val);
    onShowToast?.(`Selected ${label} sleep profile`);
  };

  const adjustHours = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    setHours((prev) => Math.max(3.0, Math.min(14.0, Number((prev + delta).toFixed(1)))));
  };

  const handleSave = () => {
    tactileEngine.playPRCelebration();

    // 1. Update active session in useLogStore
    useLogStore.getState().updateSubModule('sleep', {
      durationHours: hours,
      deepSleepMinutes: 0,
      remSleepMinutes: 0,
      deepPercentage: 0,
      remPercentage: 0,
      sleepPerformancePercent: qualityScore,
      restingHeartRate: restingHr,
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
        restingHeartRate: restingHr,
        bedtime,
        wakeTime,
      });
    } catch {
      // safe fallback
    }

    onShowToast?.(`Sleep Architecture Logged: ${hours}h (${qualityScore}% Recovery)`);
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
      className="fixed inset-0 z-[60000] bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="o1-sheet-card bg-o1-card text-white w-full border border-white/[0.07] flex flex-col overflow-y-auto shadow-xl p-3.5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Crystal Clear, Zero Dark Fog */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tactical font-bold text-sm tracking-wider text-white">
                  Sleep Architecture Log
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-sky-400">
                  Circadian
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400">Nocturnal Restoration &amp; REM Depth</p>
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
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 font-bold block">
                Total Duration Recorded
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-black text-white tracking-tight">
                  {h}h {m > 0 ? `${m}m` : ''}
                </span>
                <span className="text-xs font-mono text-neutral-400">({hours}h total)</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-400 tracking-wider block">
                {hours >= 8 ? 'Optimal Anabolic Restoration' : hours >= 7 ? 'Sufficient neural clearance' : 'sleep deficit recovery needed'}
              </span>
            </div>

            {/* Quality Score Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-right">
              <span className="text-lg font-mono font-black text-sky-400 leading-none block">{qualityScore}%</span>
              <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Quality</span>
            </div>
          </div>

          {/* Stepper Buttons (-30m, -15m, +15m, +30m) */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => adjustHours(-0.5)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-bold text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              -30m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(-0.25)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-bold text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              -15m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(0.25)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-bold text-neutral-300 active:scale-95 transition-all cursor-pointer"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => adjustHours(0.5)}
              className="flex-1 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-bold text-neutral-300 active:scale-95 transition-all cursor-pointer"
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
                  onClick={() => handlePreset(p.hours, p.label)}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/20 border-sky-500/50 text-white'
                      : 'bg-white/[0.03] border-white/[0.07] text-neutral-300 hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{p.label}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-neutral-400'
                    }`}>
                      {isSelected ? 'Active' : 'select'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-1">
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Circadian Timestamps & Resting Heart Rate */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-bold">Bedtime</span>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-bold">Wake Time</span>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-2.5 space-y-1">
            <span className="text-[9px] font-mono text-neutral-400 block font-bold">Resting Hr</span>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                placeholder="0"
                value={restingHr === 0 ? '' : restingHr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setRestingHr(parseCleanInt(e.target.value) || 50)}
                className="w-12 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
              <span className="text-[9px] font-mono text-neutral-400">bpm</span>
            </div>
          </div>
        </div>

        {/* Physiological Nocturnal Restoration Card */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-sky-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ENDOCRINE &amp; GH RESTORATION</span>
            </span>
            <span className="text-white">~{Math.round(hours * 15)}% Recovery Delta</span>
          </div>
          <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
            Slow-wave sleep amplifies growth hormone synthesis, clears metabolic byproducts, and restores central nervous system motor firing.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-1 border-t border-white/[0.05] flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setHours(7.5);
              setQualityScore(92);
              onShowToast?.('Reset to standard 7.5h sleep');
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] text-xs font-mono font-bold text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-2.5 px-5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-tactical font-bold tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>CONFIRM &amp; LOG SLEEP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SleepLogModal;
