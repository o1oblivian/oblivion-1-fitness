import type { ConsultationProfile, TrainingDay } from '../consultationTypes';
import { WEEK } from '../consultationTypes';
import { DAY_NAMES, MAX_DAYS, MIN_DAYS, todayIso, weeksUntilLabel } from '../inductionHelpers';
import { glass, glassActive, primaryButton } from '../inductionStyles';
import {
  INTAKE_PROMPTS,
  INTAKE_TITLES,
  type IntakeGroup,
  type TaxonomyOption,
} from '../useClubTaxonomyStore';
import { Radio } from './Radio';

interface QuestionStepProps {
  group: IntakeGroup;
  profile: ConsultationProfile;
  /** The answers offered for this question. */
  choices: TaxonomyOption[];
  /** Training days as currently shown, the athlete's own or the suggested ones. */
  shownDays: TrainingDay[];
  isActive: (item: TaxonomyOption) => boolean;
  onChoose: (item: TaxonomyOption) => void;
  onToggleDay: (day: TrainingDay) => void;
  onCompetitionDate: (isoDate: string) => void;
  onContinue: () => void;
}

/** One intake question: the training-day picker, the event date, or a list of answers. */
export function QuestionStep({
  group,
  profile,
  choices,
  shownDays,
  isActive,
  onChoose,
  onToggleDay,
  onCompetitionDate,
  onContinue,
}: QuestionStepProps) {
  const multi = group === 'facility';
  const dayCount = shownDays.length;
  const daysValid = dayCount >= MIN_DAYS && dayCount <= MAX_DAYS;

  return (
    <main className="mx-auto flex w-full max-w-[480px] min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <p className="text-o1-label font-normal text-o1-muted">{INTAKE_TITLES[group]}</p>
      <h1 className="mt-1.5 text-o1-title font-light leading-tight tracking-[-0.01em]">
        {INTAKE_PROMPTS[group].title}
      </h1>
      <p className="mt-1.5 text-o1-caption font-normal leading-snug text-o1-muted">
        {INTAKE_PROMPTS[group].subtitle}
      </p>

      {group === 'training_days' ? (
        <>
          <div
            className="mt-5 grid grid-cols-7 gap-1.5"
            role="group"
            aria-label={INTAKE_PROMPTS[group].title}
          >
            {WEEK.map((day) => {
              const active = shownDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  aria-label={DAY_NAMES[day]}
                  onClick={() => onToggleDay(day)}
                  className={`flex h-8 w-full items-center justify-center rounded-full border text-o1-label font-normal transition-colors ${active ? 'border-o1-crimson bg-o1-crimson text-white' : 'border-white/[0.07] bg-o1-surface text-o1-muted'}`}
                >
                  {day.slice(0, 2)}
                </button>
              );
            })}
          </div>
          <p
            className={`mt-3 text-o1-label font-normal ${daysValid ? 'text-o1-muted' : 'text-o1-gold'}`}
          >
            {daysValid
              ? `${dayCount} training days, ${7 - dayCount} rest days`
              : `Pick ${MIN_DAYS} to ${MAX_DAYS} days so you train and still recover.`}
          </p>
          <button
            type="button"
            disabled={!daysValid}
            onClick={onContinue}
            className={`mt-5 ${primaryButton}`}
          >
            Continue
          </button>
        </>
      ) : group === 'competition' ? (
        <>
          <label className={`mt-5 flex min-h-[46px] items-center gap-3 rounded-2xl px-4 ${glass}`}>
            <span className="flex-1 text-o1-body font-normal">Event date</span>
            <input
              type="date"
              min={todayIso()}
              value={profile.competitionDate}
              onChange={(event) => onCompetitionDate(event.target.value)}
              className="bg-transparent text-right text-o1-body font-normal text-o1-text outline-none [color-scheme:dark]"
            />
          </label>
          {profile.competitionDate ? (
            <p className="mt-3 text-o1-label font-normal text-o1-muted">
              {weeksUntilLabel(profile.competitionDate)}
            </p>
          ) : null}
          <button
            type="button"
            disabled={!profile.competitionDate}
            onClick={onContinue}
            className={`mt-5 ${primaryButton}`}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              onCompetitionDate('');
              onContinue();
            }}
            className="h-10 w-full text-o1-caption font-normal text-o1-muted"
          >
            No date yet
          </button>
        </>
      ) : (
        <>
          <div
            className="mt-5 space-y-1.5"
            role={multi ? 'group' : 'radiogroup'}
            aria-label={INTAKE_PROMPTS[group].title}
          >
            {choices.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={active}
                  onClick={() => onChoose(item)}
                  className={`flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition active:scale-[0.99] ${active ? glassActive : glass}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-o1-body font-normal leading-tight">
                      {item.label}
                    </span>
                    {item.detail ? (
                      <span className="mt-0.5 block text-o1-label font-normal leading-snug text-o1-muted">
                        {item.detail}
                      </span>
                    ) : null}
                  </span>
                  <Radio active={active} square={multi} />
                </button>
              );
            })}
          </div>
          {multi ? (
            <button
              type="button"
              disabled={profile.facilities.length === 0}
              onClick={onContinue}
              className={`mt-5 ${primaryButton}`}
            >
              Continue
            </button>
          ) : null}
        </>
      )}
    </main>
  );
}
