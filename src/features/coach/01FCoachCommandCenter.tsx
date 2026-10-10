import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { Athlete, fetchCoachClients, fetchCoachDirectives, liveDirectives, publishCoachNote, readStoredCheckins, writeStoredCheckins } from './services/coachService';
import { DirectiveItem } from './types/coachDirectives';
import { useCoachRealtime } from './hooks/useCoachRealtime';
import { CoachFloor } from './components/CoachFloor';
import { AddClientModal } from './components/AddClientModal';
import { CoachCommandCenterModals, type CoachModalFlags } from './components/CoachCommandCenterModals';
import { AthleteCheckInSubmission } from './types/coachPlatformTypes';
import { tactileEngine } from '../../services/tactileEngine';
import { HealthDisclaimerBanner } from '../legal';
import { getAuthenticatedUserId } from '../../services/authUser';
import { getOrCreateInviteCode } from '../log/publicShare';
import { fetchFinishedForCoach, fetchRemoteCheckins, persistFinishedLocal, publishCoachInvite, readFinishedLocal, saveCheckinReplyRemote } from './services/coachBridge';
import { useCoachStore } from '../../stores/useCoachStore';
import { coachPeople } from './services/floorRoster';
import { onCoachConsoleAction } from './services/coachConsoleBus';

export interface O1FCoachCommandCenterProps {
  isCoach?: boolean;
}

function mergeFinishedLocal() {
  const local = readFinishedLocal();
  if (!local.length) return;
  useCoachStore.setState((state) => {
    const seen = new Set(state.finishedWorkouts.map((row) => row.id));
    const incoming = local.filter((row) => !seen.has(row.id));
    return incoming.length ? { finishedWorkouts: [...incoming, ...state.finishedWorkouts] } : state;
  });
}

export const O1FCoachCommandCenter: React.FC<O1FCoachCommandCenterProps> = ({ isCoach = false }) => {
  const userRole = useAuthStore((s) => s.profile?.role);
  const isVerifiedCoach = Boolean(isCoach || userRole === 'coach');
  const [liveCoachId, setLiveCoachId] = useState('');
  useCoachRealtime(liveCoachId);

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [directives, setDirectives] = useState<DirectiveItem[]>([]);
  const [modals, setModals] = useState<CoachModalFlags>({ programs: false, workout: false, vault: false, vaultAdd: false });
  const [shareOpen, setShareOpen] = useState(false);
  const [dispatchAthlete, setDispatchAthlete] = useState<Athlete | null>(null);
  const [dossierAthlete, setDossierAthlete] = useState<Athlete | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkinsList, setCheckinsList] = useState<AthleteCheckInSubmission[]>(() => readStoredCheckins());
  const floorRoster = useMemo(() => coachPeople(athletes).people, [athletes]);
  const notes = useMemo(() => liveDirectives(directives), [directives]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const replyToCheckin = useCallback((checkinId: string, reply: string) => {
    setCheckinsList((prev) => {
      const next = prev.map((row) =>
        row.id === checkinId
          ? { ...row, coachFeedback: { ...row.coachFeedback, feedbackText: reply, givenAt: new Date().toISOString(), status: 'reviewed' as const } }
          : row,
      );
      writeStoredCheckins(next);
      return next;
    });
    void saveCheckinReplyRemote(checkinId, reply);
  }, []);

  const sendNoteToAll = (draft: { tag: DirectiveItem['tag']; title: string; summary: string }) => {
    const note: DirectiveItem = {
      id: `note-${Date.now()}`,
      tag: draft.tag,
      title: draft.title,
      summary: draft.summary,
      affectedCount: athletes.length,
      priority: 'NORMAL',
      badgeStyle: 'bg-o1-sheet text-o1-text border-white/[0.07]',
    };
    setDirectives((prev) => [note, ...prev]);
    void publishCoachNote(liveCoachId, note).then((saved) => {
      showToast(saved ? 'Sent to all clients' : 'Saved on this phone');
    });
  };

  const openWorkout = (athlete: Athlete | null) => {
    setDispatchAthlete(athlete);
    setModals((m) => ({ ...m, workout: true }));
  };

  const loadData = useCallback(async () => {
    const coachId = liveCoachId || (await getAuthenticatedUserId()) || '';
    if (!coachId) {
      const [localAthletes, localNotes] = await Promise.all([fetchCoachClients(''), fetchCoachDirectives('')]);
      setAthletes(localAthletes);
      setDirectives(localNotes);
      return;
    }
    try {
      const [clients, coachNotes, remoteCheckins, remoteFinished] = await Promise.all([
        fetchCoachClients(coachId),
        fetchCoachDirectives(coachId),
        fetchRemoteCheckins(coachId),
        fetchFinishedForCoach(coachId),
      ]);
      setAthletes(clients);
      setDirectives(coachNotes);
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
        mergeFinishedLocal();
      }
    } catch (err) {
      console.error('[01FCoach] sync error:', err);
    }
  }, [liveCoachId]);

  useEffect(mergeFinishedLocal, []);

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
    void loadData();
    const ch = supabase.channel(`coach-live-db-sync-${liveCoachId || 'local'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_clients' }, loadData);
    if (liveCoachId) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'athlete_checkins', filter: `coach_id=eq.${liveCoachId}` }, loadData);
    }
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData, isVerifiedCoach, liveCoachId]);

  useEffect(() => {
    if (!isVerifiedCoach) return;
    return onCoachConsoleAction((action) => {
      if (action === 'dispatch') setDispatchAthlete(null);
      setModals((m) => ({ ...m, [action === 'programs' ? 'programs' : 'workout']: true }));
    });
  }, [isVerifiedCoach]);

  if (!isVerifiedCoach) return null;

  return (
    <div id="o1fcoach-command-center" className="w-full space-y-3.5 select-none pt-1">
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-emerald-500/30 bg-o1-surface p-3 text-[13px] font-semibold text-emerald-400 shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        <CoachFloor
          coachId={liveCoachId}
          athletes={athletes}
          checkins={checkinsList}
          notes={notes}
          onShowToast={showToast}
          onSendNote={sendNoteToAll}
          onReplyCheckin={replyToCheckin}
          onOpenPrograms={() => setModals((m) => ({ ...m, programs: true }))}
          onOpenWorkout={() => openWorkout(null)}
          onDispatchAthlete={openWorkout}
          onOpenVault={(addClip) => {
            tactileEngine.triggerSelectionBuzz();
            setModals((m) => ({ ...m, vault: true, vaultAdd: Boolean(addClip) }));
          }}
          onShareInvite={() => setShareOpen(true)}
          onSelectAthlete={setDossierAthlete}
          onRosterChanged={() => void loadData()}
        />
        <HealthDisclaimerBanner compact />
      </div>

      <CoachCommandCenterModals
        modals={modals}
        setModals={setModals}
        dossierAthlete={dossierAthlete}
        setDossierAthlete={setDossierAthlete}
        showToast={showToast}
        dispatchAthlete={dispatchAthlete}
        setDispatchAthlete={setDispatchAthlete}
        floorRoster={floorRoster}
      />
      <AddClientModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};

export default O1FCoachCommandCenter;
