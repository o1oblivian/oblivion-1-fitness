import React from 'react';
import { Bandage, Moon, Thermometer, Zap, type LucideIcon } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import {
  INJURY_AREAS,
  setBodyStatus,
  statusDay,
  useBodyStatus,
  type BodyStatus,
} from './bodyStatus';

const OPTIONS: { status: BodyStatus; label: string; Icon: LucideIcon }[] = [
  { status: 'ready', label: 'Good', Icon: Zap },
  { status: 'rest', label: 'Rest day', Icon: Moon },
  { status: 'sick', label: 'Sick', Icon: Thermometer },
  { status: 'injured', label: 'Injured', Icon: Bandage },
];

const NOTE: Record<BodyStatus, string> = {
  ready: 'Training is on. Your readiness and load targets guide the day.',
  rest: 'Training is paused for today. Workout reminders stay quiet.',
  sick: 'Training is paused until you say you are better. Workout reminders stay quiet.',
  injured: 'Targets drop 10% and workout reminders stay quiet. Pick the area to train around it.',
};

/** Lets the athlete say how they feel; the call for today, load targets and reminders follow. */
export const BodyStatusCard: React.FC = () => {
  const state = useBodyStatus();
  const day = statusDay(state);

  const choose = (status: BodyStatus, area: string | null = null) => {
    tactileEngine.triggerSelectionBuzz();
    setBodyStatus(status, area);
  };

  return (
    <section
      aria-label="How are you today"
      className="w-full rounded-2xl bg-o1-card border border-white/[0.07] p-4 space-y-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-o1-label font-num font-bold tracking-[0.18em] text-o1-muted">
          How are you today?
        </h3>
        {state.status === 'sick' || state.status === 'injured' ? (
          <span className="text-o1-label text-o1-muted">Day {day}</span>
        ) : null}
      </div>

      <div role="radiogroup" aria-label="Body status" className="grid grid-cols-4 gap-2">
        {OPTIONS.map(({ status, label, Icon }) => {
          const selected = state.status === status;
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(status, status === 'injured' ? state.area : null)}
              className={`min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-1 px-1 cursor-pointer active:scale-95 transition ${
                selected
                  ? 'bg-o1-yellow text-black border-o1-yellow'
                  : 'bg-o1-well text-o1-text border-white/[0.07] hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span className="text-o1-label font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>

      {state.status === 'injured' && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Injured area">
          {INJURY_AREAS.map((area) => {
            const selected = state.area === area;
            return (
              <button
                key={area}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose('injured', selected ? null : area)}
                className={`min-h-[44px] px-3.5 rounded-full border text-o1-caption cursor-pointer active:scale-95 transition ${
                  selected
                    ? 'border-o1-yellow text-o1-yellow bg-o1-yellow/10'
                    : 'border-white/[0.07] text-o1-text'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-o1-label text-o1-muted leading-snug">{NOTE[state.status]}</p>
    </section>
  );
};
