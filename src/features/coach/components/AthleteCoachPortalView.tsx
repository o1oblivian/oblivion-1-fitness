import React, { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AthleteVerifiedCoaches } from './AthleteVerifiedCoaches';
import { CoachProfileShowcase } from './CoachProfileShowcase';
import { DailyCheckInProgress } from './DailyCheckInProgress';
import { CoachInboxView } from './CoachInboxView';
import { ProgramCheckoutModal } from './ProgramCheckoutModal';
import { CoachFullProfileModal } from './CoachFullProfileModal';
import { VERIFIED_COACH_PROFILE, COACH_MARKETPLACE_PROGRAMS, COACH_VERIFIED_REVIEWS } from '../data/coachMarketplaceData';
import { CoachMarketplaceProgram, AthleteCheckInSubmission, CoachProfile } from '../types/coachPlatformTypes';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { tactileEngine } from '../../../services/tactileEngine';

export const AthleteCoachPortalView: React.FC = () => {
  const [subTab, setSubTab] = useState<'coaches' | 'programs' | 'checkins' | 'messages'>('coaches');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<CoachMarketplaceProgram | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const handleProgramEnrolled = useCallback((prog: CoachMarketplaceProgram) => {
    if (prog?.sampleWeek && prog.sampleWeek.length > 0) {
      const d1 = prog.sampleWeek[0];
      const logs = (d1?.exercises ?? []).map((ex, idx) => ({
        id: `prog-${prog.id}-${idx}`,
        name: ex?.name || 'Movement',
        exerciseName: ex?.name || 'Movement',
        targetMuscle: d1?.focus || 'Hypertrophy',
        equipment: 'barbell',
        tier: `${prog.title} • Day 1`,
        restSecs: 90,
        sets: Array.from({ length: ex?.sets || 3 }, (_, sIdx) => ({
          id: `set-${Date.now()}-${sIdx}`,
          setNumber: sIdx + 1,
          reps: parseInt(ex?.reps || '10', 10) || 10,
          weightKg: 60,
          rpe: 8.5,
          completed: false,
        })),
        notes: ex?.notes || `Prescribed in ${prog.title}`,
      }));
      useWorkoutStore.getState().setActiveLogs(logs);
      useWorkoutStore.getState().setActiveSession(true);
      useWorkoutStore.getState().setActiveRoutine(`${prog.title} - ${d1.dayName}`);
      showToast(`🎉 Enrolled! ${d1.dayName} loaded to Workout tab.`);
    } else {
      showToast(`🎉 Successfully enrolled in ${prog?.title || 'Program'}!`);
    }
  }, [showToast]);

  return (
    <div id="athlete-coach-portal" className="w-full max-w-md mx-auto px-3.5 sm:px-4 space-y-3.5 pb-28 select-none">
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub navigation bar */}
      <div className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl flex items-center gap-1 shadow-xs">
        {(['coaches', 'programs', 'checkins', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setSubTab(tab); }}
            className={`flex-1 py-1.5 text-center text-[10px] font-tactical font-black tracking-wider uppercase rounded-xl transition cursor-pointer ${
              subTab === tab ? 'bg-[#C4121A] text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {subTab === 'coaches' && (
        <AthleteVerifiedCoaches
          onSelectCoach={(c) => setSelectedCoach(c as CoachProfile)}
          onBookCoaching={(c) => { showToast(`Applied for Coach ${c?.name ?? 'Coach'} roster!`); setSubTab('messages'); }}
        />
      )}

      {subTab === 'programs' && (
        <CoachProfileShowcase
          coach={selectedCoach || VERIFIED_COACH_PROFILE}
          programs={COACH_MARKETPLACE_PROGRAMS ?? []}
          reviews={COACH_VERIFIED_REVIEWS ?? []}
          onSelectProgram={setSelectedProgram}
          onBookCoaching={(p) => { showToast(`Applied for Coach ${p} Roster!`); setSubTab('messages'); }}
          onOpenReviews={() => {}}
          onOpenCoachProfile={() => setSelectedCoach(selectedCoach || VERIFIED_COACH_PROFILE)}
        />
      )}

      {subTab === 'checkins' && (
        <DailyCheckInProgress
          checkins={checkinsList ?? []}
          onReplyFeedback={(id, fb) => {
            setCheckinsList((prev) => (prev ?? []).map((c) => c.id === id ? { ...c, coachFeedback: { feedbackText: fb, givenAt: 'Just now', status: 'reviewed' } } : c));
            showToast('Feedback noted!');
          }}
          onSubmitNewCheckin={(c) => {
            setCheckinsList((prev) => [{ ...c, id: `chk-${Date.now()}`, coachFeedback: { feedbackText: '', givenAt: 'Pending', status: 'pending' } }, ...(prev ?? [])]);
            showToast('Check-in submitted to your coach!');
          }}
        />
      )}

      {subTab === 'messages' && <CoachInboxView />}

      <ProgramCheckoutModal
        program={selectedProgram}
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onEnrollSuccess={handleProgramEnrolled}
        onOpenCoachProfile={() => setSelectedCoach(selectedCoach || VERIFIED_COACH_PROFILE)}
      />

      <CoachFullProfileModal
        coach={selectedCoach}
        isOpen={!!selectedCoach}
        onClose={() => setSelectedCoach(null)}
        programs={COACH_MARKETPLACE_PROGRAMS ?? []}
        reviews={COACH_VERIFIED_REVIEWS ?? []}
        onSelectProgram={(p) => { setSelectedCoach(null); setSelectedProgram(p); }}
        onBookCoaching={(c) => { setSelectedCoach(null); showToast(`Applied for Coach ${c?.name ?? 'Coach'} roster!`); setSubTab('messages'); }}
      />
    </div>
  );
};

export default AthleteCoachPortalView;
