import React, { useState, useEffect } from 'react';
import { X, Send, CheckSquare, Square, Layers } from 'lucide-react';
import { Athlete, fetchCoachClients, dispatchWorkoutsToAthletes } from '../services/coachService';
import { ROUTINE_PROTOCOLS, RoutineProtocolTitle, getProtocolExercises } from './coachProtocols';
import { tactileEngine } from '../../../services/tactileEngine';

export interface DispatchDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  athletes?: Athlete[];
  onDispatch?: (selectedIds: string[], protocolTitle: string) => void | Promise<void>;
}

export const DispatchDrawer: React.FC<DispatchDrawerProps> = ({ isOpen = true, onClose, athletes: propAthletes, onDispatch }) => {
  const [internalAthletes, setInternalAthletes] = useState<Athlete[]>(propAthletes || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<RoutineProtocolTitle>(ROUTINE_PROTOCOLS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (propAthletes && propAthletes.length > 0) setInternalAthletes(propAthletes);
    else fetchCoachClients().then(setInternalAthletes);
  }, [propAthletes]);

  if (!isOpen) return null;
  const athletes = propAthletes || internalAthletes;
  const allSelected = athletes.length > 0 && selectedIds.length === athletes.length;

  const toggleSelectAll = () => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedIds(allSelected ? [] : athletes.map((a) => a.id));
  };

  const toggleAthlete = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    tactileEngine.triggerImpactPulse();
    try {
      if (onDispatch) await onDispatch(selectedIds, selectedProtocol);
      else {
        const exercises = getProtocolExercises(selectedProtocol);
        const { getAuthenticatedUserId } = await import('../../../services/authUser');
        const coachId = await getAuthenticatedUserId();
        if (!coachId) throw new Error('Sign in required to dispatch');
        await dispatchWorkoutsToAthletes(selectedIds, coachId, selectedProtocol, exercises);
      }
      setSelectedIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] flex flex-col overflow-hidden text-neutral-100 shadow-xl">
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-o1-crimson" /><h2 className="text-sm font-bold uppercase tracking-wider text-white">Batch Protocol Dispatch</h2></div>
          <button onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }} className="p-1 rounded-lg hover:bg-white/[0.06] text-neutral-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400 block mb-1.5">Select Protocol</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ROUTINE_PROTOCOLS.slice(0, 4).map((proto) => (
                <button key={proto} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedProtocol(proto); }} className={`p-2 rounded-xl border text-left text-xs font-semibold truncate transition-all ${selectedProtocol === proto ? 'border-o1-crimson bg-red-500/10 text-red-400 font-bold' : 'border-white/[0.07] bg-black text-neutral-300'}`}>{proto}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-neutral-400">Athletes ({selectedIds.length}/{athletes.length})</label>
              {athletes.length > 0 && <button type="button" onClick={toggleSelectAll} className="text-xs font-bold text-o1-crimson hover:underline">{allSelected ? 'Deselect All' : 'Select All'}</button>}
            </div>
            {athletes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/[0.07] text-center text-xs text-neutral-500">No active athletes available for dispatch.</div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {athletes.map((a) => (
                  <div key={a.id} onClick={() => toggleAthlete(a.id)} className="p-2.5 rounded-xl border border-white/[0.07] bg-black flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      {selectedIds.includes(a.id) ? <CheckSquare className="w-4 h-4 text-o1-crimson" /> : <Square className="w-4 h-4 text-neutral-500" />}
                      <span className="text-xs font-bold text-white">{a.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">{a.handle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-white/[0.05] bg-black">
          <button type="button" disabled={selectedIds.length === 0 || isSubmitting} onClick={handleConfirm} className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer">
            <Send className="w-4 h-4" /><span>Confirm & Dispatch ({selectedIds.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatchDrawer;
