import React from 'react';
import { Check, X } from 'lucide-react';
import { DayMeta, TelemetryCategory } from '../store/useTelemetryHistoryStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { getCategoryTheme } from './dayLog/categoryTheme';
import { CardioLogFields, useCardioLogForm } from './dayLog/cardioForm';
import { MeditationLogFields, useMeditationLogForm } from './dayLog/meditationForm';
import { NutritionLogFields, useNutritionLogForm } from './dayLog/nutritionForm';
import { SleepLogFields, useSleepLogForm } from './dayLog/sleepForm';
import { WorkoutLogFields, useWorkoutLogForm } from './dayLog/workoutForm';

interface LogDayTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: TelemetryCategory;
  dayMeta: DayMeta | null;
  onSaved?: (msg: string) => void;
  mode?: 'create' | 'edit';
  /** Workout edit shows only this lift; the rest of the day is saved unchanged. */
  focusLift?: string;
}

/**
 * Sheet for adding or editing one day of one kind of log. This shell owns the frame and the Save button;
 * each category's fields, state and saving live in ./dayLog/<category>Form.tsx.
 */
export const LogDayTelemetryModal: React.FC<LogDayTelemetryModalProps> = ({
  isOpen,
  onClose,
  category,
  dayMeta,
  onSaved,
  mode = 'create',
  focusLift,
}) => {
  const context = { isOpen, dayMeta, category, mode, onSaved };
  const workout = useWorkoutLogForm(context);
  const cardio = useCardioLogForm(context);
  const nutrition = useNutritionLogForm(context);
  const sleep = useSleepLogForm(context);
  const meditation = useMeditationLogForm(context);

  if (!isOpen || !dayMeta) return null;

  const forms = { workout, cardio, nutrition, sleep, meditation };

  const handleSave = () => {
    const outcome = forms[category].save();
    if (outcome === 'stay') return;
    if (outcome === 'done') tactileEngine.playPRCelebration();
    onClose();
  };

  const theme = getCategoryTheme(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim transition-opacity">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] shadow-xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-center">
              {theme.icon}
            </div>
            <div>
              <h3 className="font-tactical font-black text-xs tracking-wider text-white">
                {mode === 'edit' ? theme.title.replace('Log ', 'Edit ') : theme.title}
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                Date: <span className="text-white font-bold">{dayMeta.dayLabel}</span> · {dayMeta.dateFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          {category === 'workout' && <WorkoutLogFields form={workout} focusLift={focusLift} />}
          {category === 'cardio' && <CardioLogFields form={cardio} />}
          {category === 'nutrition' && <NutritionLogFields form={nutrition} />}
          {category === 'sleep' && <SleepLogFields form={sleep} />}
          {category === 'meditation' && <MeditationLogFields form={meditation} />}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.05] flex items-center gap-2.5 shrink-0 bg-o1-card">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-o1-well border border-white/[0.07] hover:bg-white/[0.06] text-neutral-300 font-bold text-xs tracking-wider transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
