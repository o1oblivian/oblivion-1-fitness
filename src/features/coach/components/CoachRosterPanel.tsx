import React, { useMemo } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { Athlete } from '../services/coachService';
import { coachPeople } from '../services/floorRoster';

interface CoachRosterPanelProps {
  athletes: Athlete[];
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
}

function kg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '--';
  return `${Math.round(value).toLocaleString()} kg`;
}

export const CoachRosterPanel: React.FC<CoachRosterPanelProps> = ({ athletes, onShareInvite, onSelectAthlete }) => {
  const { people } = useMemo(() => coachPeople(athletes), [athletes]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onShareInvite();
        }}
        className="h-[52px] w-full rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] text-[14px] font-semibold text-[#EAE8DF] active:scale-[0.98]"
      >
        Invite New Athlete
      </button>

      {people.length === 0 ? (
        <section className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] px-4 py-5">
          <p className="text-[14px] leading-relaxed text-[#EAE8DF]">
            No active athletes linked. Share your invite code to onboard your first client.
          </p>
        </section>
      ) : (
        people.map((athlete) => (
          <button
            key={athlete.id}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSelectAthlete(athlete);
            }}
            className="w-full rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 text-left active:scale-[0.98]"
          >
            <p className="text-[15px] font-semibold text-[#EAE8DF]">{athlete.name}</p>
            <p className="mt-0.5 text-[12px] text-[#8A887F]">{athlete.handle || athlete.cycle || ''}</p>
            <p className="o1-num mt-2 text-[13px] text-[#EAE8DF]">
              {kg(athlete.volume)} · {athlete.sets ?? '--'} sets{athlete.prs ? ` · ${athlete.prs} PRs` : athlete.cycle ? ` · ${athlete.cycle}` : ''}
            </p>
          </button>
        ))
      )}
    </div>
  );
};

export default CoachRosterPanel;
