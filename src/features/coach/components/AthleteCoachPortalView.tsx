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
import { tactileEngine } from '../../../services/tactileEngine';
import { useActiveProgramStore } from '../../../stores/useActiveProgramStore';

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
    const schedule = (prog?.sampleWeek || []).map((day, index) => ({
      dayIndex: index,
      dayName: day.dayName || `Day ${index + 1}`,
      title: day.dayName || `Day ${index + 1}`,
      focus: day.focus || prog.title,
      isRestDay: !day.exercises || day.exercises.length === 0,
      exercises: (day.exercises || []).map((exercise) => ({
        name: exercise.name || 'Exercise',
        sets: exercise.sets || 3,
        reps: parseInt(exercise.reps || '8', 10) || 8,
        weightKg: 0,
        rpe: 8,
        targetMuscle: day.focus,
      })),
    }));
    if (schedule.length > 0) {
      useActiveProgramStore.getState().enrollProgram({
        id: prog.id,
        title: prog.title,
        coachName: prog.coachName,
        coachAvatar: prog.coachAvatar,
        schedule,
      });
      showToast(`${prog.title} is on your log. Start day 1 when you are ready.`);
    } else {
      showToast(`${prog.title} is saved. The coach has not designed the days yet.`);
    }
  }, [showToast]);

  return (
    <div id="athlete-coach-portal" className="w-full space-y-3.5 select-none">
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub navigation bar */}
      <div className="w-full bg-o1-card border border-white/[0.07] p-1 rounded-2xl flex items-center gap-1 shadow-xs">
        {(['coaches', 'programs', 'checkins', 'messages'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setSubTab(tab); }}
            className={`flex-1 py-1.5 text-center text-[10px] font-tactical font-black tracking-wider rounded-xl transition cursor-pointer ${
              subTab === tab ? 'bg-o1-crimson text-white' : 'text-neutral-500 hover:text-white'
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
