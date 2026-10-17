import React from 'react';
import { X, Shield, EyeOff, Radio, Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: Record<string, boolean>) => void;
}

export const PrivacyStealthModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const radarConsent = useBuddyProfileStore((s) => s.radarConsent);
  const ghostMode = useBuddyProfileStore((s) => s.ghostMode);
  const setRadarConsent = useBuddyProfileStore((s) => s.setRadarConsent);
  const toggleGhostMode = useBuddyProfileStore((s) => s.toggleGhostMode);

  if (!isOpen) return null;

  const rows = [
    {
      id: 'radar',
      title: 'Show me on Buddy',
      desc: 'Uses your rough area, about 1 km, to match you with people nearby. Your exact location is never shown. Turning this off removes your card and your saved area.',
      icon: Radio,
      enabled: radarConsent,
      toggle: () => {
        setRadarConsent(!radarConsent);
        onSaved?.({ radarConsent: !radarConsent, ghostMode });
      },
    },
    {
      id: 'ghost',
      title: 'Ghost mode',
      desc: 'Hide your card from everyone. You can still browse.',
      icon: EyeOff,
      enabled: ghostMode,
      toggle: () => {
        toggleGhostMode(!ghostMode);
        onSaved?.({ radarConsent, ghostMode: !ghostMode });
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-2.5 shadow-xl space-y-2.5 overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-crimson">
              <Shield className="w-4 h-4 text-o1-crimson" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-white font-tactical leading-tight">
                PRIVACY
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">Who can see you on Buddy</p>
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

        <div className="space-y-2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.id}
                type="button"
                role="switch"
                aria-checked={row.enabled}
                onClick={row.toggle}
                className="w-full text-left bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:border-white/[0.14] transition-all"
              >
                <span className="flex items-start gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-300 shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="space-y-0.5 min-w-0">
                    <span className="block text-xs font-semibold text-white tracking-wide font-tactical">{row.title}</span>
                    <span className="block text-[11px] text-neutral-400 leading-snug">{row.desc}</span>
                  </span>
                </span>
                <span
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                    row.enabled ? 'bg-o1-crimson' : 'bg-white/[0.08]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      row.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
          className="w-full py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};


