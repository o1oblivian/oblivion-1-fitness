import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Plus, Trash2, Clock, X, Check, Dumbbell, Utensils, Droplets, Pill, Scale, Pencil } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

export interface Reminder {
  id: string;
  user_email: string;
  type: 'workout' | 'meal' | 'hydration' | 'supplement' | 'weigh_in' | 'custom';
  title: string;
  body?: string;
  time_of_day: string;
  days_of_week: number[];
  enabled: boolean;
  last_fired_at?: string;
}

interface ReminderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const TYPES: { value: Reminder['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'workout', label: 'Workout', icon: <Dumbbell className="w-3.5 h-3.5" />, color: 'text-orange-500' },
  { value: 'meal', label: 'Meal', icon: <Utensils className="w-3.5 h-3.5" />, color: 'text-red-500' },
  { value: 'hydration', label: 'Water', icon: <Droplets className="w-3.5 h-3.5" />, color: 'text-blue-500' },
  { value: 'supplement', label: 'Supplement', icon: <Pill className="w-3.5 h-3.5" />, color: 'text-purple-500' },
  { value: 'weigh_in', label: 'Weigh-in', icon: <Scale className="w-3.5 h-3.5" />, color: 'text-amber-500' },
  { value: 'custom', label: 'Custom', icon: <Pencil className="w-3.5 h-3.5" />, color: 'text-neutral-500' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ReminderManager: React.FC<ReminderManagerProps> = ({ isOpen, onClose, currentUserEmail, showToast }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<Reminder['type']>('workout');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchReminders = useCallback(async () => {
    if (!isSupabaseConfigured() || !currentUserEmail) { setLoading(false); return; }
    const { data } = await supabase.from('user_reminders').select('*').eq('user_email', currentUserEmail).order('time_of_day');
    setReminders(data || []);
    setLoading(false);
  }, [currentUserEmail]);

  useEffect(() => {
    if (isOpen) fetchReminders();
  }, [isOpen, fetchReminders]);

  async function addReminder() {
    if (!newTitle.trim()) { showToast('Give your reminder a title', 'error'); return; }
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('user_reminders').insert({
      user_email: currentUserEmail,
      type: newType,
      title: newTitle.trim(),
      time_of_day: newTime,
      days_of_week: newDays,
      enabled: true,
    });
    if (error) { showToast('Failed to save reminder', 'error'); return; }
    showToast('Reminder created', 'success');
    setShowAdd(false);
    setNewTitle('');
    setNewTime('08:00');
    setNewDays([1, 2, 3, 4, 5]);
    fetchReminders();
  }

  async function toggleReminder(id: string, enabled: boolean) {
    await supabase.from('user_reminders').update({ enabled: !enabled }).eq('id', id);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
  }

  async function deleteReminder(id: string) {
    await supabase.from('user_reminders').delete().eq('id', id);
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast('Reminder deleted', 'success');
  }

  function toggleDay(day: number) {
    setNewDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  }

  const getTypeInfo = (type: string) => TYPES.find(t => t.value === type) || TYPES[5];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-neutral-900 dark:text-white">Reminders</h2>
              <p className="text-[11px] text-neutral-500">{reminders.filter(r => r.enabled).length} active</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-nude-close" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          ) : reminders.length === 0 && !showAdd ? (
            <div className="text-center py-12 space-y-3">
              <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="text-[13px] text-neutral-500">No reminders yet</p>
              <p className="text-[11px] text-neutral-400">Set up workout, meal, and hydration reminders to stay on track.</p>
            </div>
          ) : (
            reminders.map(rem => {
              const info = getTypeInfo(rem.type);
              return (
                <div key={rem.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${rem.enabled ? 'bg-white dark:bg-white/5 border-neutral-200 dark:border-neutral-700' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 ${info.color}`}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-neutral-900 dark:text-white truncate">{rem.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-mono text-neutral-500">{rem.time_of_day.slice(0, 5)}</span>
                      <span className="text-[9px] text-neutral-400">
                        {rem.days_of_week.length === 7 ? 'Every day' : rem.days_of_week.map(d => DAY_LABELS[d]).join(', ')}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => toggleReminder(rem.id, rem.enabled)} className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition cursor-pointer ${rem.enabled ? 'bg-red-500 border-red-500' : 'bg-transparent border-neutral-300 dark:border-neutral-600'}`}>
                    {rem.enabled && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <button onClick={() => deleteReminder(rem.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              );
            })
          )}

          {/* Add Form */}
          {showAdd && (
            <div className="mt-3 p-4 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5 space-y-3">
              <p className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">New Reminder</p>

              <div className="flex flex-wrap gap-1.5">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNewType(t.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border-2 transition cursor-pointer ${
                      newType === t.value ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white' : 'bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Reminder title..."
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-amber-500 transition"
              />

              <div className="flex items-center gap-3">
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Time:</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[12px] font-mono text-neutral-900 dark:text-white outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">Days:</label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-9 h-9 rounded-lg text-[10px] font-bold flex items-center justify-center transition cursor-pointer border-2 ${
                        newDays.includes(i) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-transparent border-neutral-200 dark:border-neutral-700 text-neutral-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[12px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
                  Cancel
                </button>
                <button onClick={addReminder} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-[12px] font-bold hover:bg-amber-600 transition cursor-pointer active:scale-95">
                  Save Reminder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showAdd && (
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-[12px] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Add Reminder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
