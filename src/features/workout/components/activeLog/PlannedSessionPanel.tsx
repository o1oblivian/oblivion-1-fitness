import React from 'react';
import type { TodaySession } from '../../../log/todaySession';
import { BEGINNER_STARTERS, type BeginnerStarter } from '../../data/beginnerStarters';

interface PlannedSessionPanelProps {
  planned: TodaySession;
  plannedMinutes: number;
  restPlan: boolean;
  /** A workout was already saved today. */
  loggedToday: boolean;
  showStarters: boolean;
  onStart: () => void;
  onBuildOwn: () => void;
  onToggleStarters: () => void;
  onLoadStarter: (starter: BeginnerStarter) => void;
}

/** What shows before a session starts: today's plan, the start button, and beginner starters. */
export const PlannedSessionPanel: React.FC<PlannedSessionPanelProps> = ({
  planned,
  plannedMinutes,
  restPlan,
  loggedToday,
  showStarters,
  onStart,
  onBuildOwn,
  onToggleStarters,
  onLoadStarter,
}) => (
  <div className="px-0.5 pb-0.5 space-y-2.5">
    {loggedToday ? (
      <p className="text-o1-caption text-o1-muted leading-snug">
        Today's workout is saved. Rest up, or start another below.
      </p>
    ) : planned.exercises.length > 0 ? (
      <p className="text-o1-caption text-o1-muted leading-snug truncate">
        <span className="text-o1-text">{restPlan ? 'Rest day' : planned.title}</span> ·{' '}
        {planned.exercises.length} {restPlan ? 'light ' : ''}
        {planned.exercises.length === 1 ? 'exercise' : 'exercises'}
        {plannedMinutes > 0 ? ` · about ${plannedMinutes} min` : ''}
        {restPlan ? '' : ` · ${planned.detail}`}
      </p>
    ) : (
      <p className="text-o1-caption text-o1-muted leading-snug">
        {planned.title === 'Rest day'
          ? 'Rest day. Recover, or build a light session.'
          : 'No workout planned for today yet.'}
      </p>
    )}

    {!loggedToday && (
      <button
        type="button"
        onClick={onStart}
        className="w-full h-12 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.99] text-white font-medium text-o1-control flex items-center justify-center transition cursor-pointer"
      >
        {planned.exercises.length === 0
          ? 'Build a workout'
          : restPlan
            ? 'Start recovery'
            : "Start today's workout"}
      </button>
    )}

    <div className="flex items-center justify-center gap-2 text-o1-caption text-o1-muted">
      {(loggedToday || planned.exercises.length > 0) && (
        <>
          <button
            type="button"
            onClick={onBuildOwn}
            className="min-h-[44px] px-2 hover:text-o1-text underline underline-offset-2 cursor-pointer"
          >
            Build my own
          </button>
          <span aria-hidden="true">·</span>
        </>
      )}
      <button
        type="button"
        onClick={onToggleStarters}
        aria-expanded={showStarters}
        className="min-h-[44px] px-2 hover:text-o1-text underline underline-offset-2 cursor-pointer"
      >
        {showStarters ? 'Hide beginner starters' : 'Beginner starters'}
      </button>
    </div>

    {showStarters && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BEGINNER_STARTERS.map((starter) => (
          <button
            key={starter.routineName}
            type="button"
            onClick={() => onLoadStarter(starter)}
            className="p-3 text-left rounded-xl bg-o1-well border border-white/[0.07] hover:border-white/[0.14] transition-colors cursor-pointer flex flex-col justify-between active:scale-[0.99]"
          >
            <div>
              <span className="text-o1-label px-1.5 py-0.5 rounded-full border border-white/[0.14] text-o1-muted">
                {starter.badge}
              </span>
              <h5 className="text-o1-body text-o1-text leading-tight mt-1.5">{starter.title}</h5>
              <p className="text-o1-label text-o1-muted mt-0.5">{starter.subtitle}</p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-white/[0.07] text-o1-label text-o1-muted flex items-center justify-between">
              <span>{starter.movements.length} exercises</span>
              <span>Tap to load</span>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);
