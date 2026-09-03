import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Check, Sparkles } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  schedule: Record<string, string>;
  onSave: (newSchedule: Record<string, string>) => void;
  onClose: () => void;
}

const PRESET_TEMPLATES: { label: string; schedule: Record<string, string> }[] = [
  {
    label: 'Push / Pull / Legs',
    schedule: { Mon: 'Push', Tue: 'Pull', Wed: 'Legs', Thu: 'Push', Fri: 'Pull', Sat: 'Legs', Sun: '' },
  },
  {
    label: 'Upper / Lower',
    schedule: { Mon: 'Upper', Tue: 'Lower', Wed: '', Thu: 'Upper', Fri: 'Lower', Sat: '', Sun: '' },
  },
  {
    label: 'Full Body 3x',
    schedule: { Mon: 'Full Body', Tue: '', Wed: 'Full Body', Thu: '', Fri: 'Full Body', Sat: '', Sun: '' },
  },
  {
    label: 'Bro Split',
    schedule: { Mon: 'Chest', Tue: 'Back', Wed: 'Shoulders', Thu: 'Arms', Fri: 'Legs', Sat: '', Sun: '' },
  },
  {
    label: 'Hybrid (Strength + Cardio)',
    schedule: { Mon: 'Strength', Tue: 'Cardio', Wed: 'Strength', Thu: 'Cardio', Fri: 'Strength', Sat: 'Active Recovery', Sun: '' },
  },
];

const ROUTINE_SUGGESTIONS = [
  'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back',
  'Shoulders', 'Arms', 'Core', 'Cardio', 'HIIT', 'Yoga', 'Run', 'Swim',
  'Boxing', 'MMA', 'Cycling', 'Conditioning', 'Active Recovery', 'Mobility',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  schedule,
  onSave,
  onClose,
}) => {
  const [localSchedule, setLocalSchedule] = useState<Record<string, string>>(schedule || {});
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSchedule(schedule || {});
      setEditingDay(null);
      setShowTemplates(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, schedule]);

  if (!isOpen) return null;

  const handleAssign = (day: string, routine: string) => {
    setLocalSchedule(prev => ({ ...prev, [day]: routine }));
    setEditingDay(null);
    setCustomInput('');
  };

  const handleClear = (day: string) => {
    setLocalSchedule(prev => ({ ...prev, [day]: '' }));
    setEditingDay(null);
  };

  const applyTemplate = (tpl: typeof PRESET_TEMPLATES[number]) => {
    setLocalSchedule(tpl.schedule);
    setShowTemplates(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-sans animate-fade-in" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-black/5 dark:border-white/10 shrink-0">
          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2 font-mono">
            <Calendar className="w-4 h-4 text-red-500" /> My Weekly Split
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Template Picker Toggle */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono font-bold uppercase tracking-wider hover:bg-red-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showTemplates ? 'Hide Templates' : 'Start From a Template'}
          </button>

          {/* Templates */}
          {showTemplates && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {PRESET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">{tpl.label}</span>
                  <span className="block text-[10px] font-mono text-gray-400 dark:text-white/40 mt-0.5">
                    {DAYS.map(d => tpl.schedule[d] || 'Rest').join(' / ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Day Cards */}
          <div className="space-y-2">
            {DAYS.map((day) => {
              const assigned = localSchedule[day] || '';
              const isEditing = editingDay === day;

              return (
                <div key={day} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
                  <button
                    onClick={() => { setEditingDay(isEditing ? null : day); setCustomInput(assigned); }}
                    className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono font-black text-gray-400 dark:text-white/50 uppercase w-8">{day}</span>
                      <span className={`text-sm font-mono font-bold ${assigned ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-white/30'}`}>
                        {assigned || 'Tap to assign'}
                      </span>
                    </div>
                    {assigned && (
                      <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-red-500" />
                      </span>
                    )}
                  </button>

                  {isEditing && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Custom Input */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && customInput.trim()) handleAssign(day, customInput.trim()); }}
                          placeholder={`Custom name for ${DAY_LABELS[day]}...`}
                          className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-red-500"
                          autoFocus
                        />
                        <button
                          onClick={() => { if (customInput.trim()) handleAssign(day, customInput.trim()); }}
                          disabled={!customInput.trim()}
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold disabled:opacity-30 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="flex flex-wrap gap-1.5">
                        {ROUTINE_SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleAssign(day, s)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-mono font-bold text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Clear Button */}
                      {assigned && (
                        <button
                          onClick={() => handleClear(day)}
                          className="mt-2 text-[10px] font-mono text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          Clear assignment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Footer Button */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 shrink-0 bg-gray-50/50 dark:bg-black/20">
          <button
            onClick={() => { onSave(localSchedule); onClose(); }}
            className="w-full py-3 bg-[#C4121A] hover:bg-[#D91F28] text-white rounded-xl font-mono font-bold shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Save Weekly Split
          </button>
        </div>
      </div>
    </div>
  );
};
