import React, { useMemo } from 'react';
import { useTrainingSummary } from '../useTrainingSummary';
import { UserPlus, Play, ChevronRight, Share2, Camera } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useUserStore } from '../../../stores/useUserStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useActiveProgramStore } from '../../../stores/useActiveProgramStore';
import { useDayRoutineRevision } from '../../workout/services/dayRoutineService';
import { resolveTodaySession, startTodaySession } from '../todaySession';
import { SplitOption } from '../types';
import { athleteLabel } from '../athleteLabel';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';

interface UnifiedTopBoardProps {
  onOpenInvite: () => void;
  onChooseRoutine: (split: SplitOption) => void;
  onShareProgress: () => void;
  onOpenPhotoVault: () => void;
  onOpenSettings?: () => void;
}

export const UnifiedTopBoard: React.FC<UnifiedTopBoardProps> = ({
  onOpenInvite,
  onChooseRoutine,
  onShareProgress,
  onOpenPhotoVault,
  onOpenSettings,
}) => {
  const user = useUserStore();
  const buddyName = useBuddyProfileStore((s) => s.displayName);
  const assignedWorkouts = useCoachStore((s) => s.assignedWorkouts);
  const hasActiveProgram = useActiveProgramStore((s) => s.hasActiveProgram);
  const currentDayIndex = useActiveProgramStore((s) => s.currentDayIndex);
  const programTitle = useActiveProgramStore((s) => s.programTitle);
  const routineRevision = useDayRoutineRevision();

  const athleteName = athleteLabel(user.name, user.handle, buddyName);
  const athleteWeight = user.weightKg > 0 ? user.weightKg.toFixed(1) : '--';
  const targetWeight = user.targetWeightKg > 0 ? user.targetWeightKg.toFixed(1) : '--';

  const session = useMemo(
    () => resolveTodaySession(),
    [assignedWorkouts, hasActiveProgram, currentDayIndex, programTitle, routineRevision],
  );
  const targetRpe = session.exercises[0]?.sets?.[0]?.rpe || null;
  const training = useTrainingSummary();

  const handleStart = () => {
    if (session.origin === 'none' || session.exercises.length === 0) {
      tactileEngine.triggerSelectionBuzz();
      onChooseRoutine('Push');
      return;
    }
    tactileEngine.playPRCelebration();
    startTodaySession(session);
    useCoachStore.getState().updateLiveTelemetry({
      athleteId: 'ath-current',
      athleteName,
      activeExercise: session.exercises[0]?.name || session.title,
      currentSet: 1,
      currentWeightKg: session.exercises[0]?.sets?.[0]?.weightKg || 0,
      currentRpe: Number(targetRpe) || 0,
      sessionTonnageKg: 0,
      isLive: true,
      lastUpdated: 'Live right now',
    });
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  return (
    <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-4 sm:p-5 shadow-sm space-y-4 select-none relative overflow-hidden transition-colors">
      {/* ============================================================== */}
      {/* 1. ATHLETE PROFILE ROW (NON-CLICKABLE, REAL AVATAR PHOTO)      */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-3">
          {/* Avatar: Displays genuine athlete photo from user profile settings */}
          <div className="relative w-12 h-12 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={athleteName || 'Profile'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-sans font-bold text-white text-base tracking-tight select-none">
                O1
              </span>
            )}
          </div>

          {/* Profile Details: Athlete Name */}
          <div className="flex items-center gap-2">
            {athleteName ? (
              <span className="font-bold text-base text-white tracking-tight">{athleteName}</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onOpenSettings?.();
                }}
                className="font-bold text-base text-white tracking-tight"
              >
                Set your name
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions (Add / INVITE) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenInvite();
            }}
            className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
            aria-label="Invite friends"
          >
            <span className="text-sm font-semibold text-white">
              Invite
            </span>

            <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.07] flex items-center justify-center text-neutral-200 group-hover:bg-o1-crimson group-hover:text-white group-hover:border-o1-crimson transition-colors shadow-xs">
              <UserPlus className="w-5 h-5 stroke-[2]" />
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. COACH ROUTINE DISPATCH / READY TO TRAIN SECTION             */}
      {/* ============================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {session.title}
            </h2>
            <p className="text-xs text-neutral-400 font-medium">
              {session.detail}
            </p>
          </div>

          {/* TARGET RPE Box */}
          <div className="shrink-0 bg-white/[0.03] rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[76px] space-y-0.5">
            <span className="text-[9px] font-bold text-neutral-500 tracking-wider text-center">
              Target RPE
            </span>
            <span className="text-lg font-sans font-semibold text-white tabular-nums leading-none">
              {typeof targetRpe === 'number' && targetRpe > 0 ? targetRpe.toFixed(1) : '--'}
            </span>
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((dot) => {
                const active = targetRpe ? dot <= Math.round(Number(targetRpe) / 2) : false;
                return (
                  <span
                    key={dot}
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-[#D4A017]' : 'bg-neutral-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          id="choose-routine-start-btn"
          onClick={handleStart}
          className="w-full py-3.5 px-4 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <span className="truncate">{session.button}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Structural Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* ============================================================== */}
      {/* 3. KINEMATIC BENCHMARK & PROGRESS HUB                          */}
      {/* ============================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {athleteWeight}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-400">
                KG
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 tracking-wider">
              Bodyweight
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-white tracking-tight">
                {targetWeight}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-400">
                KG
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 tracking-wider">
              Goal Weight
            </span>
          </div>
        </div>

        {/* Real training numbers from logged workout days */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          {[
            { label: '7-day volume', value: training.sessions7d > 0 ? `${training.volume7dKg.toLocaleString()} kg` : '--' },
            { label: 'Streak', value: training.streakDays > 0 ? `${training.streakDays} d` : '--' },
            { label: 'Sessions 7d', value: training.sessions7d > 0 ? String(training.sessions7d) : '--' },
          ].map((chip) => (
            <div key={chip.label} className="py-2 rounded-xl bg-white/[0.03] min-h-[44px] flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-white">{chip.value}</span>
              <span className="text-[9px] tracking-wider text-neutral-500">{chip.label}</span>
            </div>
          ))}
        </div>

        {/* Dual Actions: Share Progress & Photo Vault */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onShareProgress();
            }}
            className="o1-pill bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-neutral-200 text-xs font-sans font-semibold active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenPhotoVault();
            }}
            className="o1-pill bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-neutral-200 text-xs font-sans font-semibold active:scale-95 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-400" />
            <span>Vault</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTopBoard;
