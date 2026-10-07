import React, { useState } from 'react';
import { X, Send, CheckCircle2, Shield, Dumbbell } from 'lucide-react';
import { SquadAthlete } from '../../../types';

interface AssignProtocolModalProps {
  athlete: SquadAthlete | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAssign: (athleteId: string, protocolName: string) => void;
}

export const AssignProtocolModal: React.FC<AssignProtocolModalProps> = ({
  athlete,
  isOpen,
  onClose,
  onConfirmAssign,
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState('V-Taper Protocol: Heavy Hypertrophy');
  const [volumeModifier, setVolumeModifier] = useState('+10% Volume Overload');
  const [isAssigned, setIsAssigned] = useState(false);

  if (!isOpen || !athlete) return null;

  const protocols = [
    { title: 'V-Taper Protocol: Heavy Hypertrophy', desc: 'Clavicular & Lat Width Density' },
    { title: 'Kinetic Heavy Compound Primer', desc: 'CNS Motor-Unit Heavy Double Ramping' },
    { title: 'Achilles Tendon Deload & Isometrics', desc: 'High-Tension Tendon Stiffening' },
    { title: 'Tactical VO2 Max & Metcon Engine', desc: 'Lactate Threshold Intervals' },
  ];

  const handleAssign = () => {
    setIsAssigned(true);
    setTimeout(() => {
      onConfirmAssign(athlete.id, selectedProtocol);
      setIsAssigned(false);
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150">
      <div className="o1-sheet-card bg-o1-well border border-white/[0.07] text-zinc-100 w-full p-5 shadow-xl space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div>
            <span className="text-[9px] font-telemetry text-[#EF4444] uppercase block font-bold">
              TACTICAL WORKOUT DISPATCH
            </span>
            <h3 className="font-tactical text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Assign Protocol // {athlete.callsign}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Athlete Overview */}
        <div className="bg-black p-2.5 rounded-xl border border-white/[0.07] flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-white uppercase font-tactical">
              {athlete.callsign} ({athlete.name})
            </span>
            <span className="text-[10px] font-telemetry text-zinc-400 block mt-0.5">
              CNS Strain: {athStrain(athlete.cnsStrain)} // Recovery: {athlete.recoveryScore}%
            </span>
          </div>
          <span className="text-[9px] font-telemetry px-2 py-0.5 rounded bg-white/[0.08] text-zinc-300 font-semibold">
            {athlete.tier}
          </span>
        </div>

        {/* Protocols List */}
        <div>
          <label className="text-[10px] font-tactical uppercase tracking-wider text-zinc-400 block mb-1.5 font-bold">
            Prescribed Training Protocol
          </label>
          <div className="space-y-1.5">
            {protocols.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => setSelectedProtocol(p.title)}
                className={`w-full p-2.5 rounded-xl text-left border transition-all ${
                  selectedProtocol === p.title
                    ? 'bg-white/[0.08] border-red-500 text-white shadow-sm'
                    : 'bg-black border-white/[0.07] text-zinc-400 hover:border-white/[0.14]'
                }`}
              >
                <div className="font-tactical text-xs font-bold uppercase text-zinc-100">
                  {p.title}
                </div>
                <div className="text-[9px] font-telemetry text-zinc-400 mt-0.5">
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Volume / Intensity Modifier */}
        <div>
          <label className="text-[10px] font-tactical uppercase tracking-wider text-zinc-400 block mb-1.5 font-bold">
            Load & Volume Modifier
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['-15% Deload', 'Nominal (100%)', '+10% Overload'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setVolumeModifier(mod)}
                className={`py-1.5 px-2 rounded-xl text-center font-telemetry text-[9px] border transition-all ${
                  volumeModifier === mod
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-black border-white/[0.07] text-zinc-400'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isAssigned ? (
            <div className="w-full py-2.5 rounded-xl bg-[#0EA5E9] text-black font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Protocol Synced to Athlete HUD!</span>
            </div>
          ) : (
            <button
              onClick={handleAssign}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EF4444] text-white font-tactical text-xs font-bold uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deploy Protocol to Athlete HUD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function athStrain(strain: number) {
  return strain > 18 ? `${strain}/21 HIGH` : `${strain}/21`;
}
