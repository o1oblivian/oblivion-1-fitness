import React, { useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ExploreCoach } from '../../reelTypes';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useConsultationStore } from '../../../induction/useConsultationStore';
import { INTAKE_TITLES, optionsIn, useClubTaxonomy } from '../../../induction/useClubTaxonomyStore';
import { CoachingApplication, StorefrontProgram, StorefrontStats } from '../../services/coachStorefront';
import { priceLabel } from './CoachProgramsTab';

interface CoachConsultTabProps {
  coach: ExploreCoach;
  stats: StorefrontStats;
  application: CoachingApplication | null;
  program: StorefrontProgram | null;
  isOwn: boolean;
  onClearProgram: () => void;
  onMessage: () => void;
  onSubmit: (goal: string, intake: Record<string, string>) => Promise<void>;
  /** Opens Stripe Checkout for the first month once the coach has accepted. */
  onPay?: () => Promise<void>;
}

const STATUS_COPY: Record<CoachingApplication['status'], string> = {
  pending: 'Application sent. Waiting for the coach.',
  accepted: 'Accepted. This coach is now on your Coach tab.',
  declined: 'Not accepted this time.',
};

export const CoachConsultTab: React.FC<CoachConsultTabProps> = ({
  coach,
  stats,
  application,
  program,
  isOwn,
  onClearProgram,
  onMessage,
  onSubmit,
  onPay,
}) => {
  const taxonomy = useClubTaxonomy();
  const profile = useConsultationStore((s) => s);
  const updateConsultation = useConsultationStore((s) => s.update);
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);

  const intake = useMemo(() => {
    const label = (group: string, key: string) => optionsIn(taxonomy, group).find((row) => row.optionKey === key)?.label || '';
    const labels = (group: string, keys: readonly string[]) => keys.map((key) => label(group, key)).filter(Boolean).join(', ');
    const rows: Record<string, string> = {
      [INTAKE_TITLES.age_band]: label('age_band', profile.ageBand),
      [INTAKE_TITLES.goal]: label('goal', profile.goal),
      [INTAKE_TITLES.discipline]: label('discipline', profile.primaryDiscipline),
      [INTAKE_TITLES.training_age]: label('training_age', profile.trainingAge),
      [INTAKE_TITLES.coaching_intent]: label('coaching_intent', profile.coachingIntent),
      [INTAKE_TITLES.coaching_style]: label('coaching_style', profile.coachingStyle),
      [INTAKE_TITLES.facility]: labels('facility', profile.facilities),
      [INTAKE_TITLES.training_days]: profile.trainingDays.length > 0 ? profile.trainingDays.join(', ') : profile.frequencyDays ? `${profile.frequencyDays} days` : '',
      [INTAKE_TITLES.session_length]: label('session_length', String(profile.sessionMinutes || '')),
      [INTAKE_TITLES.injuries]: labels('injuries', profile.injuries.filter((key) => key !== 'none')),
      [INTAKE_TITLES.competition]: profile.competitionDate,
    };
    return Object.fromEntries(Object.entries(rows).filter(([, value]) => value));
  }, [taxonomy, profile]);

  const coachingQuestions = [
    { group: 'coaching_intent', prompt: 'How do you want to be coached?', value: profile.coachingIntent, field: 'coachingIntent' },
    { group: 'coaching_style', prompt: 'What feedback works best for you?', value: profile.coachingStyle, field: 'coachingStyle' },
  ] as const;

  const firstName = coach.name.split(' ')[0] || coach.name;
  const monthly = priceLabel(stats.monthlyPriceCents);
  const spots = stats.capacity != null && stats.athletes != null ? Math.max(0, stats.capacity - stats.athletes) : null;
  const canApply = !isOwn && (!application || application.status === 'declined');

  return (
    <div className="space-y-3 pt-3">
      {!isOwn && (
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onMessage();
          }}
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-o1-surface text-[14px] font-semibold text-o1-text active:scale-[0.98]"
        >
          <MessageCircle size={16} />
          Chat with {firstName}
        </button>
      )}

      <section className="space-y-1 rounded-2xl border border-white/[0.07] bg-o1-surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-o1-text">1:1 coaching</h3>
          {monthly ? <span className="tabular-nums text-[14px] font-semibold text-o1-text">{monthly}/mo</span> : null}
        </div>
        <p className="text-[12px] text-o1-muted">
          Programming, form reviews, and check-ins from {firstName}.
          {spots != null ? ` ${spots} ${spots === 1 ? 'spot' : 'spots'} open.` : ''}
        </p>
      </section>

      {application && application.status !== 'declined' ? (
        <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-3 text-[13px] text-o1-text">
          {STATUS_COPY[application.status]}
        </p>
      ) : null}

      {!isOwn && onPay && application?.status === 'accepted' && monthly && stats.monthlyPriceCents ? (
        <button
          type="button"
          disabled={paying}
          onClick={async () => {
            tactileEngine.triggerImpactPulse();
            setPaying(true);
            await onPay();
            setPaying(false);
          }}
          className="h-[48px] w-full rounded-full bg-o1-crimson text-[14px] font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
        >
          {paying ? 'Opening checkout…' : `Pay first month · ${monthly}`}
        </button>
      ) : null}

      {canApply && (
        <section className="space-y-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-4">
          <h3 className="text-[15px] font-semibold text-o1-text">Book a consultation</h3>
          {application?.status === 'declined' ? <p className="text-[12px] text-o1-muted">{STATUS_COPY.declined}</p> : null}
          {Object.keys(intake).length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              {Object.entries(intake).map(([title, value]) => (
                <div key={title} className="min-w-0">
                  <dt className="text-[11px] text-o1-muted">{title}</dt>
                  <dd className="truncate text-[13px] text-o1-text">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[12px] text-o1-muted">Your intake answers will appear here once induction is done.</p>
          )}
          {coachingQuestions.map(({ group, prompt, value, field }) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] text-o1-muted">{prompt}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={prompt}>
                {optionsIn(taxonomy, group).map((option) => {
                  const active = value === option.optionKey;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={option.detail}
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        void updateConsultation({ [field]: option.optionKey });
                      }}
                      className={`h-8 rounded-full px-3 text-[11.5px] font-normal transition active:scale-[0.97] ${active ? 'bg-o1-crimson text-white' : 'bg-white/[0.06] text-o1-text'}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {program ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-black px-3 py-2">
              <span className="truncate text-[13px] text-o1-text">Program: {program.title}</span>
              <button type="button" onClick={onClearProgram} className="h-[44px] shrink-0 px-2 text-[12px] text-o1-muted">
                Remove
              </button>
            </div>
          ) : null}
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={3}
            placeholder="What do you want from coaching?"
            className="w-full resize-none rounded-xl border border-white/[0.07] bg-o1-canvas p-3 text-[13px] text-o1-text placeholder:text-o1-muted outline-none focus:border-o1-crimson"
          />
          <button
            type="button"
            disabled={!goal.trim() || sending}
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              setSending(true);
              void onSubmit(goal, intake).finally(() => setSending(false));
            }}
            className="h-[48px] w-full rounded-full bg-o1-crimson text-[14px] font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          >
            {sending ? 'Sending' : 'Send application'}
          </button>
        </section>
      )}
    </div>
  );
};
