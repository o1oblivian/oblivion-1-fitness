import React, { useState } from 'react';
import { X, Plus, Trash2, Send, Dumbbell, Loader2, GripVertical } from 'lucide-react';
import { sendWorkoutToPartner, TandemWorkoutExercise } from '@/utils/tandemStore';
import { EXERCISE_DATABASE } from '@/data/exerciseDatabase';

interface TandemSendWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairId: string;
  receiverId: string;
  theme: 'dark' | 'light' | 'system';
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onSent: () => void;
}

const QUICK_TEMPLATES = [
  { label: 'Push Day', exercises: [
    { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s' },
    { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '90s' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '60s' },
    { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '60s' },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '60s' },
  ]},
  { label: 'Pull Day', exercises: [
    { name: 'Deadlift', sets: 4, reps: '5', rest: '120s' },
    { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '90s' },
    { name: 'Pull-Ups', sets: 3, reps: '8-12', rest: '90s' },
    { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60s' },
    { name: 'Barbell Curl', sets: 3, reps: '10-12', rest: '60s' },
  ]},
  { label: 'Leg Day', exercises: [
    { name: 'Barbell Squat', sets: 4, reps: '6-8', rest: '120s' },
    { name: 'Romanian Deadlift', sets: 3, reps: '10-12', rest: '90s' },
    { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s' },
    { name: 'Walking Lunges', sets: 3, reps: '12/leg', rest: '60s' },
    { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '45s' },
  ]},
  { label: 'Full Body', exercises: [
    { name: 'Barbell Squat', sets: 3, reps: '8', rest: '120s' },
    { name: 'Barbell Bench Press', sets: 3, reps: '8', rest: '90s' },
    { name: 'Barbell Row', sets: 3, reps: '8', rest: '90s' },
    { name: 'Overhead Press', sets: 3, reps: '10', rest: '60s' },
    { name: 'Barbell Curl', sets: 2, reps: '12', rest: '60s' },
  ]},
];

export const TandemSendWorkoutModal: React.FC<TandemSendWorkoutModalProps> = ({
  isOpen, onClose, pairId, receiverId, theme, showToast, onSent,
}) => {
  const isLight = theme === 'light';
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<TandemWorkoutExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-500' : 'text-white/50';
  const inputBg = isLight ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white/5 border-white/10 text-white';
  const cardBg = isLight ? 'bg-white' : 'bg-[#1a1a1a]';

  if (!isOpen) return null;

  const addExercise = (name: string) => {
    setExercises(prev => [...prev, { name, sets: 3, reps: '10', rest: '60s' }]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof TandemWorkoutExercise, value: string | number) => {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };

  const loadTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(tpl.label);
    setExercises(tpl.exercises);
  };

  const handleSend = async () => {
    if (!title || exercises.length === 0) {
      showToast('Add a title and at least one exercise', 'error');
      return;
    }
    setSending(true);
    const result = await sendWorkoutToPartner(pairId, receiverId, title, exercises, notes || undefined);
    if (result) {
      showToast('Workout sent to your partner!', 'success');
      onSent();
    } else {
      showToast('Failed to send workout', 'error');
    }
    setSending(false);
  };

  const allExercises = Object.values(EXERCISE_DATABASE).flat();
  const filteredExercises = searchQuery
    ? allExercises.filter(e => e.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 15)
    : allExercises.slice(0, 15);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className={`w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0.5rem)+1rem)] ${cardBg}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 px-4 sm:px-5 pt-4 pb-3 border-b border-white/5" style={{ backgroundColor: isLight ? '#fff' : '#1a1a1a' }}>
          <div className="flex items-center justify-between">
            <h3 className={`text-base sm:text-lg font-bold ${textPrimary}`}>
              <Send className="w-4 h-4 inline mr-2 -mt-0.5 text-red-400" />
              Build Workout
            </h3>
            <button onClick={onClose} className="p-1"><X className={`w-5 h-5 ${textSecondary}`} /></button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Quick Templates */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${textSecondary}`}>Quick Start</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_TEMPLATES.map(tpl => (
                <button
                  key={tpl.label}
                  onClick={() => loadTemplate(tpl)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                    isLight ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'border-white/10 text-white/70 hover:bg-white/5'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Workout title..."
            className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none ${inputBg}`}
          />

          {/* Exercise List */}
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={idx} className={`rounded-xl border p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className={`w-3.5 h-3.5 ${textSecondary}`} />
                    <span className={`text-sm font-semibold ${textPrimary}`}>{ex.name}</span>
                  </div>
                  <button onClick={() => removeExercise(idx)} className="p-1">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={`text-[10px] ${textSecondary}`}>Sets</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center outline-none ${inputBg}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`text-[10px] ${textSecondary}`}>Reps</label>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={e => updateExercise(idx, 'reps', e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center outline-none ${inputBg}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`text-[10px] ${textSecondary}`}>Rest</label>
                    <input
                      type="text"
                      value={ex.rest}
                      onChange={e => updateExercise(idx, 'rest', e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center outline-none ${inputBg}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise */}
          {!showExercisePicker ? (
            <button
              onClick={() => setShowExercisePicker(true)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition ${
                isLight ? 'border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600' : 'border-white/10 text-white/40 hover:border-red-400 hover:text-red-400'
              }`}
            >
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          ) : (
            <div className={`rounded-xl border p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.06]'}`}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                autoFocus
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none mb-2 ${inputBg}`}
              />
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredExercises.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => addExercise(ex)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isLight ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/5 text-white/70'
                    }`}
                  >
                    <Dumbbell className="w-3 h-3 inline mr-2 text-red-400" />
                    {ex}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowExercisePicker(false); setSearchQuery(''); }} className={`w-full text-center text-xs mt-2 ${textSecondary}`}>
                Cancel
              </button>
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes or tips for your partner (optional)..."
            rows={2}
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none ${inputBg}`}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={sending || !title || exercises.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-cyan-500 shadow-lg shadow-red-500/20 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send to Partner
          </button>
        </div>
      </div>
    </div>
  );
};
