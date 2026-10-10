import React from 'react';
import { X, Heart, Activity, Moon, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { latestSleepRecord } from '../../report/vitals';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Real readiness score; 0 / undefined means nothing is logged and renders as --. */
  score?: number;
}

const fmtMinutes = (mins: number): string => {
  if (!(mins > 0)) return '--';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const ReadinessTelemetryModal: React.FC<Props> = ({ isOpen, onClose, score }) => {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  if (!isOpen) return null;

  const sleep = latestSleepRecord(historyByDate);
  const hasScore = typeof score === 'number' && score > 0;
  const restingHr = sleep && sleep.restingHeartRate > 0 ? `${sleep.restingHeartRate} bpm` : '--';
  const totalSleep = sleep ? fmtMinutes(Math.round(sleep.durationHours * 60)) : '--';
  const efficiency = sleep && sleep.sleepEfficiencyPercent > 0 ? `${sleep.sleepEfficiencyPercent}% Efficiency` : '-- Efficiency';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-4 shadow-xl text-white space-y-3 overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Heart className="w-4 h-4 fill-sky-500/20" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-sky-400 font-bold block">
                Biometric Telemetry
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">Readiness</h3>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 font-bold block">
              Readiness Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-mono font-black text-sky-400">{hasScore ? `${score}%` : '--'}</span>
              {!hasScore && <span className="text-xs font-semibold text-neutral-400">Nothing logged yet</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* Logged biometrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono font-bold">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>HRV (Variability)</span>
            </div>
            <div className="text-base font-mono font-bold text-white">--</div>
            <div className="text-[10px] font-mono text-neutral-500">Needs a connected wearable</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono font-bold">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>Resting Heart Rate</span>
            </div>
            <div className="text-base font-mono font-bold text-white">{restingHr}</div>
            <div className="text-[10px] font-mono text-neutral-500">
              {restingHr === '--' ? 'Not logged' : 'From your sleep log'}
            </div>
          </div>

          <div className="col-span-2 p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-mono font-bold">
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Sleep</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{totalSleep}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 pt-0.5">
              <span>Deep: <strong className="text-white">{fmtMinutes(sleep?.deepSleepMinutes ?? 0)}</strong></span>
              <span>Rem: <strong className="text-white">{fmtMinutes(sleep?.remSleepMinutes ?? 0)}</strong></span>
              <span className="text-neutral-400">{efficiency}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-mono text-neutral-500 leading-relaxed">
          Values come only from what you log or a connected device. Anything unread stays as --.
        </p>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
          className="w-full min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/[0.07] text-white text-xs font-mono font-bold tracking-wider active:scale-95 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ReadinessTelemetryModal;
