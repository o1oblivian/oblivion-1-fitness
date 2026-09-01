import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  RotateCw, 
  Dumbbell, 
  Flame, 
  Users, 
  Target,
  Cpu,
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { LiquidSilkBackground } from '@/components/ui/LiquidSilkBackground';

const ONBOARDING_STORAGE_KEY = 'ofc_onboarding_completed_v1';

export interface OnboardingStep {
  id: string;
  title: string;
  badge: string;
  headline: string;
  instruction: string;
  actionTip: string;
  icon: React.ElementType;
  accentColor: string;
  highlightTarget?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'rotary-dial',
    badge: '01 • ROTARY DIAL',
    title: 'Precision Rotary Dial & Goals',
    headline: 'Tap & Hold Center to Set Goals',
    instruction: 'Tap and hold the center value or zero dial to open the dynamic goal adjustment sheet. Drag the outer perimeter ring or use continuous circular gestures to fine-tune steps, reps, and targets.',
    actionTip: 'Pro Tip: Tap the center circle to trigger the interactive rotary calibration modal anytime.',
    icon: RotateCw,
    accentColor: '#EA4335',
    highlightTarget: 'dial-center'
  },
  {
    id: 'training-os',
    badge: '02 • TRAINING OS PRO',
    title: 'Training OS Pro Logger',
    headline: 'High-Precision Set & Rep Recording',
    instruction: 'Select any exercise to log weight, reps, RPE, and rest timers. Long-press on any completed set to edit or swipe left to remove.',
    actionTip: 'Pro Tip: Tap the play button to initiate auto-timed rest intervals between sets.',
    icon: Dumbbell,
    accentColor: '#4285F4',
    highlightTarget: 'training-tab'
  },
  {
    id: 'fuel-os',
    badge: '03 • FUEL OS',
    title: 'Fuel OS & Macro Engine',
    headline: 'Log Nutrition in Seconds',
    instruction: 'Tap quick-add macros or log whole meals with precise protein, carb, and fat distributions. Track your daily caloric balance against active burn.',
    actionTip: 'Pro Tip: Use the Macro Balance bar to stay aligned with your daily athletic targets.',
    icon: Flame,
    accentColor: '#FBBC05',
    highlightTarget: 'fuel-tab'
  },
  {
    id: 'tandem-sync',
    badge: '04 • TANDEM SYNC',
    title: 'Live Tandem & Gym Radar',
    headline: 'Synchronize Live with Partners & Coaches',
    instruction: 'Connect with training partners via Tandem Mode for shared countdowns and synchronized sets. Open Gym Buddy Radar to discover nearby athletes training at your local gym.',
    actionTip: 'Pro Tip: Tap Tandem Sync to generate a secure 6-digit session room code.',
    icon: Users,
    accentColor: '#34A853',
    highlightTarget: 'tandem-tab'
  },
  {
    id: 'coach-hub',
    badge: '05 • COACH HUB',
    title: 'Coach Hub & Telemetry Dispatch',
    headline: 'Monitor Roster & Dispatch Workouts',
    instruction: 'Access professional coach intelligence to review real-time client strain, assign structured periodized training blocks, and stream high-performance video consultations.',
    actionTip: 'Pro Tip: Switch to Coach Hub from the top menu to access athlete roster telemetry.',
    icon: Target,
    accentColor: '#EA4335',
    highlightTarget: 'coach-tab'
  },
  {
    id: 'vault-radar',
    badge: '06 • ATHLETE VAULT',
    title: 'Session Vault & Biometric Analytics',
    headline: 'Comprehensive Progression History',
    instruction: 'Review historical volume metrics, 1RM curves, body composition trends, and verified workout completion certificates in your encrypted athletic vault.',
    actionTip: 'Pro Tip: Tap the Vault icon in the navigation bar to export verified PDF session cards.',
    icon: Cpu,
    accentColor: '#9333EA',
    highlightTarget: 'vault-tab'
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
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (forceShow) {
      setInternalIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    if (controlledIsOpen !== undefined) {
      setInternalIsOpen(controlledIsOpen);
      return;
    }

    // Check if first-time user
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      // Delay slightly for smooth app entry
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [controlledIsOpen, forceShow]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setInternalIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  if (!isVisible) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div 
        id="onboarding-guide-overlay"
        className="fixed inset-0 z-[650] bg-[#f8fafc] text-black font-sans flex flex-col justify-between overflow-hidden select-none"
      >
        {/* Pure Light Fluid Silk Canvas Background (No Dark Smoke / No Floating Box) */}
        <LiquidSilkBackground theme="light" intensity={0.9} speed={0.8} interactive={true} className="opacity-95" />

        {/* 1. Fixed Top Status Bar & Progress Bar */}
        <header className="relative z-20 w-full shrink-0 pt-safe-top pt-4 px-4 sm:px-6 md:px-8 bg-white/40 backdrop-blur-xl border-b border-black/[0.04]">
          <div className="max-w-md mx-auto flex flex-col items-center">
            {/* Top Brand Tag & Step Counter + Dismiss */}
            <div className="w-full flex items-center justify-between py-1 text-black">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center">
                  <Compass size={13} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-mono font-black uppercase tracking-[0.22em] text-red-600">
                  O1FC System Guide
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-[11px] font-mono font-black text-black/70 px-2.5 py-0.5 rounded-full bg-white/70 shadow-xs border border-black/[0.04]">
                  <span className="text-red-600 font-extrabold">{currentStepIndex + 1}</span> / {ONBOARDING_STEPS.length}
                </div>
                <button
                  id="btn-skip-onboarding"
                  onClick={handleComplete}
                  className="p-1.5 text-black/60 hover:text-black rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
                  title="Dismiss Guide"
                  aria-label="Dismiss Guide"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Unified Progress Bar */}
            <div className="w-full h-1 bg-black/[0.06] rounded-full mt-2.5 mb-2 overflow-hidden flex gap-1">
              {ONBOARDING_STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className={`h-full transition-all duration-300 rounded-full ${
                    idx <= currentStepIndex ? 'bg-red-600 flex-1' : 'bg-black/10 flex-1'
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        {/* 2. Unified Content Canvas (Centered, Never Opening Too Low) */}
        <main className="relative z-10 flex-1 w-full overflow-y-auto overscroll-contain px-4 sm:px-6 md:px-8 py-5 flex flex-col items-center">
          <div className="w-full max-w-md my-auto flex flex-col justify-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full space-y-6"
              >
                {/* Visual Icon Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/90 text-red-600 shadow-sm border border-black/[0.04]">
                    <StepIcon className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-widest text-black uppercase bg-white/80 px-3.5 py-1 rounded-full shadow-2xs border border-black/[0.04]">
                    {currentStep.badge}
                  </span>
                </div>

                {/* Titles & Instructions */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-600 font-black block">
                    {currentStep.title}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight">
                    {currentStep.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-700 leading-relaxed pt-1 font-medium">
                    {currentStep.instruction}
                  </p>
                </div>

                {/* Action Tip Box */}
                <div className="p-4 rounded-2xl bg-white/80 border border-black/[0.04] flex items-start space-x-3 text-black shadow-xs">
                  <Sparkles className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-sans font-medium">
                    {currentStep.actionTip}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* 3. Pinned Bottom Action Bar (Fixed, Never Cut Off) */}
        <footer className="relative z-20 w-full shrink-0 pb-safe-bottom pb-4 pt-3 px-4 sm:px-6 md:px-8 bg-white/60 backdrop-blur-xl border-t border-black/[0.04]">
          <div className="max-w-md mx-auto flex items-center gap-3">
            {currentStepIndex > 0 && (
              <button
                id="btn-prev-onboarding"
                type="button"
                onClick={handlePrev}
                className="h-12 px-4 rounded-2xl bg-white/90 hover:bg-white text-black font-mono font-black text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 border border-black/[0.06]"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>PREVIOUS</span>
              </button>
            )}

            <button
              id="btn-next-onboarding"
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black text-xs font-mono uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'GET STARTED' : 'CONTINUE'}</span>
              {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>
        </footer>
      </div>
    </AnimatePresence>
  );
};

export const resetOnboardingGuide = () => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
};
