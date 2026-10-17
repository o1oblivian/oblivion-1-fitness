import React, { useState } from 'react';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import {
  WORKOUT_BLUEPRINTS,
  WorkoutBlueprint,
  BlueprintExercise,
} from '../../../data/workoutBlueprints';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { calibrateTemplate } from '../utils/calibrateLoads';
import {
  BLUEPRINT_TAGS,
  BlueprintTier,
  blueprintExerciseToItem,
  blueprintMatchesTag,
  tierMovements,
} from '../utils/blueprintTiers';
import { BlueprintCard } from './blueprint/BlueprintCard';
import { BlueprintSwapper } from './blueprint/BlueprintSwapper';

interface BlueprintModeViewProps {
  onLoaded?: () => void;
}

export const BlueprintModeView: React.FC<BlueprintModeViewProps> = ({ onLoaded }) => {
  const [selectedTag, setSelectedTag] = useState<string>('HYPERTROPHY');
  const [expandedBlueprintId, setExpandedBlueprintId] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, BlueprintTier>>({});
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [showSwapper, setShowSwapper] = useState(false);

  const addExercisesToActiveLog = useWorkoutStore((s) => s.addExercisesToActiveLog);
  const addExerciseToActiveLog = useWorkoutStore((s) => s.addExerciseToActiveLog);
  const setActiveRoutine = useWorkoutStore((s) => s.setActiveRoutine);
  const activeRoutine = useWorkoutStore((s) => s.activeRoutine);
  const hasExercises = useWorkoutStore((s) => s.exercises.length > 0);

  const filteredBlueprints = WORKOUT_BLUEPRINTS.filter((bp) =>
    blueprintMatchesTag(bp, selectedTag),
  );
  const tierFor = (id: string): BlueprintTier => selectedTiers[id] || 'INTERMEDIATE';

  const handleLoadBlueprint = (blueprint: WorkoutBlueprint, tier: BlueprintTier) => {
    tactileEngine.playPRCelebration();
    const items = tierMovements(blueprint, tier).map((be) =>
      blueprintExerciseToItem(be, blueprint.id, tier),
    );
    addExercisesToActiveLog(calibrateTemplate(items));
    setActiveRoutine(`${blueprint.title} (${tier})`);
    onLoaded?.();
  };

  const handleAddSingleExercise = (
    be: BlueprintExercise,
    blueprintId: string,
    tier: BlueprintTier,
  ) => {
    tactileEngine.triggerSelectionBuzz();
    addExerciseToActiveLog(blueprintExerciseToItem(be, blueprintId, tier));
    onLoaded?.();
  };

  return (
    <div className="space-y-3 pt-1 select-none font-sans">
      <div className="flex items-center justify-between px-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              setIsStyleOpen((v) => !v);
            }}
            aria-expanded={isStyleOpen}
            className="h-8 px-3 rounded-full bg-black border border-white/[0.07] text-xs font-semibold text-neutral-200 flex items-center gap-1.5 cursor-pointer"
          >
            {selectedTag}
            <span className="text-neutral-400 font-medium">{filteredBlueprints.length}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          {isStyleOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] bg-o1-card border border-white/[0.07] shadow-lg rounded-2xl p-1">
              {BLUEPRINT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerLightTick();
                    setSelectedTag(tag);
                    setIsStyleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-o1-well font-semibold text-white'
                      : 'text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        {hasExercises && (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerLightTick();
              setShowSwapper((prev) => !prev);
            }}
            aria-expanded={showSwapper}
            className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>{showSwapper ? 'Hide Swapper' : 'Exercise Swapper'}</span>
          </button>
        )}
      </div>

      {showSwapper && hasExercises && <BlueprintSwapper />}

      <div className="space-y-3">
        {filteredBlueprints.map((bp) => {
          const tier = tierFor(bp.id);
          const isExpanded = expandedBlueprintId === bp.id;
          return (
            <BlueprintCard
              key={bp.id}
              blueprint={bp}
              tier={tier}
              isActive={activeRoutine.startsWith(bp.title)}
              isExpanded={isExpanded}
              onTierChange={(next) => setSelectedTiers((prev) => ({ ...prev, [bp.id]: next }))}
              onToggleExpand={() => setExpandedBlueprintId(isExpanded ? null : bp.id)}
              onLoad={() => handleLoadBlueprint(bp, tier)}
              onAddExercise={(ex) => handleAddSingleExercise(ex, bp.id, tier)}
            />
          );
        })}
      </div>
    </div>
  );
};
