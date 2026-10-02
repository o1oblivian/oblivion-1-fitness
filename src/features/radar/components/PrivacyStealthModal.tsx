import React, { useState } from 'react';
import { X, Shield, Scale, EyeOff, Radio, Activity, Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: Record<string, boolean>) => void;
}

export const PrivacyStealthModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [displayWeight, setDisplayWeight] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [gymZoneSharing, setGymZoneSharing] = useState(true);
  const [publicTelemetry, setPublicTelemetry] = useState(true);

  if (!isOpen) return null;

  const handleToggle = (key: string, current: boolean, setter: (val: boolean) => void) => {
    tactileEngine.triggerSelectionBuzz();
    const next = !current;
    setter(next);
    onSaved?.({
      displayWeight: key === 'weight' ? next : displayWeight,
      ghostMode: key === 'ghost' ? next : ghostMode,
      gymZoneSharing: key === 'zone' ? next : gymZoneSharing,
      publicTelemetry: key === 'telemetry' ? next : publicTelemetry,
    });
  };

  const rows = [
    {
      id: 'weight',
      title: 'Display Body Weight',
      desc: 'Show your body weight on your public profile card. If disabled, your athletic focus is shown instead.',
      icon: Scale,
      enabled: displayWeight,
      toggle: () => handleToggle('weight', displayWeight, setDisplayWeight),
    },
    {
      id: 'ghost',
      title: 'Ghost Mode',
      desc: 'Hide completely from the radar. You can still browse others.',
      icon: EyeOff,
      enabled: ghostMode,
      toggle: () => handleToggle('ghost', ghostMode, setGhostMode),
    },
    {
      id: 'zone',
      title: 'Gym Zone Sharing',
      desc: 'Broadcasts your info on the Buddy Radar.',
      icon: Radio,
      enabled: gymZoneSharing,
      toggle: () => handleToggle('zone', gymZoneSharing, setGymZoneSharing),
    },
    {
      id: 'telemetry',
      title: 'Public Telemetry',
      desc: 'Share your PRs and streak on your public card.',
      icon: Activity,
      enabled: publicTelemetry,
      toggle: () => handleToggle('telemetry', publicTelemetry, setPublicTelemetry),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#09090b] border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#18181b] border border-neutral-800 flex items-center justify-center text-[#C4121A]">
              <Shield className="w-4 h-4 text-[#C4121A]" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase font-tactical leading-tight">
                PRIVACY &amp; STEALTH
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">Radar telemetry &amp; profile visibility</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-8 h-8 rounded-full bg-[#18181b] hover:bg-[#27272a] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Intro */}
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white tracking-tight font-tactical">Privacy &amp; Body Metrics</h3>
          <p className="text-xs text-neutral-400 font-mono">Control profile visibility and athlete body telemetry.</p>
        </div>

        {/* Toggle Rows */}
        <div className="space-y-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.id}
                onClick={row.toggle}
                className="bg-[#121214] border border-neutral-800 rounded-2xl p-4 flex items-start justify-between gap-3 cursor-pointer hover:border-neutral-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#18181b] border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-wide font-tactical">{row.title}</h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{row.desc}</p>
                  </div>
                </div>

                {/* Crimson Tactical Switch */}
                <button
                  type="button"
                  aria-checked={row.enabled}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 mt-1 cursor-pointer ${
                    row.enabled ? 'bg-[#C4121A]' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      row.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => { tactileEngine.playPRCelebration(); onClose(); }}
          className="w-full py-3 rounded-2xl bg-[#C4121A] hover:bg-[#b01017] text-white text-xs font-tactical font-bold uppercase tracking-wider shadow-lg shadow-red-950/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>SAVE PREFERENCES</span>
        </button>
      </div>
    </div>
  );
};

export default PrivacyStealthModal;
