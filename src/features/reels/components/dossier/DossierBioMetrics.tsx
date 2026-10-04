import React from 'react';
import { Star } from 'lucide-react';
import { ExploreCoach } from '../../../../data/reelsExploreCatalog';

interface DossierBioMetricsProps {
  coach: ExploreCoach;
}

export const DossierBioMetrics: React.FC<DossierBioMetricsProps> = ({ coach }) => {
  return (
    <div className="space-y-3 pt-1">
      {/* Coach Name & Single Non-Repetitive Subtitle (Small Fonts, Editorial) */}
      <div className="space-y-0.5">
        <h1 className="text-base sm:text-lg font-sans font-bold text-white tracking-tight">
          {coach.name}
        </h1>
        <p className="text-[11px] text-neutral-300 font-sans">
          {coach.specialtyTitle || 'Kinetic & Movement Specialist'}
        </p>
        <p className="text-[10px] text-neutral-500 font-mono">
          {coach.handle}
        </p>
      </div>

      {/* Lightweight, Open Stat Strip (Small font, no boxes, hairline dividers) */}
      <div className="grid grid-cols-4 py-1.5 border-y border-white/5 divide-x divide-white/5 text-center">
        <div className="px-1">
          <span className="font-mono text-xs font-semibold text-emerald-400 block">
            98.4%
          </span>
          <span className="text-[8.5px] font-sans text-neutral-400 block">
            Success
          </span>
        </div>
        <div className="px-1">
          <span className="font-mono text-xs font-semibold text-white/90 block">
            +14.2kg
          </span>
          <span className="text-[8.5px] font-sans text-neutral-400 block">
            PR Gain
          </span>
        </div>
        <div className="px-1">
          <span className="font-mono text-xs font-semibold text-white/90 block">
            12+ Yrs
          </span>
          <span className="text-[8.5px] font-sans text-neutral-400 block">
            Tenure
          </span>
        </div>
        <div className="px-1">
          <span className="font-mono text-xs font-semibold text-amber-400/90 flex items-center justify-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{coach.rating.toFixed(2)}</span>
          </span>
          <span className="text-[8.5px] font-sans text-neutral-400 block">
            {coach.reviewCount} Audits
          </span>
        </div>
      </div>

      {/* Soft Bio with generous breathing room */}
      <div className="text-[11px] text-neutral-400 leading-relaxed font-sans">
        <p>{coach.bio}</p>
      </div>
    </div>
  );
};
