import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { ExploreCoach } from '../../coachTypes';
import { fetchCoachCard, toExploreCoach } from '../../services/coachDirectory';
import { openCoachConsole } from '../../services/coachConsoleBus';
import { CoachDirectMessageModal } from '../CoachDirectMessageModal';
import { CoachProfileDrawer, type ProfileTab } from './CoachProfileDrawer';

interface Props {
  coachId: string;
  initialTab?: ProfileTab;
  onClose: () => void;
}

type Loaded =
  | { status: 'loading' }
  | { status: 'ready'; coach: ExploreCoach }
  | { status: 'missing' }
  | { status: 'failed' };

/** A coach's public profile, loaded by id, with messaging on top. */
export const CoachProfileModal: React.FC<Props> = ({ coachId, initialTab, onClose }) => {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [messageCoach, setMessageCoach] = useState<ExploreCoach | null>(null);

  useEffect(() => {
    let live = true;
    setLoaded({ status: 'loading' });
    fetchCoachCard(coachId)
      .then((card) => {
        if (live)
          setLoaded(
            card ? { status: 'ready', coach: toExploreCoach(card) } : { status: 'missing' },
          );
      })
      .catch((error: unknown) => {
        console.warn('[CoachProfile] Coach card failed to load', error);
        if (live) setLoaded({ status: 'failed' });
      });
    return () => {
      live = false;
    };
  }, [coachId, attempt]);

  if (loaded.status !== 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-o1-canvas text-o1-text">
        <div className="flex h-14 shrink-0 items-center px-1 pt-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center"
            aria-label="Close profile"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          {loaded.status === 'loading' ? (
            <Loader2
              role="status"
              aria-label="Loading profile"
              className="h-6 w-6 animate-spin text-o1-muted"
            />
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-o1-crimson" />
              <p role="alert" className="text-o1-body text-o1-muted">
                {loaded.status === 'missing'
                  ? 'That coach profile is not available.'
                  : 'Could not load this coach. Check your connection and try again.'}
              </p>
              {loaded.status === 'failed' ? (
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="min-h-[44px] rounded-full border border-white/[0.14] px-5 text-o1-caption font-semibold"
                >
                  Retry
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <CoachProfileDrawer
        coach={loaded.coach}
        initialTab={initialTab}
        onClose={onClose}
        onMessageCoach={setMessageCoach}
        onOpenConsole={(action) => {
          onClose();
          openCoachConsole(action);
        }}
      />
      <CoachDirectMessageModal coach={messageCoach} onClose={() => setMessageCoach(null)} />
    </>
  );
};
