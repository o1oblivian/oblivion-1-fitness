import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookmarkPlus, X } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { getSystemTodayCode } from '../../services/dayRoutineService';
import { useScrollLock } from '../../../../hooks/useScrollLock';

type DayCode = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface LiftHighlight {
  name: string;
  /** Best set today, e.g. "60 kg × 8". */
  top: string;
  /** Compared with the last time this lift was logged. */
  note: string;
  trend: 'up' | 'same' | 'down' | 'first';
  best: boolean;
}

interface CommitWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterLog: () => void;
  onTickFilledAndFinish: () => void;
  untickedFilledSets: number;
  tickedSets: number;
  onSaveRoutineToDay: (selectedDay: DayCode) => void;
  totalKg: number;
  totalSets: number;
  totalReps: number;
  durationMinutes: number;
  /** Estimated net kcal. Null when bodyweight is unknown. */
  burnedKcal: number | null;
  prCount: number;
  /** Tonnage on the same weekday last week, or null when nothing was logged. */
  lastWeekKg: number | null;
  formatKg: (kg: number) => string;
  highlights: LiftHighlight[];
  /** How the ticked sets felt on average, already in words. Null when no set was rated. */
  feel: string | null;
  simple: boolean;
  currentActiveDay?: string;
}

const TREND_TONE: Record<LiftHighlight['trend'], string> = {
  up: 'text-[#10b981]',
  same: 'text-o1-muted',
  down: 'text-o1-muted',
  first: 'text-[#0284c7]',
};

const DAYS: DayCode[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-black rounded-2xl px-2 py-2.5 border border-white/[0.07] text-center">
    <span className="text-[10px] uppercase tracking-[0.12em] text-o1-muted block">{label}</span>
    <span className="font-mono font-light text-[15px] text-o1-text">{value}</span>
  </div>
);

export const CommitWorkoutModal: React.FC<CommitWorkoutModalProps> = ({
  isOpen,
  onClose,
  onRegisterLog,
  onTickFilledAndFinish,
  untickedFilledSets,
  tickedSets,
  onSaveRoutineToDay,
  totalKg,
  totalSets,
  totalReps,
  durationMinutes,
  burnedKcal,
  prCount,
  lastWeekKg,
  formatKg,
  highlights,
  feel,
  simple,
  currentActiveDay,
}) => {
  const systemToday = getSystemTodayCode() as DayCode;
  const [selectedDay, setSelectedDay] = useState<DayCode>(
    DAYS.includes(currentActiveDay as DayCode) ? (currentActiveDay as DayCode) : systemToday,
  );
  const [showDaySelector, setShowDaySelector] = useState(false);
  useScrollLock(isOpen);
  const noneTicked = tickedSets === 0;
  const nothingToLog = noneTicked && untickedFilledSets === 0;
  const trend = lastWeekKg && totalKg > 0 ? Math.round(((totalKg - lastWeekKg) / lastWeekKg) * 100) : null;

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md o1-sheet-scrim select-none animate-in fade-in duration-150 px-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commit-workout-title"
        className="w-full max-w-[420px] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl bg-o1-sheet text-o1-text border border-white/[0.07] shadow-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
          <div>
            <h3 id="commit-workout-title" className="text-[15px] font-medium text-o1-text">
              {noneTicked ? 'Finish workout' : 'Nice work'}
            </h3>
            <span className="text-[11px] text-o1-muted block">{feel ?? 'Here is how it went'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-o1-muted hover:text-o1-text hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label={simple ? 'Lifted' : 'Volume'} value={formatKg(totalKg)} />
          <Stat label="Sets" value={String(totalSets)} />
          <Stat label="Reps" value={String(totalReps)} />
        </div>
        {totalSets > 0 && (
          <div className="grid grid-cols-2 gap-2 -mt-2">
            <Stat label="Time" value={durationMinutes > 0 ? `${durationMinutes} min` : '--'} />
            <Stat label="Active burn" value={burnedKcal != null ? `${burnedKcal.toLocaleString()} kcal` : '--'} />
          </div>
        )}
        {totalSets > 0 && burnedKcal == null && (
          <p className="text-[11px] text-o1-muted text-center -mt-2">Add your bodyweight in Profile to estimate workout burn.</p>
        )}

        {totalSets > 0 && (prCount > 0 || trend !== null) && (
          <div className="flex items-center justify-center gap-3 text-[12px]">
            {prCount > 0 && (
              <span className="text-[#10b981]">
                {prCount} {simple ? (prCount === 1 ? 'new best' : 'new bests') : prCount === 1 ? 'PR' : 'PRs'}
              </span>
            )}
            {prCount > 0 && trend !== null && <span className="text-o1-muted" aria-hidden>·</span>}
            {trend !== null && (
              <span className="text-o1-muted">
                <span className={trend >= 0 ? 'text-[#10b981]' : 'text-[#f59e0b]'}>
                  {trend >= 0 ? '+' : ''}
                  {trend}%
                </span>{' '}
                {simple ? 'lifted' : 'volume'} vs last {systemToday}
              </span>
            )}
          </div>
        )}

        {totalSets > 0 && highlights.length > 0 && !showDaySelector && (
          <ul className="rounded-2xl bg-black border border-white/[0.07] divide-y divide-white/[0.05]" aria-label="Each lift">
            {highlights.map((h) => (
              <li key={h.name} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-o1-text truncate">{h.name}</p>
                  <p className={`text-[11px] leading-snug ${TREND_TONE[h.trend]}`}>{h.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[12px] text-o1-text">{h.top}</p>
                  {h.best && <p className="text-[10.5px] text-[#10b981]">{simple ? 'New best' : 'PR'}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        {showDaySelector ? (
          <div className="p-3 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-o1-text">Repeat this workout every</span>
              <button
                type="button"
                onClick={() => setShowDaySelector(false)}
                className="text-[11px] text-o1-muted hover:text-o1-text underline underline-offset-2 cursor-pointer"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Day to repeat on">
              {DAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedDay(day);
                    }}
                    className={`h-11 rounded-xl text-center text-[12px] transition-colors cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                      isSelected ? 'bg-o1-sheet border-white/[0.14] text-white' : 'border-transparent text-o1-muted hover:text-o1-text'
                    }`}
                  >
                    <span className={day === systemToday ? 'text-[#C4121A]' : ''}>{day}</span>
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`} aria-hidden />
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-o1-muted leading-relaxed">
              From next week, opening {selectedDay} loads this exact workout.
            </p>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSaveRoutineToDay(selectedDay);
              }}
              className="w-full min-h-[44px] rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.98] text-white font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Finish & repeat every {selectedDay}</span>
            </button>
          </div>
        ) : noneTicked ? (
          <p className="text-[12px] text-[#f59e0b] text-center leading-relaxed">
            {untickedFilledSets > 0
              ? `None of your sets are ticked yet. Finishing ticks all ${untickedFilledSets} filled set${untickedFilledSets === 1 ? '' : 's'} and logs the totals above.`
              : 'No sets are ticked and none have reps entered. Enter reps and tick each set you completed.'}
          </p>
        ) : null}

        {!showDaySelector && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={nothingToLog}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (noneTicked) onTickFilledAndFinish();
                else onRegisterLog();
              }}
              className="w-full min-h-[48px] px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.98] text-white font-medium text-[13px] flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {noneTicked ? `Tick ${untickedFilledSets} set${untickedFilledSets === 1 ? '' : 's'} & finish` : 'Finish & log session'}
            </button>
            <button
              type="button"
              disabled={nothingToLog}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowDaySelector(true);
              }}
              className="w-full min-h-[44px] px-4 rounded-xl text-o1-text font-medium text-[13px] flex items-center justify-center gap-2 border border-white/[0.07] hover:border-white/[0.14] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookmarkPlus className="w-4 h-4 text-o1-muted" />
              <span>Finish & save as weekly routine</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
