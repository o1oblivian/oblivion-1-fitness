import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, 
  Dumbbell, 
  Flame, 
  Users, 
  Target,
  Cpu,
  X, 
  Check, 
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { LiquidSilkBackground } from '@/components/ui/LiquidSilkBackground';

const ONBOARDING_STORAGE_KEY = 'ofc_onboarding_completed_v1';

export interface SystemFeature {
  id: string;
  badge: string;
  title: string;
  headline: string;
  instruction: string;
  actionTip: string;
  icon: React.ElementType;
  accentBg: string;
  accentColor: string;
}

const SYSTEM_FEATURES: SystemFeature[] = [
  {
    id: 'rotary-dial',
    badge: '01',
    title: 'Precision Rotary Dial',
    headline: 'Tap & hold center circle to adjust goals',
    instruction: 'Drag the outer perimeter ring or use continuous circular gestures to fine-tune steps, reps, and targets.',
    actionTip: 'Pro Tip: Tap center circle to trigger rotary calibration modal.',
    icon: RotateCw,
    accentBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
    accentColor: '#EA4335',
  },
  {
    id: 'training-os',
    badge: '02',
    title: 'Training OS Pro Logger',
    headline: 'High-precision set & rep recording',
    instruction: 'Select any exercise to log weight, reps, RPE, and rest timers. Long-press to edit completed sets.',
    actionTip: 'Pro Tip: Tap the play button to start rest interval countdown.',
    icon: Dumbbell,
    accentBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    accentColor: '#4285F4',
  },
  {
    id: 'fuel-os',
    badge: '03',
    title: 'Fuel OS & O1FC Macro Scanner',
    headline: 'Log nutrition with computer vision',
    instruction: 'Tap food scan to deconstruct meals with USDA-grade macro decomposition and barcode lookup.',
    actionTip: 'Pro Tip: Check the Macro Balance bar to stay aligned with daily targets.',
    icon: Flame,
    accentBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    accentColor: '#FBBC05',
  },
  {
    id: 'tandem-sync',
    badge: '04',
    title: 'Live Tandem & Gym Radar',
    headline: 'Synchronize live workouts with partners',
    instruction: 'Connect with training partners for synchronized rest countdowns and nearby athlete radar.',
    actionTip: 'Pro Tip: Generate a secure 6-digit session room code to invite a partner.',
    icon: Users,
    accentBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    accentColor: '#34A853',
  },
  {
    id: 'coach-hub',
    badge: '05',
    title: 'Coach Hub & Telemetry Dispatch',
    headline: 'Monitor client strain & assign programs',
    instruction: 'Access coach intelligence to review live athlete strain and dispatch periodized training blocks.',
    actionTip: 'Pro Tip: Switch to Coach Hub from the top menu to view roster metrics.',
    icon: Target,
    accentBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    accentColor: '#EA4335',
  },
  {
    id: 'vault-radar',
    badge: '06',
    title: 'Athlete Vault & Biometrics',
    headline: 'Progression logs and 1RM history',
    instruction: 'Review volume progression, 1RM curves, and body composition analytics in your vault.',
    actionTip: 'Pro Tip: Tap Vault in the bottom bar to export verified session summary cards.',
    icon: Cpu,
    accentBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    accentColor: '#9333EA',
  }
];

interface FirstTimeOnboardingGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export const FirstTimeOnboardingGuide: React.FC<FirstTimeOnboardingGuideProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  forceShow = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (forceShow) {
      setInternalIsOpen(true);
      return;
    }

    if (controlledIsOpen !== undefined) {
      setInternalIsOpen(controlledIsOpen);
      return;
    }
  }, [controlledIsOpen, forceShow]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setInternalIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div 
        id="onboarding-guide-overlay"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-transparent backdrop-blur-md overflow-y-auto"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-black/50 backdrop-blur-2xl text-white rounded-[28px] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        >
          {/* Background removed for 100% transparent layering */}

          {/* Top Bar */}
          <div className="relative z-10 pt-5 px-6 pb-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
                  System Reference
                </p>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  O1FC Feature Guide
                </h2>
              </div>
            </div>

            <button
              id="btn-close-onboarding-guide"
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Feature List (Apple Inset Grouped) */}
          <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-2.5">
            {SYSTEM_FEATURES.map((feature) => {
              const isExpanded = expandedId === feature.id;
              const IconComponent = feature.icon;

              return (
                <div
                  key={feature.id}
                  onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-white/[0.14] border-white/20 shadow-md'
                      : 'bg-white/10 border-white/15 hover:bg-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${feature.accentBg} flex items-center justify-center shrink-0`}>
                        <IconComponent className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-400">
                            {feature.badge}
                          </span>
                          <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {feature.headline}
                        </p>
                      </div>
                    </div>

                    <ChevronRight 
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-90 text-red-500' : ''
                      }`} 
                    />
                  </div>

                  {/* Expanded Pro Tip / Instruction */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-white/10 text-[11px] sm:text-xs text-zinc-300 space-y-2"
                      >
                        <p className="leading-relaxed">{feature.instruction}</p>
                        <div className="flex items-start gap-1.5 p-2 rounded-xl bg-red-500/10 text-red-300 text-[10.5px]">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{feature.actionTip}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Sticky Footer */}
          <div 
            className="relative z-10 px-5 sm:px-6 pt-3 pb-5 border-t border-white/10 bg-transparent"
            style={{
              paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom) + 12px))'
            }}
          >
            <button
              id="btn-done-onboarding-guide"
              type="button"
              onClick={handleClose}
              className="w-full h-11 sm:h-12 bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-bold tracking-wide rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const resetOnboardingGuide = () => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
};

export default FirstTimeOnboardingGuide;
