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
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl space-y-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Add Client to Roster
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                Direct athlete roster enrollment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Athlete Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Hayes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white focus:outline-none focus:border-o1-crimson"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              Athlete Handle (Optional)
            </label>
            <input
              type="text"
              placeholder="@jordanhayes"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white focus:outline-none focus:border-o1-crimson"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-zinc-100 text-neutral-950 text-xs font-semibold tracking-wide hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer"
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
