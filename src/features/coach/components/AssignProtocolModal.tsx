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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-[9px] font-telemetry text-red-600 dark:text-[#FF3B30] uppercase block font-bold">
              TACTICAL WORKOUT DISPATCH
            </span>
            <h3 className="font-tactical text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Assign Protocol // {athlete.callsign}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Athlete Overview */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-zinc-900 dark:text-white uppercase font-tactical">
              {athlete.callsign} ({athlete.name})
            </span>
            <span className="text-[10px] font-telemetry text-zinc-500 dark:text-zinc-400 block mt-0.5">
              CNS Strain: {athStrain(athlete.cnsStrain)} // Recovery: {athlete.recoveryScore}%
            </span>
          </div>
          <span className="text-[9px] font-telemetry px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
            {athlete.tier}
          </span>
        </div>

        {/* Protocols List */}
        <div>
          <label className="text-[10px] font-tactical uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5 font-bold">
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
                    ? 'bg-red-50 dark:bg-zinc-800 border-red-500 text-zinc-900 dark:text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="font-tactical text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">
                  {p.title}
                </div>
                <div className="text-[9px] font-telemetry text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Volume / Intensity Modifier */}
        <div>
          <label className="text-[10px] font-tactical uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5 font-bold">
            Load & Volume Modifier
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['-15% Deload', 'Nominal (100%)', '+10% Overload'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setVolumeModifier(mod)}
                className={`py-1.5 px-2 rounded-lg text-center font-telemetry text-[9px] border transition-all ${
                  volumeModifier === mod
                    ? 'bg-red-600 text-white font-bold border-red-600'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
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
            <div className="w-full py-2.5 rounded-xl bg-[#06b6d4] text-black font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Protocol Synced to Athlete HUD!</span>
            </div>
          ) : (
            <button
              onClick={handleAssign}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FF3B30] text-white font-tactical text-xs font-bold uppercase tracking-wider shadow-[0_0_14px_rgba(255,59,48,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2"
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
