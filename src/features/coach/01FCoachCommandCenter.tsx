import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { Athlete, fetchCoachClients, fetchCoachDirectives, fetchCoachEarnings, fetchReviewSquad } from './services/coachService';
import { DirectiveItem } from './types/coachDirectives';
import { CoachEarnings, SquadAthlete } from '../../types';
import { useCoachStore } from '../../stores/useCoachStore';
import { useCoachRealtime } from './hooks/useCoachRealtime';
import { CoachHeaderDeck } from './components/CoachHeaderDeck';
import { ActiveRosterSection } from './components/ActiveRosterSection';
import { DirectiveSignalsSection } from './components/DirectiveSignalsSection';
import { AthleteReviewSection } from './components/AthleteReviewSection';
import { CoachInboxView } from './components/CoachInboxView';
import { CoachEarningsView } from './components/CoachEarningsView';
import { DailyCheckInProgress } from './components/DailyCheckInProgress';
import { CoachCommandCenterModals } from './components/CoachCommandCenterModals';
import { AthleteCheckInSubmission } from './types/coachPlatformTypes';
import { useSubscription } from '../../context/SubscriptionContext';
import { tactileEngine } from '../../services/tactileEngine';
import { HealthDisclaimerBanner } from '../legal';
import { getAuthenticatedUserId } from '../../services/authUser';

export interface O1FCoachCommandCenterProps {
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (p: 'coach' | 'athlete') => void;
  isCoach?: boolean;
}

export const O1FCoachCommandCenter: React.FC<O1FCoachCommandCenterProps> = ({
  activePerspective = 'coach',
  onChangePerspective = () => {},
  isCoach = false,
}) => {
  const userRole = useAuthStore((s) => s.profile?.role);
  const isVerifiedCoach = Boolean(isCoach || userRole === 'coach');
  const { isPro, openPaywall } = useSubscription();
  const { selectedSubTab, setSelectedSubTab } = useCoachStore();
  const [liveCoachId, setLiveCoachId] = useState('');
  useCoachRealtime(liveCoachId);

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [directives, setDirectives] = useState<DirectiveItem[]>([]);
  const [earnings, setEarnings] = useState<CoachEarnings>([]);
  const [squad, setSquad] = useState<SquadAthlete[]>([]);
  const [modals, setModals] = useState({ programs: false, dispatch: false, workout: false, vault: false, reelUpload: false, payoutSettings: false });
  const [dossierAthlete, setDossierAthlete] = useState<Athlete | null>(null);
  const [auditAthlete, setAuditAthlete] = useState<SquadAthlete | null>(null);
  const [assignAthlete, setAssignAthlete] = useState<SquadAthlete | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>([]);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); }, []);

  const loadData = useCallback(async () => {
    const coachId = liveCoachId || (await getAuthenticatedUserId()) || '';
    if (!coachId) {
      setAthletes([]);
      setDirectives([]);
      setEarnings([]);
      setSquad([]);
      return;
    }
    try {
      const [c, d, e, s] = await Promise.all([fetchCoachClients(coachId), fetchCoachDirectives(coachId), fetchCoachEarnings(coachId), fetchReviewSquad(coachId)]);
      setAthletes(c); setDirectives(d); setEarnings(e); setSquad(s);
    } catch (err) { console.error('[01FCoach] sync error:', err); }
  }, [liveCoachId]);

  useEffect(() => {
    void getAuthenticatedUserId().then((id) => setLiveCoachId(id || ''));
  }, []);

  useEffect(() => {
    if (!isVerifiedCoach) return;
    loadData();
    const ch = supabase.channel('coach-live-db-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'coach_clients' }, loadData).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData, isVerifiedCoach]);

  // Strict route security: non-coach users or unauthenticated tokens can never render internal coach telemetry
  if (!isVerifiedCoach) {
    return null;
  }

  return (
    <div id="o1fcoach-command-center" className="w-full max-w-md mx-auto px-4 space-y-3.5 pb-28 select-none pt-1">
      {toastMsg && <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{toastMsg}</span></div>}

      <CoachHeaderDeck
        currentSubTab={selectedSubTab}
        onSelectSubTab={setSelectedSubTab}
        onOpenPrograms={() => setModals((m) => ({ ...m, programs: true }))}
        onOpenWorkout={() => { tactileEngine.triggerSelectionBuzz(); setModals((m) => ({ ...m, workout: true })); }}
        onOpenVault={() => { if (!isPro) return openPaywall('Vault'); tactileEngine.triggerSelectionBuzz(); setModals((m) => ({ ...m, vault: true })); }}
        athletes={athletes}
        onSelectAthlete={setDossierAthlete}
        activePerspective={activePerspective}
        onChangePerspective={onChangePerspective}
      />

      {selectedSubTab === 'INTEL' && (
        <div className="space-y-4">
          <DirectiveSignalsSection directives={directives} onDeployDirective={(d) => { if (!isPro) return openPaywall('Broadcasts'); setModals((m) => ({ ...m, dispatch: true })); showToast(`Loaded: ${d.title}`); }} />
          <AthleteReviewSection athletes={squad} onAuditAthlete={setAuditAthlete} onAssignAthlete={setAssignAthlete} />
          <HealthDisclaimerBanner compact />
        </div>
      )}

      {selectedSubTab === 'CLIENTS' && <ActiveRosterSection athletes={athletes} onSelectAthlete={setDossierAthlete} />}
      {selectedSubTab === 'CHECKINS' && <DailyCheckInProgress checkins={checkinsList} onReplyFeedback={(id, fb) => { setCheckinsList((prev) => prev.map((c) => c.id === id ? { ...c, coachFeedback: { feedbackText: fb, givenAt: 'Just now', status: 'reviewed' } } : c)); showToast('Feedback dispatched!'); }} onSubmitNewCheckin={(chk) => { setCheckinsList((p) => [{ ...chk, id: `chk-${Date.now()}`, coachFeedback: { feedbackText: '', givenAt: 'Pending', status: 'pending' } }, ...p]); showToast('Check-in submitted!'); }} />}
      {selectedSubTab === 'INBOX' && <CoachInboxView />}
      {selectedSubTab === 'EARNINGS' && <CoachEarningsView transactions={earnings} activeClientsCount={athletes.length} onSanitizerAudit={setEarnings} onShowToast={showToast} />}

      <CoachCommandCenterModals
        modals={modals}
        setModals={setModals}
        athletes={athletes}
        dossierAthlete={dossierAthlete}
        setDossierAthlete={setDossierAthlete}
        auditAthlete={auditAthlete}
        setAuditAthlete={setAuditAthlete}
        assignAthlete={assignAthlete}
        setAssignAthlete={setAssignAthlete}
        showToast={showToast}
      />
    </div>
  );
};

export default O1FCoachCommandCenter;
