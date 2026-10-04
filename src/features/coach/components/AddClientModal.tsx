import React, { useState } from 'react';
import { UserPlus, X, Plus } from 'lucide-react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Athlete) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onAddClient }) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAth: Athlete = {
      id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      handle: handle.trim()
        ? (handle.startsWith('@') ? handle : `@${handle}`)
        : `@${name.toLowerCase().replace(/\s+/g, '_')}`,
      status: 'Active',
      readiness: 90,
      volume: 0,
      lastActive: 'Just now',
    };

    tactileEngine.playPRCelebration();
    onAddClient(newAth);
    setName('');
    setHandle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C4121A]/10 border border-[#C4121A]/30 flex items-center justify-center text-[#C4121A]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Add Client to Roster
              </h3>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                Direct athlete roster enrollment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mb-1">
              Athlete Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Hayes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#C4121A]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mb-1">
              Athlete Handle (Optional)
            </label>
            <input
              type="text"
              placeholder="@jordanhayes"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#C4121A]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#C4121A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#A30F16] active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Enroll in Roster</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
