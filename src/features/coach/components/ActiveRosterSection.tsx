import React, { useState } from 'react';
import { Users, Copy, Check, Plus, UserPlus } from 'lucide-react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';
import { AddClientModal } from './AddClientModal';
import { AthleteRowItem } from './AthleteRowItem';

export type RosterFilter = 'All' | 'Active' | 'Inactive' | 'Check-in' | 'Need Routine';
const ROSTER_FILTERS: RosterFilter[] = ['All', 'Active', 'Inactive', 'Check-in', 'Need Routine'];
const STORAGE_COACH_CLIENTS = 'o1fc_custom_coach_clients';

export interface ActiveRosterSectionProps {
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
}

export const ActiveRosterSection: React.FC<ActiveRosterSectionProps> = ({
  athletes: initialAthletes,
  onSelectAthlete,
}) => {
  const [filter, setFilter] = useState<RosterFilter>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [customAthletes, setCustomAthletes] = useState<Athlete[]>(() => {
    return safeStorage.getItem<Athlete[]>(STORAGE_COACH_CLIENTS, []) || [];
  });

  const allAthletes = [...customAthletes, ...initialAthletes];
  const filtered = allAthletes.filter((a) => (filter === 'All' ? true : a.status === filter));

  const handleCopyInvite = () => {
    tactileEngine.triggerSelectionBuzz();
    if (navigator?.clipboard) navigator.clipboard.writeText('https://oblivion1.club/join?coach=coach_alpha');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddClient = (newAth: Athlete) => {
    const nextCustom = [newAth, ...customAthletes];
    setCustomAthletes(nextCustom);
    safeStorage.setItem(STORAGE_COACH_CLIENTS, nextCustom);
  };

  return (
    <div className="space-y-3.5 select-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {ROSTER_FILTERS.map((chip) => {
            const count = chip === 'All' ? allAthletes.length : allAthletes.filter((a) => a.status === chip).length;
            const isActive = filter === chip;
            return (
              <button
                key={chip}
                onClick={() => { tactileEngine.triggerSelectionBuzz(); setFilter(chip); }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono tracking-tight uppercase whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#C4121A] text-white border-[#C4121A] shadow-xs'
                    : 'bg-white dark:bg-[#121214] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-neutral-200 dark:border-neutral-800 shadow-xs'
                }`}
              >
                {chip} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsAddClientOpen(true); }}
          className="px-2.5 py-1 rounded-xl bg-[#C4121A] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-[#A30F16] active:scale-95 transition shrink-0 shadow-xs"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-tactical font-semibold uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
          Connected Athletes ({filtered.length})
        </span>
        <span className="text-[10px] font-tactical font-medium text-neutral-500 dark:text-neutral-400">
          Direct Sync Active
        </span>
      </div>

      {allAthletes.length === 0 ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121214] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-3 shadow-sm">
          <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-tactical uppercase tracking-wider">
              NO CLIENTS CONNECTED YET
            </h4>
            <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
              Connect and manage athletes in your unified coaching roster.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsAddClientOpen(true); }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#C4121A] text-white text-xs font-bold font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-xs hover:bg-[#A30F16]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-bold font-tactical uppercase tracking-wider flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ath) => (
            <AthleteRowItem key={ath.id} athlete={ath} onSelect={onSelectAthlete} />
          ))}
        </div>
      )}

      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
      />
    </div>
  );
};

export default ActiveRosterSection;
