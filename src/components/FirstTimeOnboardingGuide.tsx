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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain bg-black/40 backdrop-blur-md"
      >
        <motion.div
          id="onboarding-guide-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col my-auto bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden text-black dark:text-white font-sans"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 bg-transparent shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-white/90 dark:bg-white/10 text-red-600 shadow-sm">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-black tracking-wider text-red-600 uppercase">
                O1FC System Guide
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-black text-black dark:text-white px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-white/10 shadow-sm">
                {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
              </span>
              <button
                id="btn-skip-onboarding"
                onClick={handleComplete}
                className="p-1.5 text-black dark:text-white hover:text-red-600 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss Guide"
                aria-label="Dismiss Guide"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex w-full h-1 bg-black/10 dark:bg-white/10 shrink-0">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={`h-full transition-all duration-300 ${
                  idx <= currentStepIndex ? 'bg-red-600 flex-1' : 'bg-transparent flex-1'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6 md:p-8 space-y-5 bg-transparent flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Visual Icon Badge */}
            <div className="flex items-center justify-between">
              <div 
                className="p-4 rounded-2xl flex items-center justify-center transition-all duration-300 bg-white/90 dark:bg-white/10 text-red-600 shadow-sm"
              >
                <StepIcon className="w-7 h-7 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-mono font-black tracking-widest text-black dark:text-white uppercase bg-white/90 dark:bg-white/10 px-3.5 py-1 rounded-full shadow-xs">
                {currentStep.badge}
              </span>
            </div>

            {/* Titles & Instructions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-red-600 font-black">
                {currentStep.title}
              </h4>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white leading-tight">
                {currentStep.headline}
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1 font-medium">
                {currentStep.instruction}
              </p>
            </div>

            {/* Action Tip Box of Information */}
            <div className="p-4 rounded-2xl bg-white/85 dark:bg-zinc-900/80 flex items-start space-x-3 text-black dark:text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans font-medium">
                {currentStep.actionTip}
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shrink-0">
            <button
              id="btn-prev-onboarding"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black font-mono transition-all ${
                currentStepIndex === 0 
                  ? 'text-zinc-400 bg-white/30 dark:bg-white/5 cursor-not-allowed' 
                  : 'bg-white/90 dark:bg-white/10 text-black dark:text-white hover:bg-white dark:hover:bg-white/20 cursor-pointer shadow-sm active:scale-95'
              }`}
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>PREVIOUS</span>
            </button>

            <button
              id="btn-next-onboarding"
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider text-white bg-red-600 hover:bg-red-700 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'GET STARTED' : 'CONTINUE'}</span>
              {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
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
