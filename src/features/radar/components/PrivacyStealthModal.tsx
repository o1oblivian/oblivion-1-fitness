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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-2.5 shadow-xl space-y-2.5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-crimson">
              <Shield className="w-4 h-4 text-o1-crimson" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-white font-tactical leading-tight">
                PRIVACY &amp; STEALTH
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">Radar telemetry &amp; profile visibility</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all cursor-pointer"
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
        <div className="space-y-2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.id}
                onClick={row.toggle}
                className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:border-white/[0.14] transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-300 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-white tracking-wide font-tactical">{row.title}</h4>
                    <p className="text-[11px] text-neutral-400 leading-snug">{row.desc}</p>
                  </div>
                </div>

                {/* Crimson Tactical Switch */}
                <button
                  type="button"
                  aria-checked={row.enabled}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer ${
                    row.enabled ? 'bg-o1-crimson' : 'bg-white/[0.08]'
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
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};

export default PrivacyStealthModal;
