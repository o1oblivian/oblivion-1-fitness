import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Shield,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ArchetypeBlueprint, PHASE_LABELS, Phase } from '@/data/archetypeBlueprints';
import { getArchetypeImage, PREMIUM_ARCHETYPES } from '@/data/archetypeVisuals';
import { useSubscription } from '@/utils/useSubscription';
import { useModalBackHandler } from '@/utils/modalHistory';

interface ArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: ArchetypeBlueprint | null;
  onLoadExercises: (exercises: string[], sourceName: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  onUpgrade?: () => void;
}

export const ArchetypeModal: React.FC<ArchetypeModalProps> = ({
  isOpen,
  onClose,
  archetype,
  onLoadExercises,
  showToast,
  onUpgrade,
}) => {
  useModalBackHandler(isOpen, onClose, 'archetype_modal');
  const { canAccess } = useSubscription();

  const hasAccess = canAccess('archetypes');
  const [selectedPhase, setSelectedPhase] = useState<'all' | Phase>('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPhase('all');
      setLoaded(false);
    }
  }, [isOpen, archetype]);

  if (!isOpen || !archetype) return null;

  const isPremium = PREMIUM_ARCHETYPES.has(archetype.id);
  const isLocked = isPremium && !hasAccess;
  const coverPhoto = getArchetypeImage(archetype);

  // Group exercises by phase
  const allPhases = (['warmup', 'prime', 'main', 'accessory', 'finisher'] as Phase[]).filter(
    (ph) => archetype.exercises.some((e) => e.phase === ph)
  );

  const displayedExercises = selectedPhase === 'all'
    ? archetype.exercises
    : archetype.exercises.filter((e) => e.phase === selectedPhase);

  const handleLoadWorkout = () => {
    if (isLocked) {
      if (onUpgrade) {
        onUpgrade();
      } else {
        showToast?.('Upgrade to Elite/Black Card to unlock this archetype', 'error');
      }
      return;
    }

    const exerciseNames = archetype.exercises.map((e) => e.name);
    onLoadExercises(exerciseNames, `Archetype: ${archetype.name}`);
    setLoaded(true);
    showToast?.(`Loaded ${exerciseNames.length} exercises from ${archetype.name}`, 'success');

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return createPortal(
    <div
      id="archetype-modal-backdrop"
      className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="archetype-modal-container"
        className="relative w-full max-w-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl h-[88dvh] sm:h-[82vh] max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-300 text-zinc-900 dark:text-white"
      >
        {/* Top Controls inside Card */}
        <div className="absolute top-3 right-3 z-30">
          <button
            id="btn-close-archetype-modal"
            type="button"
            onClick={onClose}
            className="btn-nude-close !text-white hover:!text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container covering Hero + Stats + Filters + Lifts */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {/* Hero Banner */}
          <div className="relative h-36 sm:h-44 w-full shrink-0 overflow-hidden">
            <img
              src={coverPhoto}
              alt={archetype.name}
              className="w-full h-full object-cover brightness-[0.75] contrast-[1.05]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges on Top Left */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white flex items-center gap-1">
                <span>{archetype.difficulty}</span>
                <span>•</span>
                <span>{archetype.focusKey.toUpperCase()}</span>
              </span>
              {isPremium && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  Elite
                </span>
              )}
            </div>

            {/* Title & Tagline inside banner */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {archetype.name}
              </h2>
              <p className="text-xs text-zinc-200 mt-0.5 line-clamp-1">
                {archetype.tagline}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold block">Phase</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">{archetype.difficulty}</span>
            </div>
            <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold block">Focus</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">{archetype.focusKey}</span>
            </div>
            <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold block">Lifts</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">{archetype.exercises.length}</span>
            </div>
            <div className="space-y-0.5 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold block">Est. Time</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white">45-60m</span>
            </div>
          </div>

          {/* Philosophy Note */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 leading-relaxed italic">
              "{archetype.philosophy}"
            </p>
          </div>

          {/* Phase Filter Tabs */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md px-4 py-2.5 border-y border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedPhase('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPhase === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/60 dark:border-zinc-700/50'
              }`}
            >
              All Lifts ({archetype.exercises.length})
            </button>
            {allPhases.map((phaseKey) => {
              const count = archetype.exercises.filter((e) => e.phase === phaseKey).length;
              return (
                <button
                  key={phaseKey}
                  type="button"
                  onClick={() => setSelectedPhase(phaseKey)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPhase === phaseKey
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/60 dark:border-zinc-700/50'
                  }`}
                >
                  {PHASE_LABELS[phaseKey]} ({count})
                </button>
              );
            })}
          </div>

          {/* Exercise List */}
          <div className="px-4 py-3 space-y-3 pb-6">
            {/* Target Areas */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 mr-1">Target:</span>
              {archetype.muscleGroups.map((muscle) => (
                <span
                  key={muscle}
                  className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {muscle}
                </span>
              ))}
            </div>

            {/* Exercise items */}
            <div className="space-y-2">
              {displayedExercises.map((ex, idx) => (
                <div
                  key={ex.name + idx}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {ex.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-[#EA4335] uppercase tracking-wider">
                          {PHASE_LABELS[ex.phase]}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pl-7.5">
                    <span>Rest: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{ex.restSec}s</strong></span>
                    {ex.tempo && <span>Tempo: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{ex.tempo}</strong></span>}
                  </div>

                  {ex.tip && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic border-l-2 border-zinc-300 dark:border-zinc-700 ml-7.5 pl-2.5 mt-0.5">
                      {ex.tip}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Button */}
        <div className="p-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] bg-white dark:bg-[#18181B] border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button
            id="btn-load-archetype-workout"
            type="button"
            onClick={handleLoadWorkout}
            disabled={loaded}
            className={`w-full py-3 px-4 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs ${
              isLocked
                ? 'bg-[#EA4335] text-white hover:bg-red-600'
                : loaded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#EA4335] text-white hover:bg-red-600'
            }`}
          >
            {loaded ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Blueprint Loaded to OS</span>
              </>
            ) : isLocked ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Unlock Blueprint (Elite)</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Load Blueprint ({archetype.exercises.length} Exercises)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
