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
}) => {
  const taxonomy = useClubTaxonomy();
  const discipline = useConsultationStore((s) => s.primaryDiscipline);
  const trainingAge = useConsultationStore((s) => s.trainingAge);
  const coachingIntent = useConsultationStore((s) => s.coachingIntent);
  const coachingStyle = useConsultationStore((s) => s.coachingStyle);
  const facility = useConsultationStore((s) => s.facility);
  const frequencyDays = useConsultationStore((s) => s.frequencyDays);
  const [goal, setGoal] = useState('');
  const [sending, setSending] = useState(false);

  const intake = useMemo(() => {
    const label = (group: string, key: string) => optionsIn(taxonomy, group).find((row) => row.optionKey === key)?.label || '';
    const rows: Record<string, string> = {
      [INTAKE_TITLES.discipline]: label('discipline', discipline),
      [INTAKE_TITLES.training_age]: label('training_age', trainingAge),
      [INTAKE_TITLES.coaching_intent]: label('coaching_intent', coachingIntent),
      [INTAKE_TITLES.coaching_style]: label('coaching_style', coachingStyle),
      [INTAKE_TITLES.facility]: label('facility', facility),
      [INTAKE_TITLES.frequency]: frequencyDays ? `${frequencyDays} days` : '',
    };
    return Object.fromEntries(Object.entries(rows).filter(([, value]) => value));
  }, [taxonomy, discipline, trainingAge, coachingIntent, coachingStyle, facility, frequencyDays]);

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
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] text-[14px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
        >
          <MessageCircle size={16} />
          Chat with {firstName}
        </button>
      )}

      <section className="space-y-1 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-[#EAE8DF]">1:1 coaching</h3>
          {monthly ? <span className="o1-num text-[14px] font-semibold text-[#EAE8DF]">{monthly}/mo</span> : null}
        </div>
        <p className="text-[12px] text-[#8A887F]">
          Programming, form reviews, and check-ins from {firstName}.
          {spots != null ? ` ${spots} ${spots === 1 ? 'spot' : 'spots'} open.` : ''}
        </p>
      </section>

      {application && application.status !== 'declined' ? (
        <p className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-3 text-[13px] text-[#EAE8DF]">
          {STATUS_COPY[application.status]}
        </p>
      ) : null}

      {canApply && (
        <section className="space-y-3 rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
          <h3 className="text-[15px] font-semibold text-[#EAE8DF]">Book a consultation</h3>
          {application?.status === 'declined' ? <p className="text-[12px] text-[#8A887F]">{STATUS_COPY.declined}</p> : null}
          {Object.keys(intake).length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              {Object.entries(intake).map(([title, value]) => (
                <div key={title} className="min-w-0">
                  <dt className="text-[11px] text-[#8A887F]">{title}</dt>
                  <dd className="truncate text-[13px] text-[#EAE8DF]">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[12px] text-[#8A887F]">Your intake answers will appear here once induction is done.</p>
          )}
          {program ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-black px-3 py-2">
              <span className="truncate text-[13px] text-[#EAE8DF]">Program: {program.title}</span>
              <button type="button" onClick={onClearProgram} className="h-[44px] shrink-0 px-2 text-[12px] text-[#8A887F]">
                Remove
              </button>
            </div>
          ) : null}
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={3}
            placeholder="What do you want from coaching?"
            className="w-full resize-none rounded-xl border border-[#1F1F1F] bg-black p-3 text-[13px] text-[#EAE8DF] placeholder:text-[#8A887F] outline-none focus:border-[#C4121A]"
          />
          <button
            type="button"
            disabled={!goal.trim() || sending}
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              setSending(true);
              void onSubmit(goal, intake).finally(() => setSending(false));
            }}
            className="h-[48px] w-full rounded-full bg-[#C4121A] text-[14px] font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          >
            {sending ? 'Sending' : 'Send application'}
          </button>
        </section>
      )}
    </div>
  );
};
