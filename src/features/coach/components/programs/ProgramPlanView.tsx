import React, { useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import type { ProgramPlanData } from '../../services/programPlan';

function restLabel(seconds: number): string {
  if (!seconds) return '';
  return seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} rest` : `${seconds}s rest`;
}

/** Week picker plus every day and exercise the coach built. */
export const ProgramPlanView: React.FC<{ plan: ProgramPlanData }> = ({ plan }) => {
  const [weekIndex, setWeekIndex] = useState(0);
  const week = plan.weeks[Math.min(weekIndex, plan.weeks.length - 1)];
  if (!week) return null;

  return (
    <div className="space-y-3">
      {plan.methodology ? (
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-o1-muted">How it works</p>
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-o1-text">{plan.methodology}</p>
        </div>
      ) : null}

      {plan.weeks.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Program weeks">
          {plan.weeks.map((w, index) => {
            const active = index === weekIndex;
            return (
              <button
                key={w.weekNumber}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setWeekIndex(index);
                }}
                className={`h-9 shrink-0 rounded-full border px-3.5 text-[12px] font-semibold transition ${
                  active ? 'border-o1-crimson bg-o1-crimson text-white' : 'border-white/[0.07] bg-o1-surface text-o1-muted'
                }`}
              >
                Week {w.weekNumber}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {week.days.map((day) => (
          <div key={day.id} className="rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[14px] font-semibold text-o1-text">{day.dayName}</p>
              {day.splitFocus ? <p className="truncate text-[12px] text-o1-muted">{day.splitFocus}</p> : null}
            </div>
            {day.exercises.length === 0 ? (
              <p className="pt-1 text-[12px] text-o1-muted">Rest or coach-guided session</p>
            ) : (
              <ol className="mt-2 space-y-2">
                {day.exercises.map((ex, index) => {
                  const dose = [ex.sets ? `${ex.sets} × ${ex.reps || '—'}` : ex.reps, restLabel(ex.restSeconds)].filter(Boolean).join(' · ');
                  return (
                    <li key={ex.id} className="flex gap-2.5">
                      <span className="w-4 shrink-0 pt-0.5 text-right text-[12px] tabular-nums text-o1-muted">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-o1-text">{ex.name}</p>
                        {dose ? <p className="text-[12px] tabular-nums text-o1-muted">{dose}</p> : null}
                        {ex.cue ? <p className="pt-0.5 text-[12px] leading-snug text-o1-muted">{ex.cue}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
