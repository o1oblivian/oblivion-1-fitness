import React, { useState } from 'react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';
import { AthleteRowItem } from './AthleteRowItem';

export type RosterFilter = 'All' | 'Active' | 'Inactive' | 'Check-in' | 'Need Routine';
const ROSTER_FILTERS: RosterFilter[] = ['All', 'Active', 'Inactive', 'Check-in', 'Need Routine'];

export interface ActiveRosterSectionProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

export const ActiveRosterSection: React.FC<ActiveRosterSectionProps> = ({
  athletes,
  onSelectAthlete,
}) => {
  const [filter, setFilter] = useState<RosterFilter>('All');
  const filtered = athletes.filter((athlete) => (filter === 'All' ? true : athlete.status === filter));

  return (
    <div className="space-y-3 select-none">
      {athletes.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {ROSTER_FILTERS.map((chip) => {
            const count = chip === 'All' ? athletes.length : athletes.filter((athlete) => athlete.status === chip).length;
            const isActive = filter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => { tactileEngine.triggerSelectionBuzz(); setFilter(chip); }}
                className={`o1-pill text-[11px] font-semibold border ${
                  isActive
                    ? 'bg-white text-neutral-950 border-white'
                    : 'bg-o1-well text-neutral-200 border-white/[0.07]'
                }`}
              >
                {count > 0 ? `${chip} ${count}` : chip}
              </button>
            );
          })}
        </div>
      )}

      {athletes.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-400">No clients yet</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-neutral-500">No one in {filter}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((athlete) => (
            <AthleteRowItem key={athlete.id} athlete={athlete} onSelect={onSelectAthlete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveRosterSection;
