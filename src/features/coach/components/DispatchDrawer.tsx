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
        const coachId = typeof window !== 'undefined' ? localStorage.getItem('o1fc_coach_id') || 'coach_alpha' : 'coach_alpha';
        await dispatchWorkoutsToAthletes(selectedIds, coachId, selectedProtocol, exercises);
      }
      setSelectedIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm select-none p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#121214] border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden text-neutral-100 shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-[#C4121A]" /><h2 className="text-sm font-bold uppercase tracking-wider text-white">Batch Protocol Dispatch</h2></div>
          <button onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-neutral-400 block mb-1.5">Select Protocol</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ROUTINE_PROTOCOLS.slice(0, 4).map((proto) => (
                <button key={proto} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedProtocol(proto); }} className={`p-2 rounded-xl border text-left text-xs font-semibold truncate transition-all ${selectedProtocol === proto ? 'border-[#C4121A] bg-red-500/10 text-red-400 font-bold' : 'border-neutral-800 bg-[#09090b] text-neutral-300'}`}>{proto}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase text-neutral-400">Athletes ({selectedIds.length}/{athletes.length})</label>
              {athletes.length > 0 && <button type="button" onClick={toggleSelectAll} className="text-xs font-bold text-[#C4121A] hover:underline">{allSelected ? 'Deselect All' : 'Select All'}</button>}
            </div>
            {athletes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-800 text-center text-xs text-neutral-500">No active athletes available for dispatch.</div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {athletes.map((a) => (
                  <div key={a.id} onClick={() => toggleAthlete(a.id)} className="p-2.5 rounded-xl border border-neutral-800 bg-[#09090b] flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      {selectedIds.includes(a.id) ? <CheckSquare className="w-4 h-4 text-[#C4121A]" /> : <Square className="w-4 h-4 text-neutral-500" />}
                      <span className="text-xs font-bold text-white">{a.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">{a.handle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-neutral-800 bg-[#09090b]">
          <button type="button" disabled={selectedIds.length === 0 || isSubmitting} onClick={handleConfirm} className="w-full py-2.5 px-4 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg">
            <Send className="w-4 h-4" /><span>Confirm & Dispatch ({selectedIds.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatchDrawer;
