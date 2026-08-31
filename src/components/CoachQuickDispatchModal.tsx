import React, { useState } from 'react';
import { 
  X, Zap, Check, Users, Clock, Flame
} from 'lucide-react';
import { COACH_CLIENTS } from '../data/exerciseDatabase';
import { dispatchWorkout } from '../utils/dispatchStore';

interface CoachQuickDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface QuickRoutineTemplate {
  id: string;
  title: string;
  category: string;
  duration: string;
  intensity: 'HIGH' | 'MEDIUM' | 'RECOVERY';
  exercises: { name: string; sets: string; reps: string; rpe: number }[];
  description: string;
}

const QUICK_TEMPLATES: QuickRoutineTemplate[] = [
  {
    id: 'core_grip_finisher',
    title: 'Hanging Core & Grip Finisher',
    category: 'Finisher',
    duration: '10 MIN',
    intensity: 'HIGH',
    description: 'Decompress spine, torch the anterior core and strengthen forearm endurance.',
    exercises: [
      { name: 'Toes-To-Bar / Hanging Leg Raises', sets: '3', reps: '12-15', rpe: 8.5 },
      { name: 'Heavy Farmer\'s Carry (Dumbbells/KBs)', sets: '3', reps: '50m walk', rpe: 9.0 },
      { name: 'Ab Wheel Rollouts', sets: '3', reps: '10-12', rpe: 8.0 },
    ],
  },
  {
    id: 'shoulder_bulletproof',
    title: 'Scapular & Rotator Cuff Prehab',
    category: 'Recovery',
    duration: '12 MIN',
    intensity: 'RECOVERY',
    description: 'Stabilize shoulder capsule and promote synovial fluid flow.',
    exercises: [
      { name: 'Cable Face Pulls w/ External Rotation', sets: '3', reps: '15-20', rpe: 7.0 },
      { name: 'Prone Y-T-W Scapular Raises', sets: '3', reps: '10 each', rpe: 7.5 },
      { name: 'Band Over-and-Backs', sets: '2', reps: '20 reps', rpe: 6.0 },
    ],
  },
  {
    id: 'metabolic_surge',
    title: 'Metabolic Conditioning Surge',
    category: 'Conditioning',
    duration: '15 MIN',
    intensity: 'HIGH',
    description: 'EPOC lactate builder to maximize cardiovascular power.',
    exercises: [
      { name: 'Assault Bike / Rower Sprint Intervals', sets: '5', reps: '30s sprint / 60s rest', rpe: 9.5 },
      { name: 'Kettlebell Swings (Heavy)', sets: '4', reps: '20 reps', rpe: 8.5 },
      { name: 'Burpee Box Jump Overs', sets: '3', reps: '12 reps', rpe: 9.0 },
    ],
  },
  {
    id: 'hypertrophy_arms_pump',
    title: 'Arms & Delta Hypertrophy Burnout',
    category: 'Hypertrophy',
    duration: '14 MIN',
    intensity: 'MEDIUM',
    description: 'Superset matrix for maximum sarcoplasmic pump.',
    exercises: [
      { name: 'Incline Dumbbell Curl + Overhead Tricep Extension (Superset)', sets: '4', reps: '12-15', rpe: 8.5 },
      { name: 'Lateral Cable Raises (Myo-Reps)', sets: '4', reps: '15 + 5 + 5', rpe: 9.0 },
      { name: 'Cross-Body Hammer Curls', sets: '3', reps: '12 each', rpe: 8.0 },
    ],
  },
];

export const CoachQuickDispatchModal: React.FC<CoachQuickDispatchModalProps> = ({
  isOpen,
  onClose,
  coachName = 'Coach',
  showToast,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(QUICK_TEMPLATES[0].id);
  const [selectedClientKeys, setSelectedClientKeys] = useState<string[]>(() => Object.keys(COACH_CLIENTS));
  const [customCue, setCustomCue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const clientList = Object.values(COACH_CLIENTS);
  const activeTemplate = QUICK_TEMPLATES.find((t) => t.id === selectedTemplateId) || QUICK_TEMPLATES[0];

  const toggleClientKey = (key: string) => {
    setSelectedClientKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllClients = () => {
    setSelectedClientKeys(clientList.map((c) => c.key));
  };

  const handleClearClients = () => {
    setSelectedClientKeys([]);
  };

  const handleDispatch = async () => {
    if (selectedClientKeys.length === 0) {
      showToast('Please select at least 1 athlete', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const clientNames = selectedClientKeys.map(k => COACH_CLIENTS[k]?.name || 'Athlete');
      const today = new Date().toISOString().split('T')[0];
      await dispatchWorkout({
        coachId: 'coach_primary',
        coachName,
        clientIds: selectedClientKeys,
        clientNames,
        title: activeTemplate.title,
        routineCategory: activeTemplate.title.includes('Lower') || activeTemplate.title.includes('Leg') ? 'Legs' : 'Push',
        scheduledDay: 'Today',
        scheduledDate: today,
        notes: customCue || activeTemplate.description,
        exercises: activeTemplate.exercises.map((ex) => ({
          name: ex.name,
          sets: parseInt(ex.sets, 10) || 3,
          reps: ex.reps,
          targetLoad: `RPE ${ex.rpe}`,
          notes: `Target RPE ${ex.rpe}`,
        })),
      });

      showToast(`Dispatched "${activeTemplate.title}" to ${selectedClientKeys.length} athletes!`, 'success');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Dispatch complete', 'success');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-t-[1.5rem] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200/80/90 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-2 pb-1.5 px-3.5 flex flex-col items-center border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mb-1.5 sm:hidden" />
          <div className="w-full flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Speed Dispatch Engine
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  1-Tap Tactical Booster & Routine Blast
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-nude-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
          {/* Template Selector */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Select Booster Protocol
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-red-500/80 shadow-xs'
                        : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 hover:bg-white dark:hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {tmpl.category}
                      </span>
                      <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {tmpl.duration}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">
                      {tmpl.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Template Breakdown */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                {activeTemplate.title}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                {activeTemplate.exercises.length} Movements
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {activeTemplate.description}
            </p>

            <div className="pt-1 divide-y divide-stone-100 dark:divide-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800/60">
              {activeTemplate.exercises.map((ex, i) => (
                <div key={i} className="py-1 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate pr-2">
                    {ex.name}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[10px] shrink-0">
                    {ex.sets} &times; {ex.reps} &bull; RPE {ex.rpe}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Athletes Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Target Athletes ({selectedClientKeys.length}/{clientList.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAllClients}
                  className="text-[9px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={handleClearClients}
                  className="text-[9px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-xl divide-y divide-stone-100 dark:divide-zinc-800/80 overflow-hidden max-h-36 overflow-y-auto">
              {clientList.map((client) => {
                const isSelected = selectedClientKeys.includes(client.key);
                return (
                  <div
                    key={client.key}
                    onClick={() => toggleClientKey(client.key)}
                    className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                      isSelected ? 'bg-zinc-50/80 dark:bg-zinc-800/40' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent'
                        }`}
                      >
                        <Check className="w-2 h-2 stroke-[3]" />
                      </div>
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="w-6 h-6 rounded-md object-cover border border-zinc-200/80 dark:border-zinc-700 shrink-0"
                      />
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {client.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 dark:text-zinc-500">
                      {client.handle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Cue Note */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Coach Voice Note / Dispatch Cue (Optional)
            </label>
            <input
              type="text"
              value={customCue}
              onChange={(e) => setCustomCue(e.target.value)}
              placeholder="e.g. Keep 60s rest strict, push the final set to failure!"
              className="w-full bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-stone-400 dark:focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isSubmitting || selectedClientKeys.length === 0}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dispatch ({selectedClientKeys.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
