import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  RotateCw, 
  Dumbbell, 
  Flame, 
  Users, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  HelpCircle
} from 'lucide-react';

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
    badge: 'CORE INTERACTION',
    title: 'Precision Rotary Dial & Steps',
    headline: 'Tap & Hold Center to Set Goals',
    instruction: 'Tap and hold the center value or zero dial to open the dynamic goal adjustment sheet. Drag the outer perimeter ring or use continuous circular gestures to fine-tune steps, reps, and targets.',
    actionTip: 'Pro Tip: Tap the center circle to trigger the interactive rotary calibration modal anytime.',
    icon: RotateCw,
    accentColor: '#EA4335',
    highlightTarget: 'dial-center'
  },
  {
    id: 'training-os',
    badge: 'SOLO WORKOUTS',
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
    badge: 'METABOLIC TRACKING',
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
    badge: 'COMMUNITY & RADAR',
    title: 'Live Tandem & Gym Radar',
    headline: 'Synchronize Live with Partners & Coaches',
    instruction: 'Connect with training partners via Tandem Mode for shared countdowns and synchronized sets. Open Gym Buddy Radar to discover nearby athletes training at your local gym.',
    actionTip: 'Pro Tip: Tap Tandem Sync to generate a secure 6-digit session room code.',
    icon: Users,
    accentColor: '#34A853',
    highlightTarget: 'tandem-tab'
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          id="onboarding-guide-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase">
                O1FC System Guide
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-zinc-500">
                {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
              </span>
              <button
                id="btn-skip-onboarding"
                onClick={handleComplete}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
                title="Dismiss Guide"
                aria-label="Dismiss Guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex w-full h-1 bg-zinc-900">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`h-full transition-all duration-300 ${
                  idx <= currentStepIndex ? 'bg-red-500 flex-1' : 'bg-zinc-800 flex-1'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Visual Icon Badge */}
            <div className="flex items-center justify-between">
              <div 
                className="p-4 rounded-xl border flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: `${currentStep.accentColor}15`,
                  borderColor: `${currentStep.accentColor}40`,
                  color: currentStep.accentColor
                }}
              >
                <StepIcon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-widest text-zinc-400 uppercase bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                {currentStep.badge}
              </span>
            </div>

            {/* Titles & Instructions */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-red-400">
                {currentStep.title}
              </h4>
              <h3 className="text-xl font-bold tracking-tight text-white">
                {currentStep.headline}
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                {currentStep.instruction}
              </p>
            </div>

            {/* Action Tip Box */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {currentStep.actionTip}
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/60 border-t border-zinc-800/80">
            <button
              id="btn-prev-onboarding"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold font-mono transition-colors ${
                currentStepIndex === 0 
                  ? 'text-zinc-600 cursor-not-allowed' 
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>

            <button
              id="btn-next-onboarding"
              onClick={handleNext}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wider text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
            >
              <span>{currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'GET STARTED' : 'CONTINUE'}</span>
              {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
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
