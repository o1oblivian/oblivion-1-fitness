import type { ReactNode } from 'react';
import { UserPlus } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import type { CoachingApplication } from '../../../reels/services/coachStorefront';
import { CoachingRequestCard } from '../CoachingRequests';
import { RetryAlert } from './FloorBits';

interface ClientsTabProps {
  requests: CoachingApplication[];
  rosterFailed: boolean;
  onDecide: (request: CoachingApplication, accept: boolean) => void;
  onRetryRoster: () => void;
  onShareInvite: () => void;
  /** The roster, recent sessions, and check-in sections, in the order they should appear. */
  children: ReactNode;
}

/** The Clients tab: invite button, pending coaching requests, then the sections passed in. */
export function ClientsTab({
  requests,
  rosterFailed,
  onDecide,
  onRetryRoster,
  onShareInvite,
  children,
}: ClientsTabProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onShareInvite();
        }}
        className="flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-surface text-o1-body font-semibold text-o1-text active:scale-[0.98]"
      >
        <UserPlus size={16} />
        Invite a client
      </button>
      {requests.length > 0 ? (
        <section className="space-y-2">
          <h3 className="px-1 text-o1-body font-semibold text-o1-text">
            Coaching requests ({requests.length})
          </h3>
          {requests.map((request) => (
            <CoachingRequestCard key={request.id} request={request} onDecide={onDecide} />
          ))}
        </section>
      ) : null}
      {rosterFailed ? (
        <RetryAlert message="Could not load your clients." onRetry={onRetryRoster} />
      ) : null}
      {children}
    </div>
  );
}
