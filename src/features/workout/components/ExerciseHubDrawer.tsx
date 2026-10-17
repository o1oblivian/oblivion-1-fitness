import React, { useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem } from '../../../types';
import { DisciplineType } from '../../../types/workout';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ManualModeView } from './ManualModeView';
import { BlueprintModeView } from './BlueprintModeView';
import { DisciplineSelectorTrack } from './hub/DisciplineSelectorTrack';
import { HubSubModeTabs } from './hub/HubSubModeTabs';
import { AutoModeFiltersRow } from './hub/AutoModeFiltersRow';
import { AutoModeRoutineList } from './hub/AutoModeRoutineList';
import { AutoModeFooter } from './hub/AutoModeFooter';
import { useExerciseHubAutoLogic } from '../hooks/useExerciseHubAutoLogic';

export interface ExerciseHubDrawerProps {
  isOpen?: boolean;
  selectedDiscipline?: 'lift' | 'sports' | 'recovery' | null;
  onSelectDiscipline?: (discipline: 'lift' | 'sports' | 'recovery' | null) => void;
  onToggle?: () => void;
  onAddExercise?: (exercise: ExerciseItem) => void;
  onAddBatch?: (exercises: ExerciseItem[]) => void;
}

export const ExerciseHubDrawer: React.FC<ExerciseHubDrawerProps> = ({
  selectedDiscipline: propSelectedDiscipline,
  onSelectDiscipline,
  onAddExercise,
  onAddBatch,
}) => {
  const addExerciseToActiveLog = useWorkoutStore((s) => s.addExerciseToActiveLog);
  const addExercisesToActiveLog = useWorkoutStore((s) => s.addExercisesToActiveLog);

  const [internalDiscipline, setInternalDiscipline] = useState<
    'lift' | 'sports' | 'recovery' | null
  >(null);
  const selectedDiscipline =
    propSelectedDiscipline !== undefined ? propSelectedDiscipline : internalDiscipline;
  const isExpanded = selectedDiscipline !== null;
  const discipline: DisciplineType = selectedDiscipline || 'lift';

  const [activeSubTab, setActiveSubTab] = useState<'auto' | 'manual' | 'blueprint'>('auto');

  // Auto-collapse Exercise Hub & bring Active Log smoothly into view
  const handleAutoCollapse = () => {
    if (onSelectDiscipline) {
      onSelectDiscipline(null);
    } else {
      setInternalDiscipline(null);
    }
    setTimeout(() => {
      const el = document.getElementById('active-log-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handlePillClick = (d: 'lift' | 'sports' | 'recovery') => {
    tactileEngine.triggerSelectionBuzz();
    const nextDiscipline = selectedDiscipline === d ? null : d;
    if (onSelectDiscipline) {
      onSelectDiscipline(nextDiscipline);
    } else {
      setInternalDiscipline(nextDiscipline);
    }
  };

  const autoLogic = useExerciseHubAutoLogic({
    discipline,
    selectedDiscipline,
    onAddBatch,
    addExercisesToActiveLog,
  });

  return (
    <div className="relative my-2">
      <div
        id="exercise-hub-drawer"
        className={`select-none relative transition-colors ${
          isExpanded
            ? 'bg-o1-card border border-white/[0.07] rounded-2xl p-1.5 sm:p-2 shadow-xl'
            : ''
        }`}
      >
        {/* 1. Discipline Selector Track (Always Visible & Tightened) */}
        <DisciplineSelectorTrack
          selectedDiscipline={selectedDiscipline}
          onPillClick={handlePillClick}
        />

        {/* 2. Expandable Catalog Body */}
        {isExpanded && (
          <div
            id="exercise-hub-drawer-content"
            className="mt-3 pt-1 animate-in fade-in duration-200"
          >
            {/* Click-away backdrop for open popovers */}
            {(autoLogic.isEquipOpen ||
              autoLogic.isVolOpen ||
              autoLogic.activeSetsSlot !== null) && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => {
                  autoLogic.setIsEquipOpen(false);
                  autoLogic.setIsVolOpen(false);
                  autoLogic.setActiveSetsSlot(null);
                }}
              />
            )}

            {/* Sub-Mode Segmented Track */}
            <HubSubModeTabs activeSubTab={activeSubTab} onChangeTab={setActiveSubTab} />

            {/* Sub-Mode Content */}
            {activeSubTab === 'auto' && (
              <>
                <AutoModeFiltersRow
                  selectedCategory={autoLogic.selectedCategory}
                  onSelectCategory={(cat) => {
                    autoLogic.setSelectedCategory(cat);
                    autoLogic.setSlotOverrides({});
                  }}
                  currentChips={autoLogic.currentChips}
                  selectedEquipment={autoLogic.selectedEquipment}
                  onSelectEquipment={(eq) => {
                    autoLogic.setSelectedEquipment(eq);
                    autoLogic.setSlotOverrides({});
                  }}
                  targetVolume={autoLogic.targetVolume}
                  onSelectTargetVolume={autoLogic.setTargetVolume}
                  isChangeOpen={autoLogic.isChangeOpen}
                  setIsChangeOpen={autoLogic.setIsChangeOpen}
                  isEquipOpen={autoLogic.isEquipOpen}
                  setIsEquipOpen={autoLogic.setIsEquipOpen}
                  isVolOpen={autoLogic.isVolOpen}
                  setIsVolOpen={autoLogic.setIsVolOpen}
                />

                <AutoModeRoutineList
                  routineItems={autoLogic.routineItems}
                  slotSets={autoLogic.slotSets}
                  activeSetsSlot={autoLogic.activeSetsSlot}
                  setActiveSetsSlot={autoLogic.setActiveSetsSlot}
                  onSetSets={(idx, num) =>
                    autoLogic.setSlotSets((prev) => ({ ...prev, [idx]: num }))
                  }
                  onSwapSlot={autoLogic.handleSwapSlot}
                />

                <AutoModeFooter
                  totalMins={autoLogic.totalMins}
                  totalKcal={autoLogic.totalKcal}
                  exerciseCount={autoLogic.exerciseCount}
                  totalSets={autoLogic.totalSets}
                  onAddExercises={() => {
                    autoLogic.handleAddExercises();
                    handleAutoCollapse();
                  }}
                />
              </>
            )}

            {activeSubTab === 'manual' && (
              <ManualModeView
                discipline={discipline}
                onAddExercise={(exercise) => {
                  if (onAddExercise) onAddExercise(exercise);
                  else addExerciseToActiveLog(exercise);
                  handleAutoCollapse();
                }}
              />
            )}

            {(activeSubTab === 'blueprint' || (activeSubTab as string) === 'swapper') && (
              <BlueprintModeView onLoaded={handleAutoCollapse} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
