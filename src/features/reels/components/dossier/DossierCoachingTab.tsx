import React from 'react';
import { Check } from 'lucide-react';
import { ExploreCoach } from '../../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../../services/tactileEngine';

interface DossierCoachingTabProps {
  coach: ExploreCoach;
  onApply: () => void;
}

export const DossierCoachingTab: React.FC<DossierCoachingTabProps> = ({ coach, onApply }) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-white/80 font-medium">Monthly 1:1 Co-Pilot</span>
          <span className="text-amber-400/90">{coach.slotsRemaining ?? 2} slots open</span>
        </div>
        <p className="text-[10.5px] text-neutral-400 leading-relaxed">
          Direct, individualized programming with private weekly video form audits and real-time adjustments.
        </p>
      </div>

      <div className="space-y-1.5 py-2 border-y border-white/5 text-[10.5px] text-neutral-300">
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[2]" />
          <span>Personalized mesocycles synced to Workout tab</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[2]" />
          <span>Biomechanical video audits on lifts & movement</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[2]" />
          <span>Priority encrypted chat access (24hr SLA)</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[2]" />
          <span>Fuel macro prescription & recovery autoregulation</span>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerLightTick();
            onApply();
          }}
          className="w-full py-2 px-3 rounded-lg bg-[#C4121A] hover:bg-[#a30f16] active:scale-98 text-white text-[11px] font-medium tracking-wide transition cursor-pointer text-center"
        >
          Apply for 1:1 Coaching ({coach.rate})
        </button>
      </div>
    </div>
  );
};
