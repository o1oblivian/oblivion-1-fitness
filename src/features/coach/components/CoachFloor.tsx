import React, { useEffect, useMemo, useState } from 'react';
import { Dumbbell, MessageSquare, User } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useModalStore } from '../../../components/modals/useModalStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { Athlete } from '../services/coachService';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { DirectiveItem } from '../types/coachDirectives';
import { liveClients } from '../services/floorRoster';
import {
  saveCheckinReplyRemote,
  saveWorkoutFeedback,
  sendCoachMessage,
} from '../services/coachBridge';
import { CoachCard } from '../services/coachDirectory';
import { isSampleId } from '../services/sampleIds';
import { useCoachViewStore } from '../store/useCoachViewStore';
import { DirectiveSignalsSection, type NoteDraft } from './DirectiveSignalsSection';
import { CoachInboxView, type InboxContact } from './CoachInboxView';
import { CoachEarningsDeck } from './CoachEarningsDeck';
import { type FloorCardAction } from './floor/FloorAthleteCard';
import { CoachFeedbackSheet } from './floor/CoachFeedbackSheet';
import { CheckinsWaitingSection } from './floor/CheckinsWaitingSection';
import { ClientsTab } from './floor/ClientsTab';
import { CoachFloorHeader } from './floor/CoachFloorHeader';
import { FilmsTab } from './floor/FilmsTab';
import { FloorTabBar } from './floor/FloorTabBar';
import { RecentSessionsSection } from './floor/RecentSessionsSection';
import { RosterSection } from './floor/RosterSection';
import { FeedbackTarget, dispatchTarget } from './floor/floorFormat';
import { useFloorData } from './floor/useFloorData';
import { useCoachingRequests } from './CoachingRequests';
import { ROSTER_FULL_COACH_MESSAGE } from '../services/rosterCap';
import { CoachProgramsTab } from '../../reels/components/profile/CoachProgramsTab';

export interface CoachFloorProps {
  coachId: string;
  /** The coach's public card from `coach_profiles`; null until loaded or before the first save. */
  card: CoachCard | null;
  onCardChange: (card: CoachCard) => void;
  /** Null while the roster loads. */
  athletes: Athlete[] | null;
  rosterFailed: boolean;
  onRetryRoster: () => void;
  rosterHasMore: boolean;
  onLoadMoreRoster: () => void;
  checkins: AthleteCheckInSubmission[] | null;
  onCheckinsChange: (
    updater: (prev: AthleteCheckInSubmission[] | null) => AthleteCheckInSubmission[] | null,
  ) => void;
  notes: DirectiveItem[] | null;
  notesFailed: boolean;
  onRetryNotes: () => void;
  onSendNote: (draft: NoteDraft) => Promise<boolean>;
  onEditNote: (id: string, draft: NoteDraft) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
  /** Bumped after a program is published so the Programs tab reloads. */
  programsRevision?: number;
  onCreateProgram: () => void;
  onOpenWorkout: () => void;
  onDispatchAthlete: (athlete: Athlete) => void;
  onOpenVault: () => void;
  onShareInvite: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onShowToast?: (msg: string) => void;
  /** Called after a coaching request is accepted so the roster reloads. */
  onRosterChanged?: () => void;
}

export const CoachFloor: React.FC<CoachFloorProps> = ({
  coachId,
  card,
  onCardChange,
  athletes,
  rosterFailed,
  onRetryRoster,
  rosterHasMore,
  onLoadMoreRoster,
  checkins,
  onCheckinsChange,
  notes,
  notesFailed,
  onRetryNotes,
  onSendNote,
  onEditNote,
  onDeleteNote,
  programsRevision = 0,
  onCreateProgram,
  onOpenWorkout,
  onDispatchAthlete,
  onOpenVault,
  onShareInvite,
  onSelectAthlete,
  onShowToast,
  onRosterChanged,
}) => {
  const openFullEliteReels = useModalStore((s) => s.openFullEliteReels);
  const ownReelCount = useReelsStore(
    (s) => s.reels.filter((reel) => reel.coach?.id === coachId).length,
  );
  const finishedWorkouts = useCoachStore((s) => s.finishedWorkouts);
  const applyWorkoutFeedback = useCoachStore((s) => s.applyWorkoutFeedback);
  const profileName = useAuthStore((s) => s.profile?.name || '');
  const tab = useCoachViewStore((s) => s.floorTab);
  const setTab = useCoachViewStore((s) => s.setFloorTab);
  const [feedbackFor, setFeedbackFor] = useState<FeedbackTarget | null>(null);
  const {
    films,
    filmsFailed,
    loadFilms,
    storefront,
    setStorefront,
    programs,
    latestFeedback,
    setLatestFeedback,
  } = useFloorData({ coachId, tab, programsRevision, ownReelCount });
  const { requests, decide } = useCoachingRequests(coachId, onRosterChanged, () =>
    onShowToast?.(ROSTER_FULL_COACH_MESSAGE),
  );

  const filmList = films ?? [];
  const showFilms = filmsFailed || filmList.length > 0;

  useEffect(() => {
    if (tab === 'films' && films !== null && !showFilms) setTab('floor');
  }, [tab, films, showFilms, setTab]);

  const people = useMemo(() => liveClients(athletes ?? []), [athletes]);
  const name = (card?.name || profileName || 'Coach').trim();

  const openReel = (reelId?: string) => {
    tactileEngine.triggerSelectionBuzz();
    if (reelId) openFullEliteReels({ initialMode: 'player', initialReelId: reelId });
    else openFullEliteReels({ initialMode: 'grid', initialCoachId: coachId });
  };

  const contacts = useMemo(() => {
    const book: Record<string, InboxContact> = {};
    people.forEach((athlete) => {
      book[athlete.id] = { name: athlete.name, avatar: athlete.avatar };
      if (athlete.client_id) book[athlete.client_id] = book[athlete.id];
    });
    return book;
  }, [people]);

  const findAthlete = (id: string, athleteName: string) =>
    people.find((athlete) => athlete.id === id || athlete.client_id === id) ||
    people.find((athlete) => athlete.name === athleteName);

  const deliverFeedback = async (message: string): Promise<boolean> => {
    const target = feedbackFor;
    if (!target) return false;
    if (isSampleId(target.athleteId)) {
      setFeedbackFor(null);
      onShowToast?.(`${target.name} is a sample client. Nothing was sent.`);
      return true;
    }
    const [sent, workoutSaved, checkinSaved] = await Promise.all([
      sendCoachMessage({
        coachId,
        athleteId: target.athleteId,
        senderName: name,
        message,
        from: 'coach',
      }),
      target.workoutId
        ? saveWorkoutFeedback(coachId, target.workoutId, message)
        : Promise.resolve(true),
      target.checkinId ? saveCheckinReplyRemote(target.checkinId, message) : Promise.resolve(true),
    ]);
    const at = new Date().toISOString();
    if (sent) setLatestFeedback((prev) => ({ ...prev, [target.athleteId]: message }));
    if (target.workoutId && workoutSaved) applyWorkoutFeedback(target.workoutId, message, at);
    if (target.checkinId && checkinSaved) {
      const checkinId = target.checkinId;
      onCheckinsChange((prev) =>
        (prev ?? []).map((row) =>
          row.id === checkinId
            ? {
                ...row,
                coachFeedback: {
                  ...row.coachFeedback,
                  feedbackText: message,
                  givenAt: 'Today',
                  status: 'reviewed',
                },
              }
            : row,
        ),
      );
    }
    const ok = sent && workoutSaved && checkinSaved;
    if (ok) {
      setFeedbackFor(null);
      onShowToast?.(`Sent to ${target.name}`);
    }
    return ok;
  };

  const feedbackAthlete = feedbackFor?.athlete;

  const athleteActions = (target: FeedbackTarget, feedbackLabel = 'Note'): FloorCardAction[] => {
    const actions: FloorCardAction[] = [
      {
        label: feedbackLabel,
        icon: MessageSquare,
        primary: true,
        onClick: () => {
          tactileEngine.triggerSelectionBuzz();
          setFeedbackFor(target);
        },
      },
      {
        label: 'Workout',
        icon: Dumbbell,
        onClick: () => {
          tactileEngine.triggerSelectionBuzz();
          onDispatchAthlete(dispatchTarget(target));
        },
      },
    ];
    const { athlete } = target;
    if (athlete) {
      actions.push({
        label: 'Profile',
        icon: User,
        onClick: () => {
          tactileEngine.triggerSelectionBuzz();
          onSelectAthlete(athlete);
        },
      });
    }
    return actions;
  };

  return (
    <div className="w-full space-y-3">
      <CoachFloorHeader
        coachId={coachId}
        card={card}
        name={name}
        storefront={storefront}
        filmCount={filmList.length}
        firstFilmId={filmList[0]?.id}
        clientCount={athletes === null ? '--' : String(people.length)}
        onCardChange={onCardChange}
        onStorefrontChange={(changes) => setStorefront((prev) => ({ ...prev, ...changes }))}
        onOpenReel={openReel}
        onOpenVault={onOpenVault}
        onCreateProgram={onCreateProgram}
        onOpenWorkout={onOpenWorkout}
        onShowClients={() => setTab('floor')}
        onShowToast={onShowToast}
      />

      <FloorTabBar tab={tab} showFilms={showFilms} onSelect={setTab} />

      {tab === 'films' && (
        <FilmsTab
          films={films}
          failed={filmsFailed}
          onRetry={() => void loadFilms()}
          onOpenReel={openReel}
        />
      )}

      {tab === 'programs' && (
        <CoachProgramsTab programs={programs} isOwn onCreate={onCreateProgram} />
      )}

      {tab === 'floor' && (
        <ClientsTab
          requests={requests}
          rosterFailed={rosterFailed}
          onDecide={(row, accept) => void decide(row, accept)}
          onRetryRoster={onRetryRoster}
          onShareInvite={onShareInvite}
        >
          <RosterSection
            athletes={athletes}
            people={people}
            hasMore={rosterHasMore}
            latestFeedback={latestFeedback}
            actionsFor={athleteActions}
            onSelectAthlete={onSelectAthlete}
            onLoadMore={onLoadMoreRoster}
          />
          <RecentSessionsSection
            workouts={finishedWorkouts}
            findAthlete={findAthlete}
            actionsFor={athleteActions}
            onSelectAthlete={onSelectAthlete}
          />
          <CheckinsWaitingSection
            checkins={checkins}
            findAthlete={findAthlete}
            actionsFor={athleteActions}
            onSelectAthlete={onSelectAthlete}
          />
        </ClientsTab>
      )}

      {tab === 'directives' && (
        <DirectiveSignalsSection
          directives={notes}
          loadFailed={notesFailed}
          onRetry={onRetryNotes}
          onSendNote={onSendNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      )}
      {tab === 'inbox' && (
        <CoachInboxView viewer="coach" coachId={coachId} contacts={contacts} coachName={name} />
      )}
      {tab === 'earnings' && (
        <CoachEarningsDeck coachId={coachId} onShowToast={(msg) => onShowToast?.(msg)} />
      )}

      <CoachFeedbackSheet
        target={feedbackFor}
        onClose={() => setFeedbackFor(null)}
        onSend={deliverFeedback}
        onSendWorkout={
          feedbackFor
            ? () => {
                setFeedbackFor(null);
                onDispatchAthlete(dispatchTarget(feedbackFor));
              }
            : undefined
        }
        onViewProfile={
          feedbackAthlete
            ? () => {
                setFeedbackFor(null);
                onSelectAthlete(feedbackAthlete);
              }
            : undefined
        }
      />
    </div>
  );
};
