import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useModalStore } from '../../components/modals/useModalStore';
import { Athlete, enrollCoachClient, fetchCoachClients, fetchCoachDirectives, fetchCoachEarnings, fetchCoachMessages, liveDirectives, publishCoachNote, readStoredCheckins, writeStoredCheckins } from './services/coachService';
import { DirectiveItem } from './types/coachDirectives';
import { CoachEarnings, SquadAthlete } from '../../types';
import { useCoachRealtime } from './hooks/useCoachRealtime';
import { CoachFloor } from './components/CoachFloor';
import { AddClientModal } from './components/AddClientModal';
import { CoachCommandCenterModals } from './components/CoachCommandCenterModals';
import { AthleteCheckInSubmission } from './types/coachPlatformTypes';
import { tactileEngine } from '../../services/tactileEngine';
import { HealthDisclaimerBanner } from '../legal';
import { getAuthenticatedUserId } from '../../services/authUser';
import { safeStorage } from '../../utils/safeStorage';
import { getOrCreateInviteCode } from '../log/publicShare';
import { fetchFinishedForCoach, fetchRemoteCheckins, persistFinishedLocal, publishCoachInvite, readFinishedLocal } from './services/coachBridge';
import { useCoachStore } from '../../stores/useCoachStore';
import { coachPeople } from './services/floorRoster';

export interface O1FCoachCommandCenterProps {
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (p: 'coach' | 'athlete') => void;
  isCoach?: boolean;
}

export const O1FCoachCommandCenter: React.FC<O1FCoachCommandCenterProps> = ({
  isCoach = false,
}) => {
  const userRole = useAuthStore((s) => s.profile?.role);
  const isVerifiedCoach = Boolean(isCoach || userRole === 'coach');
  const [liveCoachId, setLiveCoachId] = useState('');
  useCoachRealtime(liveCoachId);

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [directives, setDirectives] = useState<DirectiveItem[]>([]);
  const [earnings, setEarnings] = useState<CoachEarnings>([]);
  const [modals, setModals] = useState({ programs: false, dispatch: false, workout: false, vault: false, vaultAdd: false, reelUpload: false, payoutSettings: false });
  const [shareOpen, setShareOpen] = useState(false);
  const [dispatchAthlete, setDispatchAthlete] = useState<Athlete | null>(null);
  const [dossierAthlete, setDossierAthlete] = useState<Athlete | null>(null);
  const [auditAthlete, setAuditAthlete] = useState<SquadAthlete | null>(null);
  const [assignAthlete, setAssignAthlete] = useState<SquadAthlete | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>(() => readStoredCheckins());
  const [messageCount, setMessageCount] = useState(0);

  const floorRoster = useMemo(() => coachPeople(athletes).people, [athletes]);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); }, []);

  const loadData = useCallback(async () => {
    const coachId = liveCoachId || (await getAuthenticatedUserId()) || '';
    if (!coachId) {
      const [localAthletes, localNotes, localMessages] = await Promise.all([
        fetchCoachClients(''),
        fetchCoachDirectives(''),
        fetchCoachMessages(''),
      ]);
      setAthletes(localAthletes);
      setDirectives(localNotes);
      setEarnings([]);
      setMessageCount(localMessages.length);
      return;
    }
    try {
      const [c, d, e, messages, remoteCheckins, remoteFinished] = await Promise.all([
        fetchCoachClients(coachId),
        fetchCoachDirectives(coachId),
        fetchCoachEarnings(coachId),
        fetchCoachMessages(coachId),
        fetchRemoteCheckins(coachId),
        fetchFinishedForCoach(coachId),
      ]);
      setAthletes(c);
      setDirectives(d);
      setEarnings(e);
      setMessageCount(messages.length);
      if (remoteCheckins.length) {
        setCheckinsList((prev) => {
          const byId = new Map(prev.map((row) => [row.id, row]));
          remoteCheckins.forEach((row) => {
            const local = byId.get(row.id);
            if (!local) byId.set(row.id, row);
            else if (row.coachFeedback?.feedbackText) byId.set(row.id, { ...local, coachFeedback: row.coachFeedback });
          });
          const next = Array.from(byId.values());
          writeStoredCheckins(next);
          return next;
        });
      }
      if (remoteFinished.length) {
        remoteFinished.forEach(persistFinishedLocal);
        const local = readFinishedLocal();
        useCoachStore.setState((state) => {
          const seen = new Set(state.finishedWorkouts.map((row) => row.id));
          const incoming = local.filter((row) => !seen.has(row.id));
          return incoming.length ? { finishedWorkouts: [...incoming, ...state.finishedWorkouts] } : {};
        });
      }
    } catch (err) { console.error('[01FCoach] sync error:', err); }
  }, [liveCoachId]);

  useEffect(() => {
    const local = readFinishedLocal();
    if (!local.length) return;
    useCoachStore.setState((state) => {
      const seen = new Set(state.finishedWorkouts.map((row) => row.id));
      const incoming = local.filter((row) => !seen.has(row.id));
      if (!incoming.length) return state;
      return { finishedWorkouts: [...incoming, ...state.finishedWorkouts] };
    });
  }, []);

  useEffect(() => {
    void getAuthenticatedUserId().then(async (id) => {
      const coachId = id || '';
      setLiveCoachId(coachId);
      if (!coachId) return;
      const email = localStorage.getItem('o1fc_user_email') || '';
      const code = getOrCreateInviteCode(email || coachId);
      const profile = useAuthStore.getState().profile;
      const user = useAuthStore.getState().user;
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const metaName = typeof meta.full_name === 'string' ? meta.full_name : '';
      await publishCoachInvite(code, {
        id: coachId,
        name: profile?.name || metaName || email.split('@')[0] || 'Coach',
        handle: typeof meta.handle === 'string' ? meta.handle : '',
        avatar: localStorage.getItem('o1_profile_avatar_url') || '',
      });
    });
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
    <div id="o1fcoach-command-center" className="w-full space-y-3.5 select-none pt-1">
      {toastMsg && <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-mono font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /><span>{toastMsg}</span></div>}

      <div className="space-y-4">
        <CoachFloor
          coachId={liveCoachId}
          athletes={athletes}
          checkins={checkinsList}
          messageCount={messageCount}
          notes={liveDirectives(directives)}
          earnings={earnings}
          onShowToast={showToast}
          onSendNote={(draft) => {
            const note: DirectiveItem = {
              id: `note-${Date.now()}`,
              tag: draft.tag,
              title: draft.title,
              summary: draft.summary,
              affectedCount: athletes.length,
              priority: 'NORMAL',
              badgeStyle: 'bg-o1-well text-neutral-200 border-white/[0.07]',
            };
            setDirectives((prev) => [note, ...prev.filter((item) => item.id !== note.id)]);
            void publishCoachNote(liveCoachId, note).then((saved) => {
              showToast(saved ? 'Note sent' : 'Saved on this phone');
            });
          }}
          onOpenPrograms={() => setModals((m) => ({ ...m, programs: true }))}
          onOpenWorkout={() => { setDispatchAthlete(null); setModals((m) => ({ ...m, workout: true })); }}
          onOpenVault={(addClip) => { tactileEngine.triggerSelectionBuzz(); setModals((m) => ({ ...m, vault: true, vaultAdd: Boolean(addClip) })); }}
          onOpenMessages={() => undefined}
          onOpenEarnings={() => undefined}
          onOpenCheckins={() => undefined}
          onOpenSettings={() => useModalStore.getState().openSettings()}
          onShareInvite={() => setShareOpen(true)}
          onSelectAthlete={setDossierAthlete}
        />
        <HealthDisclaimerBanner compact />
      </div>

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
        dispatchAthlete={dispatchAthlete}
        setDispatchAthlete={setDispatchAthlete}
        floorRoster={floorRoster}
      />
      <AddClientModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        onAddClient={(athlete) => {
          const stored = safeStorage.getItem<Athlete[]>('o1fc_custom_coach_clients', []) || [];
          safeStorage.setItem('o1fc_custom_coach_clients', [athlete, ...stored.filter((row) => row.id !== athlete.id)]);
          setAthletes((prev) => [athlete, ...prev.filter((row) => row.id !== athlete.id)]);
          void (async () => {
            const coachId = liveCoachId || (await getAuthenticatedUserId()) || '';
            if (!coachId) return;
            try {
              await enrollCoachClient(coachId, { ...athlete, client_id: athlete.id });
            } catch (err) {
              console.error('[Roster] enroll failed:', err);
            }
          })();
          showToast('Client added');
        }}
      />
    </div>
  );
};

export default O1FCoachCommandCenter;
