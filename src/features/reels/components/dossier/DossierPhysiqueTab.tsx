import React from 'react';
import { Play } from 'lucide-react';
import { ExploreCoach, ExploreReelItem } from '../../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../../services/tactileEngine';

interface DossierPhysiqueTabProps {
  coach: ExploreCoach;
  displayReels: ExploreReelItem[];
  onSelectReel?: (reel: ExploreReelItem) => void;
  onShowToast: (msg: string) => void;
}

export const DossierPhysiqueTab: React.FC<DossierPhysiqueTabProps> = ({
  coach,
  displayReels,
  onSelectReel,
  onShowToast,
}) => {
  return (
    <div className="space-y-4 pt-2">
      {/* Frameless Physique Metrics Strip (Small fonts) */}
      {coach.physiqueStats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Verified Physique</span>
            <span className="text-emerald-400">In-Season</span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-white/5">
            <div className="text-center">
              <span className="text-[9px] text-neutral-500 block">Height</span>
              <span className="text-[11px] font-mono text-white/90 font-medium">
                {coach.physiqueStats.height || '185 cm'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-neutral-500 block">Weight</span>
              <span className="text-[11px] font-mono text-white/90 font-medium">
                {coach.physiqueStats.weight || '94 kg'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-neutral-500 block">Body Fat</span>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                {coach.physiqueStats.bodyFatEst || '7.2%'}
              </span>
            </div>
          </div>

          {coach.physiqueStats.competitionLifts && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
              {coach.physiqueStats.competitionLifts.map((lift: any) => (
                <div key={lift.label} className="flex items-center justify-between py-0.5 text-[10.5px]">
                  <span className="text-neutral-400">{lift.label}</span>
                  <span className="font-mono text-amber-400/90">{lift.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movement Reels (Small fonts, clean hairline list) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>Biomechanics Reels</span>
          <span>{displayReels.length} Reels</span>
        </div>

        <div className="divide-y divide-white/5">
          {displayReels.map((reel) => (
            <div
              key={reel.id}
              onClick={() => {
                tactileEngine.triggerLightTick();
                if (onSelectReel) onSelectReel(reel);
                else onShowToast(`Playing ${reel.title}`);
              }}
              className="py-2 flex items-center gap-3 cursor-pointer group hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <div className="w-10 h-12 rounded-md overflow-hidden relative shrink-0 bg-neutral-900">
                <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="text-[11px] font-medium text-white truncate group-hover:text-red-400 transition-colors">
                  {reel.title}
                </h4>
                <p className="text-[10px] text-neutral-400 line-clamp-1 font-sans">
                  {reel.cues || 'Kinematic flare & mechanical tension'}
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500">
                  <span>{reel.views} Views</span>
                  <span>•</span>
                  <span className="text-emerald-400">{reel.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
