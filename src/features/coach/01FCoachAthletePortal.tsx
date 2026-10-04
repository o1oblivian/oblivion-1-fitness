import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { O1FCoachHeader } from './components/O1FCoachHeader';
import { O1FCoachStatusCard } from './components/O1FCoachStatusCard';
import { O1FClubProgramStore } from './components/O1FClubProgramStore';
import { O1FVerifiedRoster } from './components/O1FVerifiedRoster';
import { DailyCheckInProgress } from './components/DailyCheckInProgress';
import { CoachInboxView } from './components/CoachInboxView';
import { CoachFullProfileModal } from './components/CoachFullProfileModal';
import { CoachMarketplaceProgram, AthleteCheckInSubmission, CoachProfile } from './types/coachPlatformTypes';
import { tactileEngine } from '../../services/tactileEngine';

export interface O1FCoachAthletePortalProps {
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (p: 'coach' | 'athlete') => void;
  isCoach?: boolean;
}

export const O1FCoachAthletePortal: React.FC<O1FCoachAthletePortalProps> = ({
  activePerspective = 'athlete',
  onChangePerspective,
  isCoach = false,
}) => {
  const [portalTab, setPortalTab] = useState<'roster' | 'store' | 'checkins' | 'messages'>('roster');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [coachesList, setCoachesList] = useState<CoachProfile[]>([]);
  const [programsList, setProgramsList] = useState<CoachMarketplaceProgram[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>([]);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); }, []);

  // Fetch real verified coach profiles & published digital protocols from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: cData }, { data: pData }] = await Promise.all([
          supabase.from('coach_profiles').select('*').eq('is_verified', true),
          supabase.from('coach_programs').select('*').eq('status', 'published'),
        ]);
        setCoachesList(Array.isArray(cData) ? (cData as CoachProfile[]) : []);
        setProgramsList(Array.isArray(pData) ? (pData as CoachMarketplaceProgram[]) : []);
      } catch {
        setCoachesList([]);
        setProgramsList([]);
      }
    };
    fetchData();
  }, []);

  return (
    <div id="o1fcoach-athlete-portal" className="w-full max-w-md mx-auto px-3.5 sm:px-4 space-y-3.5 pb-28 select-none pt-1">
      <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-3 shadow-xs">
        <O1FCoachHeader activePerspective={activePerspective} onChangePerspective={onChangePerspective} isCoach={isCoach} />
      </div>

      {toastMsg && <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-mono font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{toastMsg}</span></div>}

      <O1FCoachStatusCard linkedCoach={null} onBrowseRoster={() => setPortalTab('roster')} onOpenMessage={() => setPortalTab('messages')} onSubmitCheckin={() => setPortalTab('checkins')} />

      <div className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl flex items-center gap-1 shadow-xs">
        {(['roster', 'store', 'checkins', 'messages'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setPortalTab(tab); }} className={`flex-1 py-1.5 text-center text-[10px] font-tactical font-black tracking-wider uppercase rounded-xl transition cursor-pointer ${portalTab === tab ? 'bg-[#C4121A] text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
            {tab === 'roster' ? 'COACHES' : tab === 'store' ? 'STORE' : tab}
          </button>
        ))}
      </div>

      {portalTab === 'roster' && <O1FVerifiedRoster coaches={coachesList} onSelectCoach={(c) => setSelectedCoach(c as CoachProfile)} onBookCoaching={(c) => { showToast(`Application initiated for Coach ${c?.name ?? 'Coach'}`); setPortalTab('messages'); }} />}
      {portalTab === 'store' && <O1FClubProgramStore programs={programsList} />}
      {portalTab === 'checkins' && <DailyCheckInProgress checkins={checkinsList ?? []} onReplyFeedback={(id, fb) => { setCheckinsList((prev) => (prev ?? []).map((c) => c.id === id ? { ...c, coachFeedback: { feedbackText: fb, givenAt: 'Just now', status: 'reviewed' } } : c)); showToast('Feedback noted!'); }} onSubmitNewCheckin={(c) => { setCheckinsList((prev) => [{ ...c, id: `chk-${Date.now()}`, coachFeedback: { feedbackText: '', givenAt: 'Pending', status: 'pending' } }, ...(prev ?? [])]); showToast('Check-in submitted to your coach!'); }} />}
      {portalTab === 'messages' && <CoachInboxView />}

      <CoachFullProfileModal coach={selectedCoach} isOpen={!!selectedCoach} onClose={() => setSelectedCoach(null)} programs={programsList} reviews={[]} onSelectProgram={() => {}} onBookCoaching={(c) => { setSelectedCoach(null); showToast(`Application initiated for Coach ${c?.name ?? 'Coach'}`); setPortalTab('messages'); }} />
    </div>
  );
};

export default O1FCoachAthletePortal;
