import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>([]);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); }, []);

  // Fetch real verified coach profiles & published digital protocols directly from Supabase
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setSupabaseError(null);
      try {
        const [{ data: cData, error: cError }, { data: pData, error: pError }] = await Promise.all([
          supabase.from('coach_profiles').select('*'),
          supabase.from('coach_programs').select('*').eq('status', 'published'),
        ]);

        if (isCancelled) return;

        if (cError) {
          console.error('[01FCoach] Live Supabase coach_profiles query error:', cError);
          setSupabaseError(cError.message || 'Database query error reading coach_profiles.');
          setCoachesList([]);
        } else if (Array.isArray(cData) && cData.length > 0) {
          const mappedCoaches: CoachProfile[] = cData.map((c: any, idx: number) => ({
            id: c.id || `coach-${idx}`,
            name: c.display_name || c.name || 'Verified Coach',
            handle: c.handle || `@${(c.display_name || 'coach').toLowerCase().replace(/\s+/g, '_')}`,
            role: c.role || 'Senior Performance Coach',
            avatar: c.avatar_url || c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
            bannerImage: c.banner_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
            bio: c.bio || 'Oblivion 1 Certified Coach',
            rating: Number(c.rating || 5.0),
            reviewsCount: Number(c.reviews_count || 0),
            activeClientsCount: Number(c.active_clients_count || 0),
            specialties: Array.isArray(c.specialties) ? c.specialties : ['Strength & Conditioning', 'Telemetry Programming'],
            certifications: Array.isArray(c.certifications) ? c.certifications : ['CSCS*D', 'USAW L3'],
            slotsRemaining: Number(c.slots_remaining || 0),
            pricing: { monthlyOneOnOneUsd: 189, teamSubscriptionUsd: 49 },
          }));
          setCoachesList(mappedCoaches);
        } else {
          // Live Supabase query returned 0 rows - genuine empty state
          setCoachesList([]);
        }

        if (pError) {
          console.error('[01FCoach] Live Supabase coach_programs query error:', pError);
          if (!cError) {
            setSupabaseError(pError.message || 'Database query error reading coach_programs.');
          }
          setProgramsList([]);
        } else if (Array.isArray(pData) && pData.length > 0) {
          setProgramsList(pData as CoachMarketplaceProgram[]);
        } else {
          // Live Supabase query returned 0 rows - genuine empty state
          setProgramsList([]);
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('[01FCoach] Critical Supabase connection failure:', err);
        setSupabaseError(err?.message || 'Network exception communicating with live Supabase database.');
        setCoachesList([]);
        setProgramsList([]);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div id="o1fcoach-athlete-portal" className="w-full max-w-md mx-auto px-3.5 sm:px-4 space-y-3.5 pb-28 select-none pt-1">
      <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-3 shadow-xs">
        <O1FCoachHeader activePerspective={activePerspective} onChangePerspective={onChangePerspective} isCoach={isCoach} />
      </div>

      {toastMsg && (
        <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {supabaseError && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono font-bold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-0.5">
            <span className="block font-tactical tracking-wide uppercase">SUPABASE DATABASE RESPONSE</span>
            <span className="text-[11px] font-mono text-red-400 font-normal">{supabaseError}</span>
          </div>
        </div>
      )}

      <O1FCoachStatusCard linkedCoach={null} onBrowseRoster={() => setPortalTab('roster')} onOpenMessage={() => setPortalTab('messages')} onSubmitCheckin={() => setPortalTab('checkins')} />

      <div className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl flex items-center gap-1 shadow-xs">
        {(['roster', 'store', 'checkins', 'messages'] as const).map((tab) => (
          <button key={tab} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setPortalTab(tab); }} className={`flex-1 py-1.5 text-center text-[10px] font-tactical font-black tracking-wider uppercase rounded-xl transition cursor-pointer ${portalTab === tab ? 'bg-[#C4121A] text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
            {tab === 'roster' ? 'COACHES' : tab === 'store' ? 'STORE' : tab}
          </button>
        ))}
      </div>

      {portalTab === 'roster' && (
        isLoading ? (
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214] rounded-2xl p-6 text-center space-y-2.5 shadow-xs">
            <p className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider animate-pulse">
              QUERYING LIVE SUPABASE ROSTER...
            </p>
          </div>
        ) : (
          <O1FVerifiedRoster coaches={coachesList} onSelectCoach={(c) => setSelectedCoach(c as CoachProfile)} onBookCoaching={(c) => { showToast(`Application initiated for Coach ${c?.name ?? 'Coach'}`); setPortalTab('messages'); }} />
        )
      )}
      {portalTab === 'store' && (
        isLoading ? (
          <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214] rounded-2xl p-6 text-center space-y-2.5 shadow-xs">
            <p className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider animate-pulse">
              QUERYING LIVE SUPABASE STORE...
            </p>
          </div>
        ) : (
          <O1FClubProgramStore programs={programsList} />
        )
      )}
      {portalTab === 'checkins' && <DailyCheckInProgress checkins={checkinsList ?? []} onReplyFeedback={(id, fb) => { setCheckinsList((prev) => (prev ?? []).map((c) => c.id === id ? { ...c, coachFeedback: { feedbackText: fb, givenAt: 'Just now', status: 'reviewed' } } : c)); showToast('Feedback noted!'); }} onSubmitNewCheckin={(c) => { setCheckinsList((prev) => [{ ...c, id: `chk-${Date.now()}`, coachFeedback: { feedbackText: '', givenAt: 'Pending', status: 'pending' } }, ...(prev ?? [])]); showToast('Check-in submitted to your coach!'); }} />}
      {portalTab === 'messages' && <CoachInboxView />}

      <CoachFullProfileModal coach={selectedCoach} isOpen={!!selectedCoach} onClose={() => setSelectedCoach(null)} programs={programsList} reviews={[]} onSelectProgram={() => {}} onBookCoaching={(c) => { setSelectedCoach(null); showToast(`Application initiated for Coach ${c?.name ?? 'Coach'}`); setPortalTab('messages'); }} />
    </div>
  );
};

export default O1FCoachAthletePortal;
