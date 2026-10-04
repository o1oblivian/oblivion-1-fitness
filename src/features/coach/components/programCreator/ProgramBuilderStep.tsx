import React, { useState } from 'react';
import { Layers, Copy, Trash2, Plus, Sparkles, PlusCircle } from 'lucide-react';
import { ProgramFormData, ProgramExerciseItem } from './types';
import {
  generateO1FCBlueprint,
  getQuickAddExercises,
  getDisciplineSplitSchedule,
  ALL_DISCIPLINES,
} from './blueprintEngine';
import { ProgramExerciseRow } from './ProgramExerciseRow';
import { ProgramBlueprintControlBar } from './ProgramBlueprintControlBar';
import { tactileEngine } from '../../../../services/tactileEngine';

export const ProgramBuilderStep: React.FC<{
  data: ProgramFormData;
  onChange: (u: Partial<ProgramFormData>) => void;
}> = ({ data, onChange }) => {
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const [selectedMuscleTag, setSelectedMuscleTag] = useState<string>(() => {
    if (data.category && ALL_DISCIPLINES.some((d) => d.toLowerCase() === data.category.toLowerCase())) {
      return data.category;
    }
    return 'Push';
  });

  const currentWeek = data.weeks[activeWeekIdx] || data.weeks[0];
  const currentDay = currentWeek?.days[activeDayIdx] || currentWeek?.days[0];
  const totalDays = data.weeks.reduce((acc, w) => acc + w.days.length, 0);
  const totalExercises = data.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.exercises.length, 0),
    0
  );

  const updateCurrentDay = (exercises: ProgramExerciseItem[]) => {
    const updatedWeeks = [...data.weeks];
    if (updatedWeeks[activeWeekIdx]?.days[activeDayIdx]) {
      updatedWeeks[activeWeekIdx].days[activeDayIdx].exercises = exercises;
      onChange({ weeks: updatedWeeks });
    }
  };

  const handleApplyBlueprint = () => {
    tactileEngine.triggerImpactPulse();
    const generated = generateO1FCBlueprint(selectedMuscleTag);
    updateCurrentDay(generated);
  };

  const handleQuickAdd = (name: string) => {
    tactileEngine.triggerSelectionBuzz();
    const newEx: ProgramExerciseItem = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      sets: 3,
      reps: '8-12',
      restSeconds: 90,
      cue: 'Maintain disciplined form and tension throughout the range of motion.',
    };
    updateCurrentDay([...(currentDay?.exercises || []), newEx]);
  };

  const handleSyncSplit = () => {
    tactileEngine.triggerSelectionBuzz();
    const schedule = getDisciplineSplitSchedule(selectedMuscleTag, currentWeek.days.length);
    const updatedWeeks = [...data.weeks];
    updatedWeeks[activeWeekIdx].days = currentWeek.days.map((d, idx) => ({
      ...d,
      dayName: schedule[idx]?.dayName || d.dayName,
      splitFocus: schedule[idx]?.splitFocus || d.splitFocus,
    }));
    onChange({ weeks: updatedWeeks });
  };

  const handleAutoProgramWeek = () => {
    tactileEngine.triggerImpactPulse();
    const updatedWeeks = [...data.weeks];
    updatedWeeks[activeWeekIdx].days = currentWeek.days.map((d) => {
      const focus = d.splitFocus || selectedMuscleTag;
      return {
        ...d,
        exercises: generateO1FCBlueprint(focus),
      };
    });
    onChange({ weeks: updatedWeeks });
  };

  const quickAdds = getQuickAddExercises(selectedMuscleTag);

  return (
    <div className="space-y-4 text-neutral-900 dark:text-neutral-100 select-none">
      {/* Curriculum Summary Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Curriculum Builder
          </h3>
        </div>
        <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
          {data.weeks.length}w · {totalDays}d · {totalExercises} exercises
        </span>
      </div>

      {/* Week Selector Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Training Weeks
          </span>
          <div className="flex items-center gap-2 text-neutral-400">
            <button
              type="button"
              title="Duplicate current week"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                const newWeek = {
                  weekNumber: data.weeks.length + 1,
                  days: JSON.parse(JSON.stringify(currentWeek.days)),
                };
                onChange({ weeks: [...data.weeks, newWeek] });
              }}
              className="p-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {data.weeks.length > 1 && (
              <button
                type="button"
                title="Delete current week"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  const remaining = data.weeks.filter((_, idx) => idx !== activeWeekIdx);
                  onChange({ weeks: remaining });
                  setActiveWeekIdx(Math.max(0, activeWeekIdx - 1));
                }}
                className="p-1 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {data.weeks.map((w, idx) => {
            const isActive = activeWeekIdx === idx;
            const exCount = w.days.reduce((a, d) => a + d.exercises.length, 0);

            return (
              <button
                key={w.weekNumber}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveWeekIdx(idx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold'
                    : 'bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>Week {w.weekNumber}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'opacity-80' : 'text-neutral-400'}`}>
                  {exCount} ex
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              const nextNum = data.weeks.length + 1;
              onChange({
                weeks: [
                  ...data.weeks,
                  {
                    weekNumber: nextNum,
                    days: JSON.parse(JSON.stringify(data.weeks[0].days)),
                  },
                ],
              });
            }}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Week</span>
          </button>
        </div>
      </div>

      {/* Days Grid for active week */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {currentWeek?.days.map((d, idx) => {
          const isActive = activeDayIdx === idx;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveDayIdx(idx);
              }}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                isActive
                  ? 'bg-white dark:bg-[#18181B] border-neutral-900 dark:border-white shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/10'
                  : 'bg-white dark:bg-[#141416] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                  {d.dayName}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {d.exercises.length} ex
                </span>
              </div>
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {d.splitFocus || 'Rest'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Real-time O1FC Blueprint Discipline Control Bar */}
      <ProgramBlueprintControlBar
        category={data.category}
        selectedMuscleTag={selectedMuscleTag}
        quickAdds={quickAdds}
        onSelectTag={setSelectedMuscleTag}
        onApplyBlueprint={handleApplyBlueprint}
        onQuickAdd={handleQuickAdd}
        onSyncSplit={handleSyncSplit}
        onAutoProgramWeek={handleAutoProgramWeek}
      />

      {/* Current Day Exercise Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              {currentDay?.dayName} — {currentDay?.splitFocus}
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">
              {currentDay?.exercises.length || 0} exercises programmed
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleApplyBlueprint}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
              title="Apply real-time blueprint to this day"
            >
              <Sparkles className="w-3 h-3 text-[#C4121A]" />
              <span>Auto-Fill</span>
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                updateCurrentDay([
                  ...(currentDay?.exercises || []),
                  {
                    id: `ex-${Date.now()}`,
                    name: '',
                    sets: 3,
                    reps: '8-12',
                    restSeconds: 90,
                    cue: '',
                  },
                ]);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#C4121A] hover:bg-[#a80f16] active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exercise</span>
            </button>
          </div>
        </div>

        {/* List of programmed exercises */}
        {currentDay?.exercises.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2 bg-white/50 dark:bg-[#141416]/50">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              No exercises programmed for {currentDay?.dayName}
            </p>
            <p className="text-[11px] text-neutral-400">
              Design a custom movement stack or auto-fill with calibrated protocols.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleApplyBlueprint}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold transition-all cursor-pointer"
              >
                Auto-Fill Blueprint
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  updateCurrentDay([
                    {
                      id: `ex-${Date.now()}`,
                      name: '',
                      sets: 3,
                      reps: '8-12',
                      restSeconds: 90,
                      cue: '',
                    },
                  ]);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              >
                <PlusCircle size={13} />
                <span>Add Blank</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentDay?.exercises.map((ex, idx) => (
              <ProgramExerciseRow
                key={ex.id}
                index={idx}
                exercise={ex}
                onChange={(updated) => {
                  const updatedExercises = [...currentDay.exercises];
                  updatedExercises[idx] = { ...ex, ...updated };
                  updateCurrentDay(updatedExercises);
                }}
                onRemove={() => {
                  tactileEngine.triggerSelectionBuzz();
                  const remaining = currentDay.exercises.filter((_, i) => i !== idx);
                  updateCurrentDay(remaining);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ProgramBuilderStep;
