import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ChevronRight, ChevronLeft, Zap, Shield, Flame } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { useWorkoutStore } from '../../features/workout/store/useWorkoutStore';
import { mockArchetypeStories } from '../../services/devMocks';

export interface StoryArchetype {
  id: string;
  name: string;
  archetypeTitle: string;
  creatorHandle: string;
  verified: boolean;
  backgroundAsset: string;
  focusMuscles: string[];
  splitOverview: {
    daysPerWeek: string;
    targetFocus: string;
    intensity: string;
    protocol: string;
    keyLifts: string[];
  };
}

const STORIES = mockArchetypeStories();

export interface ProgramReelsModalProps {
  isOpen: boolean;
  initialStoryId?: string;
  onClose: () => void;
  onAdoptBlueprint?: (programTitle: string) => void;
}

const STORY_DURATION_MS = 5500;
const TICK_INTERVAL_MS = 50;

export const ProgramReelsModal: React.FC<ProgramReelsModalProps> = ({
  isOpen,
  initialStoryId,
  onClose,
  onAdoptBlueprint,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initial index when modal opens with a specific story
  useEffect(() => {
    if (isOpen) {
      if (initialStoryId) {
        const found = STORIES.findIndex(
          (s) =>
            s.id === initialStoryId ||
            s.name.toLowerCase() === initialStoryId.toLowerCase() ||
            s.name.toLowerCase().includes(initialStoryId.toLowerCase()) ||
            initialStoryId.toLowerCase().includes(s.name.toLowerCase())
        );
        setActiveIndex(found >= 0 ? found : 0);
      } else {
        setActiveIndex(0);
      }
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialStoryId]);

  const activeStory = STORIES[activeIndex] || STORIES[0];

  const handleNextStory = useCallback(() => {
    tactileEngine.triggerDialHaptic();
    setProgress(0);
    setActiveIndex((prev) => (prev + 1) % STORIES.length);
  }, []);

  const handlePrevStory = useCallback(() => {
    tactileEngine.triggerDialHaptic();
    setProgress(0);
    setActiveIndex((prev) => (prev === 0 ? STORIES.length - 1 : prev - 1));
  }, []);

  // Timer loop for auto-advancing story
  useEffect(() => {
    if (!isOpen || isPaused) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_INTERVAL_MS / STORY_DURATION_MS) * 100;
        if (next >= 100) {
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, handleNextStory]);

  const handleAdoptBlueprint = () => {
    tactileEngine.playPRCelebration();
    useWorkoutStore.getState().setSelectedProgramTitle(activeStory.archetypeTitle);
    useWorkoutStore.getState().loadSevenWorkouts(activeStory.archetypeTitle);
    useWorkoutStore
      .getState()
      .showToast(`Blueprint Adopted: ${activeStory.archetypeTitle} loaded into active protocol!`);

    if (onAdoptBlueprint) {
      onAdoptBlueprint(activeStory.archetypeTitle);
    }
    onClose();
  };

  if (!isOpen || !activeStory || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="program-reels-modal"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 overflow-hidden select-none animate-in fade-in duration-200"
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
    >
      {/* Background Visual Asset with Atmospheric Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          key={activeStory.id}
          src={activeStory.backgroundAsset}
          alt={activeStory.archetypeTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-[0.35] contrast-125 scale-105 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
      </div>

      {/* TOP HEADER & PROGRESS BARS */}
      <div className="relative z-20 space-y-3 pt-1">
        {/* Segmented Timer Bars */}
        <div className="flex items-center gap-1.5 w-full">
          {STORIES.map((story, idx) => {
            const isFilled = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const barWidth = isFilled ? 100 : isCurrent ? progress : 0;

            return (
              <div
                key={story.id}
                className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  tactileEngine.triggerSelectionBuzz();
                  setActiveIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-red-500 overflow-hidden shrink-0 shadow-lg">
              <img
                src={activeStory.backgroundAsset}
                alt={activeStory.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm tracking-wider text-white">
                  {activeStory.archetypeTitle}
                </span>
                {activeStory.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-400">
                  {activeStory.creatorHandle}
                </span>
                <span className="text-[10px] font-mono text-red-400 bg-red-950/60 border border-red-800/60 px-1.5 py-0.2 rounded">
                  Verified Blueprint
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-program-reels"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="p-2 rounded-full bg-o1-well hover:bg-white/[0.06] text-neutral-300 hover:text-white transition-colors border border-white/[0.07] cursor-pointer"
            aria-label="Close stories"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TAP NAVIGATION ZONES (Left / Right) */}
      <div className="absolute inset-x-0 top-20 bottom-36 z-10 flex">
        <div
          className="w-1/3 h-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevStory();
          }}
          aria-label="Previous story"
        />
        <div className="w-1/3 h-full" />
        <div
          className="w-1/3 h-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleNextStory();
          }}
          aria-label="Next story"
        />
      </div>

      {/* CONTENT STAGE: Vector Highlights & Split Details */}
      <div className="relative z-20 space-y-4 my-auto py-4 px-1 max-w-lg mx-auto w-full">
        {/* Focus Muscle Vector Highlight */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-o1-crimson animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-300">
              Focus muscle vector highlight
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeStory.focusMuscles.map((muscle) => (
              <span
                key={muscle}
                className="px-3 py-1.5 rounded-xl bg-o1-crimson/20 border border-o1-crimson/40 text-red-200 text-xs font-mono font-bold tracking-wider"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>

        {/* Split Overview Details Card */}
        <div className="bg-o1-card border border-white/[0.07] rounded-2xl p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="font-mono font-bold text-xs tracking-wider text-white">
                {activeStory.splitOverview.daysPerWeek}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
              {activeStory.splitOverview.intensity}
            </span>
          </div>

          <p className="text-xs font-sans text-neutral-300 leading-relaxed">
            {activeStory.splitOverview.protocol}
          </p>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 block">
              Target exercise vector blueprints:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeStory.splitOverview.keyLifts.map((lift) => (
                <div
                  key={lift}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-200 bg-white/5 border border-white/[0.07] rounded-xl px-2.5 py-1.5"
                >
                  <Zap className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate">{lift}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: CRIMSON CTA BUTTON */}
      <div className="relative z-20 pt-2 pb-1 max-w-lg mx-auto w-full">
        <button
          type="button"
          id="btn-adopt-blueprint"
          onClick={handleAdoptBlueprint}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>[ Adopt this blueprint ]</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 px-1">
          <span className="flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Tap left to reverse
          </span>
          <span>Hold screen to pause</span>
          <span className="flex items-center gap-1">
            Tap right to advance <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProgramReelsModal;
