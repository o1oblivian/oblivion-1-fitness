import React from 'react';
import { Activity, Flame, ChevronRight } from 'lucide-react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';

interface AthleteRowItemProps {
  athlete: Athlete;
  onSelect: (athlete: Athlete) => void;
}

export const AthleteRowItem: React.FC<AthleteRowItemProps> = ({ athlete, onSelect }) => {
  return (
    <div
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onSelect(athlete);
      }}
      className="p-3 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#09090b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-800 dark:text-neutral-300">
          {athlete.avatar ? (
            <img src={athlete.avatar} alt={athlete.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            athlete.name.charAt(0)
          )}
        </div>
        <div>
          <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>{athlete.name}</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">{athlete.handle}</span>
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#C4121A]" />
              {(athlete.volume / 1000).toFixed(1)}k kg
            </span>
            <span>•</span>
            <span>{athlete.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20">
          <Activity className="w-3 h-3" />
          <span>{athlete.readiness}%</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
      </div>
    </div>
  );
};
