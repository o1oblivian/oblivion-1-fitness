import React from 'react';
import { X, Heart, Activity, Moon, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { latestSleepRecord } from '../../report/vitals';
import { TrainingSafetyInfo } from '../../legal/TrainingSafetyInfo';
import { BodyStatusCard } from '../../bodyStatus/BodyStatusCard';
import { ReadinessBreakdown } from './ReadinessBreakdown';
import { useCountUp } from '../../../hooks/useCountUp';
import { latestHrv, localDateKey, useHrvStore } from '../../../services/ble/hrv';

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
  const hrvByDate = useHrvStore((s) => s.byDate);
  const scoreShown = useCountUp(isOpen && typeof score === 'number' ? score : null);
  if (!isOpen) return null;

  const hrv = latestHrv(hrvByDate);
  const hrvSource = !hrv
    ? 'Pair a heart rate sensor in Settings'
    : localDateKey(hrv.at) === localDateKey(Date.now())
      ? `${hrv.device} · ${new Date(hrv.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : `${hrv.device} · ${new Date(hrv.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;

  const sleep = latestSleepRecord(historyByDate);
  const hasScore = typeof score === 'number' && score > 0;
  const restingHr = sleep && sleep.restingHeartRate > 0 ? `${sleep.restingHeartRate} bpm` : '--';
  const totalSleep = sleep ? fmtMinutes(Math.round(sleep.durationHours * 60)) : '--';
  const efficiency =
    sleep && sleep.sleepEfficiencyPercent > 0
      ? `${sleep.sleepEfficiencyPercent}% Efficiency`
      : '-- Efficiency';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[60000] bg-black/85 backdrop-blur-md o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-4 shadow-xl text-white space-y-3 overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center pb-3 border-b border-white/[0.05]">
          <div className="flex-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-o1-teal/10 border border-o1-teal/30 flex items-center justify-center text-o1-blue">
              <Heart className="w-4 h-4 fill-o1-teal/20" />
            </div>
            <div>
              <span className="text-o1-label font-num tracking-widest text-o1-blue font-medium block">
                Biometric Telemetry
              </span>
              <h3 className="text-sm font-medium text-white tracking-tight">Readiness</h3>
            </div>
          </div>
          <TrainingSafetyInfo topic="readiness" />
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-o1-muted hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
          <div>
            <span className="text-o1-label font-num tracking-wider text-o1-muted font-medium block">
              Readiness Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-num font-light text-o1-blue">
                {hasScore ? `${scoreShown}%` : '--'}
              </span>
              {!hasScore && (
                <span className="text-xs font-semibold text-o1-muted">Nothing logged yet</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-o1-teal/10 border border-o1-teal/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-o1-blue" />
          </div>
        </div>

        <BodyStatusCard />

        <ReadinessBreakdown />

        {/* Logged biometrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-o1-muted text-o1-label font-num font-medium">
              <Activity className="w-3.5 h-3.5 text-o1-blue" />
              <span>HRV (Variability)</span>
            </div>
            <div className="text-base font-num font-medium text-white">
              {hrv ? `${hrv.rmssdMs} ms` : '--'}
            </div>
            <div className="text-o1-label font-num text-o1-faint truncate">{hrvSource}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1.5 text-o1-muted text-o1-label font-num font-medium">
              <Heart className="w-3.5 h-3.5 text-o1-crimson" />
              <span>Resting Heart Rate</span>
            </div>
            <div className="text-base font-num font-medium text-white">{restingHr}</div>
            <div className="text-o1-label font-num text-o1-faint">
              {restingHr === '--' ? 'Not logged' : 'From your sleep log'}
            </div>
          </div>

          <div className="col-span-2 p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-o1-muted text-o1-label font-num font-medium">
                <Moon className="w-3.5 h-3.5 text-o1-blue" />
                <span>Sleep</span>
              </div>
              <span className="text-xs font-num font-medium text-white">{totalSleep}</span>
            </div>
            <div className="flex items-center justify-between text-o1-label font-num text-o1-stone pt-0.5">
              <span>
                Deep:{' '}
                <strong className="text-white">{fmtMinutes(sleep?.deepSleepMinutes ?? 0)}</strong>
              </span>
              <span>
                Rem:{' '}
                <strong className="text-white">{fmtMinutes(sleep?.remSleepMinutes ?? 0)}</strong>
              </span>
              <span className="text-o1-muted">{efficiency}</span>
            </div>
          </div>
        </div>

        <p className="text-o1-label font-num text-o1-faint leading-relaxed">
          Values come only from what you log or a connected device. Anything unread stays as --.
        </p>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
          className="w-full min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/15 border border-white/[0.07] text-white text-xs font-num font-medium tracking-wider active:scale-95 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
