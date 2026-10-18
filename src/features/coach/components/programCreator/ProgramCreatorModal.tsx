import React, { useState } from 'react';
import { ChevronLeft, Check, Sparkles, X } from 'lucide-react';
import { ProgramFormData, ProgramWeekPlan } from './types';
import { ProgramDetailsStep } from './ProgramDetailsStep';
import { ProgramBuilderStep } from './ProgramBuilderStep';
import { ProgramPricingStep } from './ProgramPricingStep';
import { ProgramReviewStep } from './ProgramReviewStep';
import { tactileEngine } from '../../../../services/tactileEngine';
import { O1_PRESETS } from './artworkPresets';

const STEPS = ['Details', 'Builder', 'Pricing', 'Review'] as const;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SPLIT_NAMES = [
  'Push',
  'Pull',
  'Legs',
  'Upper Body',
  'Lower Body',
  'Conditioning',
  'Mobility',
];

/** Grows or trims the plan to the chosen length, keeping every day the coach already filled in. */
function resizeWeeks(
  current: ProgramWeekPlan[],
  numWeeks: number,
  numDays: number,
): ProgramWeekPlan[] {
  const days = Math.min(Math.max(numDays, 1), 7);
  return Array.from({ length: Math.max(numWeeks, 1) }, (_week, wIdx) => ({
    weekNumber: wIdx + 1,
    days: Array.from(
      { length: days },
      (_day, dIdx) =>
        current[wIdx]?.days[dIdx] ?? {
          id: `d-${wIdx + 1}-${dIdx + 1}`,
          dayName: DAY_NAMES[dIdx],
          splitFocus: SPLIT_NAMES[dIdx % SPLIT_NAMES.length],
          exercises: [],
        },
    ),
  }));
}

export const ProgramCreatorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  /** Resolves true once the program is saved to the coach's account. */
  onPublished?: (p: ProgramFormData) => Promise<boolean>;
}> = ({ isOpen, onClose, onPublished }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
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
    coverImage: O1_PRESETS[0]?.url ?? '',
    coverSource: 'presets',
    weeks: resizeWeeks([], 4, 4),
    isFreeCommunity: false,
    priceUsd: 29.99,
    discountPercent: 0,
  });

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<ProgramFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      if (
        next.durationWeeks !== prev.durationWeeks ||
        next.trainingDaysPerWeek !== prev.trainingDaysPerWeek
      ) {
        next.weeks = resizeWeeks(next.weeks, next.durationWeeks, next.trainingDaysPerWeek);
      }
      return next;
    });
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (!formData.title.trim()) {
      setPublishError('Add a program title on the Details step.');
      return;
    }
    setPublishing(true);
    setPublishError('');
    const ok = onPublished ? await onPublished(formData) : false;
    setPublishing(false);
    if (!ok) {
      setPublishError('Could not publish. Check your connection and try again.');
      return;
    }
    tactileEngine.playPRCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm sm:flex sm:items-center sm:justify-center p-0 sm:p-4 select-none animate-fadeIn">
      {/* Container: Fullscreen on mobile, centered modal card on sm+ */}
      <div className="w-full h-full sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl bg-o1-canvas sm:rounded-2xl flex flex-col overflow-hidden text-o1-text shadow-2xl border-0 sm:border sm:border-white/[0.07]">
        {/* Top Header */}
        <div className="px-4 py-2 border-b border-white/[0.07] flex items-center justify-between bg-o1-surface shrink-0 min-h-[44px]">
          <div className="flex items-center gap-2.5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setCurrentStep((s) => s - 1);
                }}
                className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.07] flex items-center justify-center text-o1-text hover:text-o1-text transition-colors cursor-pointer"
                title={`Back to Step ${currentStep - 1}`}
              >
                <ChevronLeft size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson shrink-0">
                <Sparkles size={16} />
              </div>
            )}

            <h2 className="text-sm font-bold text-o1-text leading-tight">Program Creator</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-semibold text-o1-text">
              Step {currentStep} of 4
            </span>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.07] flex items-center justify-center text-o1-muted hover:text-o1-text transition-colors cursor-pointer"
              title="Close creator"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-4 border-b border-white/[0.07] bg-o1-surface shrink-0">
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
                className={`py-2 min-h-[44px] text-center text-xs font-semibold transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-o1-text font-bold'
                    : isCompleted
                      ? 'text-o1-text'
                      : 'text-o1-muted'
                }`}
              >
                <span className="flex items-center justify-center gap-1">
                  {isCompleted && <Check size={12} className="text-emerald-500 stroke-[3]" />}
                  <span>{s}</span>
                </span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-o1-crimson rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {currentStep === 1 && <ProgramDetailsStep data={formData} onChange={handleUpdate} />}
          {currentStep === 2 && <ProgramBuilderStep data={formData} onChange={handleUpdate} />}
          {currentStep === 3 && <ProgramPricingStep data={formData} onChange={handleUpdate} />}
          {currentStep === 4 && <ProgramReviewStep data={formData} />}
        </div>

        {publishError ? (
          <p
            role="alert"
            className="shrink-0 border-t border-white/[0.07] bg-o1-surface px-4 py-2 text-o1-caption text-o1-text"
          >
            {publishError}
          </p>
        ) : null}

        {/* Pinned Bottom Sticky Dock with Safe Area padding */}
        <div className="px-4 py-2 border-t border-white/[0.07] bg-o1-surface/95 backdrop-blur-md flex items-center justify-between shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setCurrentStep((s) => s - 1);
              }}
              className="py-2.5 px-4 rounded-xl border border-white/[0.07] text-o1-text hover:text-o1-text text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-white/[0.07] text-o1-muted hover:text-o1-text text-xs font-semibold cursor-pointer transition-colors"
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
              className="min-h-[44px] py-2.5 px-6 rounded-xl border border-white/[0.07] bg-o1-sheet text-o1-text text-xs font-bold active:scale-95 transition-all cursor-pointer ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={publishing}
              onClick={() => void handlePublish()}
              className="min-h-[44px] py-2.5 px-6 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ml-auto disabled:opacity-60"
            >
              <Sparkles size={14} />
              <span>{publishing ? 'Publishing…' : 'Publish program'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
