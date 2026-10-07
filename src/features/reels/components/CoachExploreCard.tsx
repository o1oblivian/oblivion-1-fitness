import React from 'react';
import { Check, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { ExploreCoach } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

interface CoachExploreCardProps {
  coach: ExploreCoach;
  isFollowing: boolean;
  onToggleFollow: (coachId: string, e?: React.MouseEvent) => void;
  onBookCoach: (coach: ExploreCoach) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
}

export const CoachExploreCard: React.FC<CoachExploreCardProps> = ({
  coach,
  onBookCoach,
  onMessageCoach,
}) => {
  const handleCardClick = () => {
    tactileEngine.triggerSelectionBuzz();
    onBookCoach(coach);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-o1-card hover:bg-o1-well border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm select-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-13 h-13 rounded-2xl overflow-hidden border border-white/[0.07] bg-o1-well group-hover:border-o1-crimson/60 transition-colors">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0EA5E9] border-2 border-white/[0.07] flex items-center justify-center text-black shadow-xs">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <h3 className="text-sm sm:text-base font-tactical font-black text-white truncate tracking-tight group-hover:text-o1-crimson transition-colors">
              {coach?.name ?? 'Verified Coach'}
            </h3>
            <span className="text-xs font-sans text-neutral-400 truncate">
              {coach?.specialtyTitle ?? coach?.specialty ?? 'Club Coach'}
            </span>
            <span className="text-[10px] font-sans font-bold text-o1-crimson mt-0.5 tracking-wide uppercase">
              {coach?.certificationPill ?? 'VERIFIED COACH'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded bg-o1-well border border-white/[0.07] text-xs font-bold text-amber-300 shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{(coach?.rating ?? 5.0).toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-neutral-300/80 leading-relaxed mt-2.5 font-sans line-clamp-2">
        {coach?.bio ?? ''}
      </p>

      <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-tactical font-bold text-emerald-400 uppercase tracking-wider">
            Verified Credentials
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              onMessageCoach(coach);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.07] text-neutral-400 hover:text-white transition cursor-pointer"
            title={`Message ${coach.name}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCardClick}
            className="px-3 py-1.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
