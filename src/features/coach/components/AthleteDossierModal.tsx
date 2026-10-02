import React from 'react';
import { X, Activity, Flame, Calendar, Send, HeartPulse } from 'lucide-react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';

export interface AthleteDossierModalProps {
  athlete: Athlete | null;
  isOpen?: boolean;
  onClose: () => void;
  onOpenDispatchStudio?: (athleteId: string) => void;
}

export const AthleteDossierModal: React.FC<AthleteDossierModalProps> = ({
  athlete,
  isOpen = true,
  onClose,
  onOpenDispatchStudio,
}) => {
  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#121214] border border-neutral-800 text-neutral-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#09090b] border border-neutral-800 overflow-hidden flex items-center justify-center font-bold text-sm text-neutral-300">
              {athlete.avatar ? (
                <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />
              ) : (
                athlete.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {athlete.name}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#09090b] border border-neutral-800 text-neutral-300">
                  {athlete.status}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 font-mono">{athlete.handle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              tactileEngine.selection();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Metrics & Check-in History */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Readiness & Volume Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#09090b] border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Readiness Score</span>
              <div className="text-xl font-mono font-bold text-green-400 flex items-center gap-1 mt-0.5">
                <Activity className="w-4 h-4" />
                <span>{athlete.readiness}%</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">CNS & HRV Telemetry</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#09090b] border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">7-Day Volume</span>
              <div className="text-xl font-mono font-bold text-[#C4121A] flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4" />
                <span>{(athlete.volume / 1000).toFixed(1)}k kg</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Tonnage logged</span>
            </div>
          </div>

          {/* Vitals Telemetry */}
          <div className="p-3 rounded-2xl border border-neutral-800 bg-[#09090b]/60 space-y-2">
            <span className="text-xs font-bold uppercase text-neutral-300 tracking-wider flex items-center gap-1.5 font-mono">
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
              Biometric Telemetry
            </span>
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-xl bg-[#121214] border border-neutral-800/80">
                <span className="text-[9px] text-neutral-400 block">RHR</span>
                <span className="text-xs font-bold text-white">54 BPM</span>
              </div>
              <div className="p-2 rounded-xl bg-[#121214] border border-neutral-800/80">
                <span className="text-[9px] text-neutral-400 block">HRV</span>
                <span className="text-xs font-bold text-white">88 ms</span>
              </div>
              <div className="p-2 rounded-xl bg-[#121214] border border-neutral-800/80">
                <span className="text-[9px] text-neutral-400 block">Sleep</span>
                <span className="text-xs font-bold text-white">8h 12m</span>
              </div>
            </div>
          </div>

          {/* Activity Status */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-neutral-300 tracking-wider flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#C4121A]" />
              Telemetry Status
            </span>
            <div className="p-3 rounded-2xl border border-neutral-800 bg-[#09090b]/60 text-xs">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Active Cycle</span>
                <span className="text-[10px] font-mono text-neutral-400">{athlete.lastActive || 'Syncing'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                Status flag: {athlete.status}. Volume load: {athlete.volume} kg total session output.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {onOpenDispatchStudio && (
          <div className="p-3 border-t border-neutral-800 bg-[#09090b]">
            <button
              type="button"
              onClick={() => {
                tactileEngine.selection();
                onClose();
                onOpenDispatchStudio(athlete.id);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer transition-all font-mono"
            >
              <Send className="w-4 h-4" />
              <span>Create 1-on-1 Protocol in Studio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default AthleteDossierModal;
