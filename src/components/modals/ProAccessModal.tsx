import React from 'react';
import { X, Sparkles, Brain, Dumbbell, BarChart3, Zap } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface ProAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERKS = [
  { icon: Brain, title: 'Intel Coach', badge: 'O1FC ENGINE', desc: 'Personalized training insights powered by machine intelligence' },
  { icon: Dumbbell, title: 'Training Blueprints', badge: 'PRO ACCESS', desc: 'Elite workout programs built for your body type and target adaptation' },
  { icon: BarChart3, title: 'Weekly Report Cards', badge: 'TELEMETRY', desc: 'Deep performance analytics, volumetric progression, and strain tracking' },
  { icon: Zap, title: 'Smart Load Engine', badge: 'ADAPTIVE', desc: 'Auto-adjusting sets, reps, and resistance based on recovery velocity' },
];

export const ProAccessModal: React.FC<ProAccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleEnter = () => {
    tactileEngine.playPRCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] h-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#09090b]">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-500">
            <span className="w-2 h-2 rounded-full bg-[#C4121A] animate-ping" />
            <span>O1FC PRO ACCESS</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="text-center space-y-1">
            <div className="inline-flex p-2.5 rounded-full bg-[#C4121A]/10 text-[#C4121A] mb-1"><Sparkles className="w-6 h-6" /></div>
            <h3 className="text-lg font-black tracking-tight text-white uppercase font-display">Premium Unlocked</h3>
            <p className="text-[11px] font-mono text-neutral-400">90 days complimentary tier — no payment method required</p>
          </div>

          <div className="space-y-2">
            {PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-white/[0.06] text-[#C4121A] flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between"><h4 className="text-xs font-bold font-mono text-white truncate">{p.title}</h4><span className="text-[9px] font-mono font-bold text-[#C4121A] bg-[#C4121A]/10 px-2 py-0.5 rounded-full">{p.badge}</span></div>
                    <p className="text-[10px] font-mono text-neutral-400 mt-0.5 leading-snug">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleEnter} className="w-full py-4 rounded-full bg-[#C4121A] text-white hover:bg-[#A30F16] active:scale-[0.98] font-bold text-xs uppercase tracking-[0.15em] transition-all shadow-md cursor-pointer">
            ENTER TRAINING OS
          </button>
        </div>
      </div>
    </div>
  );
};
