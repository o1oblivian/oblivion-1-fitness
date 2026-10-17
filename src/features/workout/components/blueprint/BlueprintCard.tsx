import React from 'react';
import { ChevronDown, ChevronUp, Clock, Dumbbell, Plus, Zap } from 'lucide-react';
import type { BlueprintExercise, WorkoutBlueprint } from '../../../../data/workoutBlueprints';
import { tactileEngine } from '../../../../services/tactileEngine';
import { BlueprintTier, TIER_DOT, TIER_LABEL, TIER_SUMMARY, tierMovements, tierSpecs } from '../../utils/blueprintTiers';

interface BlueprintCardProps {
  blueprint: WorkoutBlueprint;
  tier: BlueprintTier;
  isActive: boolean;
  isExpanded: boolean;
  onTierChange: (tier: BlueprintTier) => void;
  onToggleExpand: () => void;
  onLoad: () => void;
  onAddExercise: (exercise: BlueprintExercise) => void;
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({
  blueprint: bp,
  tier,
  isActive,
  isExpanded,
  onTierChange,
  onToggleExpand,
  onLoad,
  onAddExercise,
}) => {
  const movements = tierMovements(bp, tier);

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden bg-o1-card ${
        isActive ? 'border-o1-crimson/60 shadow-xs' : 'border-white/[0.07] hover:border-white/[0.14]'
      }`}
    >
      <div className="p-3 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-15 h-15 rounded-xl overflow-hidden shrink-0 bg-white/[0.08] relative">
            <img src={bp.image} alt={bp.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-1 left-1 right-1 text-[8px] font-medium text-white text-center truncate">{bp.badge}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-medium text-white truncate">{bp.title}</h4>
              {isActive && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-medium bg-o1-crimson/10 text-o1-crimson shrink-0">Active</span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 truncate mt-0.5">{bp.subtitle}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                {bp.estimatedTime}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-neutral-400" />
                {movements.length} Drills
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {bp.targetMuscles.slice(0, 4).map((muscle) => (
            <span key={muscle} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-o1-well text-neutral-400">
              {muscle}
            </span>
          ))}
          {bp.targetMuscles.length > 4 && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono text-neutral-400">+{bp.targetMuscles.length - 4}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <div className="relative shrink-0 w-36 sm:w-40 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-between px-3 transition-colors">
            <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[tier]}`} />
              <span className="text-[11px] font-mono font-medium text-neutral-200 truncate">{TIER_LABEL[tier]}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0 pointer-events-none" />
            <select
              value={tier}
              onChange={(e) => {
                tactileEngine.triggerLightTick();
                onTierChange(e.target.value as BlueprintTier);
              }}
              aria-label={`Experience level for ${bp.title}`}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            >
              {(Object.keys(TIER_LABEL) as BlueprintTier[]).map((t) => (
                <option key={t} value={t}>
                  {TIER_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onLoad}
            className="flex-1 h-8 px-3 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-[11px] font-medium tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span className="truncate">Load Blueprint</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              onToggleExpand();
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${bp.title} exercises` : `Preview ${bp.title} exercises`}
            className="h-8 w-8 shrink-0 rounded-full bg-o1-well hover:bg-white/[0.06] text-neutral-300 border border-white/[0.07] flex items-center justify-center transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/[0.05] bg-black p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1 px-0.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[tier]}`} />
              <span className="text-[10px] font-mono font-medium tracking-wider text-neutral-200">{TIER_LABEL[tier]} calibration</span>
            </div>
            <span className="text-[9px] font-mono text-neutral-500">{TIER_SUMMARY[tier]}</span>
          </div>

          <div className="text-[10px] text-neutral-400 leading-relaxed px-0.5">{bp.description}</div>

          <div className="space-y-1.5 pt-1">
            {movements.map((ex, idx) => {
              const specs = tierSpecs(ex, tier);
              return (
                <div key={ex.id} className="flex items-center justify-between p-2 rounded-xl bg-o1-card border border-white/[0.07]">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-o1-well text-[9px] font-mono font-medium text-neutral-400 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-white truncate">{ex.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-0.5 pl-5.5">
                      {specs.sets} Sets × {specs.reps}
                      {specs.weightKg > 0 ? ` • ${specs.weightKg}kg` : ''} • {ex.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddExercise(ex)}
                    aria-label={`Add ${ex.name} to active session`}
                    className="p-1.5 rounded-lg bg-o1-well hover:bg-o1-crimson hover:text-white text-neutral-300 transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


