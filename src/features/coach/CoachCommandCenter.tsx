import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { liveChannel } from '../../services/realtimeChannel';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  Athlete,
  deleteCoachNote,
  ROSTER_PAGE,
  fetchCoachClients,
  fetchCoachDirectives,
  isValidUuid,
  publishCoachNote,
  updateCoachNote,
} from './services/coachService';
import { DirectiveItem } from './types/coachDirectives';
import type { NoteDraft } from './components/DirectiveSignalsSection';
import { CoachFloor } from './components/CoachFloor';
import { AddClientModal } from './components/AddClientModal';
import { RosterCapNotice } from './components/RosterCapNotice';
import {
  CoachCommandCenterModals,
  type CoachModalFlags,
} from './components/CoachCommandCenterModals';
import { AthleteCheckInSubmission } from './types/coachPlatformTypes';
import { tactileEngine } from '../../services/tactileEngine';
import { HealthDisclaimerBanner } from '../legal';
import { getAuthenticatedUserId } from '../../services/authUser';
import { getOrCreateInviteCode } from '../log/publicShare';
import {
  fetchFinishedForCoach,
  fetchRemoteCheckins,
  mapCompletionRow,
  publishCoachInvite,
} from './services/coachBridge';
import { CoachCard } from './services/coachDirectory';
import { fetchMyCoachCard } from './services/coachPublicProfile';
import { useCoachStore } from '../../stores/useCoachStore';
import { liveClients } from './services/floorRoster';
import { onCoachConsoleAction } from './services/coachConsoleBus';

export interface CoachCommandCenterProps {
  isCoach?: boolean;
}

const NOTE_BADGE = 'bg-o1-sheet text-o1-text border-white/[0.07]';

export const CoachCommandCenter: React.FC<CoachCommandCenterProps> = ({ isCoach = false }) => {
  const userRole = useAuthStore((s) => s.profile?.role);
  const profileName = useAuthStore((s) => s.profile?.name || '');
  const isVerifiedCoach = Boolean(isCoach || userRole === 'coach');
  const [coachId, setCoachId] = useState('');
  const [card, setCard] = useState<CoachCard | null>(null);

  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [rosterFailed, setRosterFailed] = useState(false);
  const [rosterHasMore, setRosterHasMore] = useState(false);
  const [notes, setNotes] = useState<DirectiveItem[] | null>(null);
  const [notesFailed, setNotesFailed] = useState(false);
  const [checkins, setCheckins] = useState<AthleteCheckInSubmission[] | null>(null);
  const [modals, setModals] = useState<CoachModalFlags>({
    programs: false,
    programCreate: false,
    workout: false,
    vault: false,
  });
  const [programsRevision, setProgramsRevision] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteFailed, setInviteFailed] = useState(false);
  const [dispatchAthlete, setDispatchAthlete] = useState<Athlete | null>(null);
  const [dossierAthlete, setDossierAthlete] = useState<Athlete | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roster = useMemo(() => athletes ?? [], [athletes]);
  const floorRoster = useMemo(() => liveClients(roster), [roster]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    void getAuthenticatedUserId().then((id) => setCoachId(isValidUuid(id) ? (id as string) : ''));
    void fetchMyCoachCard().then(setCard);
  }, []);

  const loadRoster = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchCoachClients(coachId);
    setRosterFailed(rows === null);
    setRosterHasMore(rows?.length === ROSTER_PAGE);
    if (rows) setAthletes(rows);
    else setAthletes((prev) => prev ?? []);
  }, [coachId]);

  const loadMoreRoster = useCallback(async () => {
    if (!coachId || !athletes) return;
    const rows = await fetchCoachClients(coachId, athletes.length);
    if (!rows) {
      setRosterFailed(true);
      return;
    }
    setRosterHasMore(rows.length === ROSTER_PAGE);
    setAthletes((prev) => {
      const seen = new Set((prev ?? []).map((row) => row.id));
      return [...(prev ?? []), ...rows.filter((row) => !seen.has(row.id))];
    });
  }, [coachId, athletes]);

  const loadNotes = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchCoachDirectives(coachId);
    setNotesFailed(rows === null);
    if (rows) setNotes(rows);
    else setNotes((prev) => prev ?? []);
  }, [coachId]);

  const loadCheckins = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchRemoteCheckins(coachId);
    if (rows) setCheckins(rows);
    else setCheckins((prev) => prev ?? []);
  }, [coachId]);

  const loadWorkouts = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchFinishedForCoach(coachId);
    if (rows) useCoachStore.getState().setFinishedWorkouts(rows);
  }, [coachId]);

  const registerInvite = useCallback(async () => {
    if (!coachId) return;
    setInviteFailed(false);
    const name = card?.name || profileName || 'Coach';
    const code = getOrCreateInviteCode(card?.handle || name);
    const ok = await publishCoachInvite(code, {
      id: coachId,
      name,
      handle: card?.handle || '',
      avatar: card?.avatar || '',
    });
    setInviteCode(ok ? code : null);
    setInviteFailed(!ok);
  }, [coachId, card, profileName]);

  useEffect(() => {
    if (!isVerifiedCoach || !coachId) return;
    void loadRoster();
    void loadNotes();
    void loadCheckins();
    void loadWorkouts();
    const filter = `coach_id=eq.${coachId}`;
    const channel = liveChannel(`coach-console-${coachId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coach_clients', filter },
        () => void loadRoster(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athlete_checkins', filter },
        () => void loadCheckins(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coach_directives', filter },
        () => void loadNotes(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workout_completions', filter },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (row && row.id)
            useCoachStore
              .getState()
              .upsertFinishedWorkout(mapCompletionRow(row as { id: unknown }));
          else void loadWorkouts();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isVerifiedCoach, coachId, loadRoster, loadNotes, loadCheckins, loadWorkouts]);

  useEffect(() => {
    if (isVerifiedCoach) void registerInvite();
  }, [isVerifiedCoach, registerInvite]);

  useEffect(() => {
    if (!isVerifiedCoach) return;
    return onCoachConsoleAction((action) => {
      if (action === 'programs') {
        setModals((m) => ({ ...m, programs: true, programCreate: true }));
        return;
      }
      setDispatchAthlete(null);
      setModals((m) => ({ ...m, workout: true }));
    });
  }, [isVerifiedCoach]);

  const sendNoteToAll = async (draft: NoteDraft): Promise<boolean> => {
    const saved = await publishCoachNote(coachId, {
      id: crypto.randomUUID(),
      tag: draft.tag,
      title: draft.title,
      summary: draft.summary,
      affectedCount: roster.length,
      priority: 'NORMAL',
      badgeStyle: NOTE_BADGE,
    });
    if (!saved) return false;
    setNotes((prev) => [saved, ...(prev ?? []).filter((n) => n.id !== saved.id)]);
    showToast(roster.length === 1 ? 'Sent to your client' : `Sent to ${roster.length} clients`);
    return true;
  };

  const editNote = async (id: string, draft: NoteDraft): Promise<boolean> => {
    if (!(await updateCoachNote(coachId, id, draft))) return false;
    setNotes((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, ...draft } : n)));
    return true;
  };

  const removeNote = async (id: string): Promise<boolean> => {
    if (!(await deleteCoachNote(coachId, id))) return false;
    setNotes((prev) => (prev ?? []).filter((n) => n.id !== id));
    showToast('Note deleted');
    return true;
  };

  const openWorkout = (athlete: Athlete | null) => {
    setDispatchAthlete(athlete);
    setModals((m) => ({ ...m, workout: true }));
  };

  if (!isVerifiedCoach) return null;

  return (
    <div id="o1fcoach-command-center" className="w-full space-y-3.5 select-none pt-1">
      {toastMsg && (
        <div role="status" aria-live="polite" className="o1-toast">
          {toastMsg}
        </div>
      )}

      <div className="space-y-4">
        <RosterCapNotice seated={roster.length} />
        <CoachFloor
          coachId={coachId}
          card={card}
          onCardChange={setCard}
          athletes={athletes}
          rosterFailed={rosterFailed}
          onRetryRoster={() => void loadRoster()}
          rosterHasMore={rosterHasMore}
          onLoadMoreRoster={() => void loadMoreRoster()}
          checkins={checkins}
          onCheckinsChange={setCheckins}
          notes={notes}
          notesFailed={notesFailed}
          onRetryNotes={() => void loadNotes()}
          onShowToast={showToast}
          onSendNote={sendNoteToAll}
          onEditNote={editNote}
          onDeleteNote={removeNote}
          programsRevision={programsRevision}
          onCreateProgram={() => setModals((m) => ({ ...m, programs: true, programCreate: true }))}
          onOpenWorkout={() => openWorkout(null)}
          onDispatchAthlete={openWorkout}
          onOpenVault={() => {
            tactileEngine.triggerSelectionBuzz();
            setModals((m) => ({ ...m, vault: true }));
          }}
          onShareInvite={() => {
            setShareOpen(true);
            if (!inviteCode) void registerInvite();
          }}
          onSelectAthlete={setDossierAthlete}
          onRosterChanged={() => void loadRoster()}
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
        onProgramsChanged={() => setProgramsRevision((n) => n + 1)}
      />
      <AddClientModal
        isOpen={shareOpen}
        code={inviteCode}
        failed={inviteFailed}
        onRetry={() => void registerInvite()}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
};
