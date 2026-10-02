import React, { useState } from 'react';
import { ChevronLeft, Check, Sparkles, X } from 'lucide-react';
import { ProgramFormData, ProgramWeekPlan } from './types';
import { ProgramDetailsStep } from './ProgramDetailsStep';
import { ProgramBuilderStep } from './ProgramBuilderStep';
import { ProgramPricingStep } from './ProgramPricingStep';
import { ProgramReviewStep } from './ProgramReviewStep';
import { tactileEngine } from '../../../../services/tactileEngine';

const STEPS = ['Details', 'Builder', 'Pricing', 'Review'] as const;

function createDefaultWeeks(numWeeks: number, numDays: number): ProgramWeekPlan[] {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const splitNames = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Conditioning', 'Mobility'];
  
  return Array.from({ length: numWeeks }, (_, wIdx) => ({
    weekNumber: wIdx + 1,
    days: Array.from({ length: Math.min(numDays, 7) }, (_, dIdx) => ({
      id: `d-${wIdx + 1}-${dIdx + 1}`,
      dayName: dayNames[dIdx],
      splitFocus: splitNames[dIdx % splitNames.length],
      exercises: [],
    })),
  }));
}

export const ProgramCreatorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (p: ProgramFormData) => void;
}> = ({ isOpen, onClose, onPublished }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    description: '',
    shortOverview: '',
    fullMethodology: '',
    descriptionMode: 'short',
    category: 'Hypertrophy',
    difficulty: 'Intermediate',
    durationWeeks: 4,
    trainingDaysPerWeek: 4,
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    coverSource: 'presets',
    weeks: createDefaultWeeks(4, 4),
    isFreeCommunity: false,
    priceUsd: 29.99,
    discountPercent: 0,
  });

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<ProgramFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      if (updates.durationWeeks && updates.durationWeeks !== prev.durationWeeks) {
        next.weeks = createDefaultWeeks(updates.durationWeeks, next.trainingDaysPerWeek);
      }
      return next;
    });
  };

  const handlePublish = () => {
    tactileEngine.playPRCelebration();
    if (onPublished) onPublished(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm sm:flex sm:items-center sm:justify-center p-0 sm:p-4 select-none animate-fadeIn">
      {/* Container: Fullscreen on mobile, centered modal card on sm+ */}
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-[#F4F4F7] dark:bg-[#09090b] sm:rounded-3xl flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100 shadow-2xl border-0 sm:border sm:border-neutral-200 dark:sm:border-neutral-800">
        
        {/* Top Header */}
        <div className="px-4 py-3 sm:py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#121214] shrink-0">
          <div className="flex items-center gap-2.5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setCurrentStep((s) => s - 1);
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title={`Back to Step ${currentStep - 1}`}
              >
                <ChevronLeft size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#C4121A]/10 border border-[#C4121A]/30 flex items-center justify-center text-[#C4121A] shrink-0">
                <Sparkles size={16} />
              </div>
            )}
            
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-tight">
                Program Creator
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {currentStep === 1 && 'General details & artwork'}
                {currentStep === 2 && 'Curriculum schedule & exercise stack'}
                {currentStep === 3 && 'Access tier & revenue model'}
                {currentStep === 4 && 'Verification & publication'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              Step {currentStep} of 4
            </span>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Close creator"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shrink-0">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setCurrentStep(stepNum);
                }}
                className={`py-2.5 text-center text-xs font-semibold transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-neutral-900 dark:text-white font-bold'
                    : isCompleted
                    ? 'text-neutral-700 dark:text-neutral-300'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {isCompleted && <Check size={12} className="text-green-500 stroke-[3]" />}
                  <span>{s}</span>
                </span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-neutral-900 dark:bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {currentStep === 1 && <ProgramDetailsStep data={formData} onChange={handleUpdate} />}
          {currentStep === 2 && <ProgramBuilderStep data={formData} onChange={handleUpdate} />}
          {currentStep === 3 && <ProgramPricingStep data={formData} onChange={handleUpdate} />}
          {currentStep === 4 && <ProgramReviewStep data={formData} />}
        </div>

        {/* Pinned Bottom Sticky Dock with Safe Area padding */}
        <div className="px-4 py-3 sm:py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md flex items-center justify-between shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setCurrentStep((s) => s - 1);
              }}
              className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              &lt; Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setCurrentStep((s) => s + 1);
              }}
              className="py-2.5 px-6 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer ml-auto"
            >
              Next &gt;
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="py-2.5 px-6 rounded-xl bg-[#C4121A] hover:bg-[#a80f16] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ml-auto"
            >
              <Sparkles size={14} />
              <span>Publish Program</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
