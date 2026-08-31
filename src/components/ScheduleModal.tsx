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
    <div className="fixed inset-0 z-[150] bg-[#FFFFFF] dark:bg-[#0A0A0C] overflow-y-auto font-sans">
      <div className="min-h-screen p-4 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2 font-mono">
            <Calendar className="w-4 h-4 text-cyan-400" /> My Weekly Split
          </h3>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Picker Toggle */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-cyan-600/30 dark:border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {showTemplates ? 'Hide Templates' : 'Start From a Template'}
        </button>

        {/* Templates */}
        {showTemplates && (
          <div className="mb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
              <div key={day} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => { setEditingDay(isEditing ? null : day); setCustomInput(assigned); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-black text-gray-400 dark:text-white/50 uppercase w-8">{day}</span>
                    <span className={`text-sm font-mono font-bold ${assigned ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-white/30'}`}>
                      {assigned || 'Tap to assign'}
                    </span>
                  </div>
                  {assigned && (
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-cyan-400" />
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
                        className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-cyan-500/50"
                        autoFocus
                      />
                      <button
                        onClick={() => { if (customInput.trim()) handleAssign(day, customInput.trim()); }}
                        disabled={!customInput.trim()}
                        className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold disabled:opacity-30 hover:bg-cyan-500/30 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
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
                        className="mt-2 text-[10px] font-mono text-red-400/70 hover:text-red-400 transition-colors cursor-pointer"
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

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/95 dark:from-[#0A0A0C] dark:via-[#0A0A0C]/95 to-transparent">
          <button
            onClick={() => { onSave(localSchedule); onClose(); }}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black rounded-2xl font-mono font-bold shadow-lg shadow-cyan-500/20 active:scale-[0.97] transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Save Weekly Split
          </button>
        </div>
      </div>
    </div>
  );
};
