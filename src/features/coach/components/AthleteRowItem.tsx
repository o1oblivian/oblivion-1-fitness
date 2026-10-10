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
      className="p-2.5 rounded-2xl bg-o1-card border border-white/[0.07] hover:border-white/[0.14] flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-black border border-white/[0.07] flex items-center justify-center font-bold text-xs text-neutral-300">
          {athlete.avatar ? (
            <img src={athlete.avatar} alt={athlete.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            athlete.name.charAt(0)
          )}
        </div>
        <div>
          <div className="font-bold text-xs text-white flex items-center gap-1.5">
            <span>{athlete.name}</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">{athlete.handle}</span>
          </div>
          <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-o1-crimson" />
              {athlete.volume ? `${(athlete.volume / 1000).toFixed(1)}k kg` : '--'}
            </span>
            <span>•</span>
            <span>{athlete.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="px-2 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
          <Activity className="w-3 h-3" />
          <span>{athlete.readiness ? `${athlete.readiness}%` : '--'}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500" />
      </div>
    </div>
  );
};
