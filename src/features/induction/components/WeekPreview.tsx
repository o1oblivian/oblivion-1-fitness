import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { estimateSessionMinutes, planFirstWeek } from '../../workout/services/dayRoutineService';
import type { ConsultationProfile, TrainingDay } from '../consultationTypes';
import { DAY_NAMES, previewNotes } from '../inductionHelpers';
import { glass, glassActive, primaryButton } from '../inductionStyles';

/** The real first week the answers produce, so the athlete sees what they are signing up for. */
export function WeekPreview({
  profile,
  onContinue,
}: {
  profile: ConsultationProfile;
  onContinue: () => void;
}) {
  const week = planFirstWeek();
  const trainingDays = week.filter((day) => day.exercises.length > 0);
  const [open, setOpen] = useState<TrainingDay | null>(trainingDays[0]?.day ?? null);
  const minutes = trainingDays.map((day) => estimateSessionMinutes(day.exercises));
  const average =
    minutes.length > 0
      ? Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length)
      : 0;
  const notes = previewNotes(profile);

  return (
    <>
      <main className="mx-auto w-full max-w-[480px] min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-o1-label font-normal text-o1-muted">Your plan</p>
        <h1 className="mt-1.5 text-o1-title font-light leading-tight tracking-[-0.01em]">
          Here is your first week
        </h1>
        <p className="mt-1.5 text-o1-caption font-normal leading-snug text-o1-muted">
          {trainingDays.length} {trainingDays.length === 1 ? 'workout' : 'workouts'}
          {average > 0 ? `, about ${average} minutes each` : ''}. Weights adjust as you log.
        </p>

        {notes.length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {notes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-2 text-o1-label font-normal leading-snug"
              >
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-o1-crimson" strokeWidth={2.25} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-1.5">
          {week.map(({ day, splitName, exercises }) => {
            if (exercises.length === 0) {
              return (
                <div
                  key={day}
                  className="flex h-10 items-center justify-between rounded-2xl px-4 text-o1-caption font-normal text-o1-muted"
                >
                  <span>{DAY_NAMES[day]}</span>
                  <span>Rest</span>
                </div>
              );
            }
            const expanded = open === day;
            const muscles = [...new Set(exercises.map((ex) => ex.targetMuscle).filter(Boolean))]
              .slice(0, 3)
              .join(', ');
            return (
              <div key={day} className={`rounded-2xl ${expanded ? glassActive : glass}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setOpen(expanded ? null : day);
                  }}
                  className="flex min-h-[46px] w-full items-center gap-3 px-4 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-o1-body font-normal leading-tight">
                      {DAY_NAMES[day]} <span className="text-o1-muted">· {splitName}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-o1-label font-normal text-o1-muted">
                      {exercises.length} exercises · about {estimateSessionMinutes(exercises)} min
                      {muscles ? ` · ${muscles}` : ''}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-o1-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                    strokeWidth={1.75}
                  />
                </button>
                {expanded ? (
                  <ol className="space-y-1 px-4 pb-3 animate-in fade-in duration-200">
                    {exercises.map((ex) => (
                      <li
                        key={ex.id}
                        className="flex items-baseline justify-between gap-3 text-o1-caption font-normal"
                      >
                        <span className="min-w-0 truncate">{ex.name}</span>
                        <span className="shrink-0 tabular-nums text-o1-muted">
                          {(ex.sets[0]?.reps ?? 0) > 1
                            ? `${ex.sets.length} × ${ex.sets[0].reps}`
                            : `${ex.sets.length} rounds`}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
      <footer className="mx-auto w-full max-w-[480px] shrink-0 bg-gradient-to-t from-black via-black/90 to-black/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onContinue();
          }}
          className={primaryButton}
        >
          Looks good
        </button>
      </footer>
    </>
  );
}
