import { tactileEngine } from '../../../../services/tactileEngine';
import type { Athlete } from '../../services/coachService';
import { FloorAthleteCard } from './FloorAthleteCard';
import { Empty } from './FloorBits';
import { type ActionsFor, kg, rosterId, stat } from './floorFormat';

interface RosterSectionProps {
  /** Null while the roster loads. */
  athletes: Athlete[] | null;
  /** The live clients to list, already filtered from `athletes`. */
  people: Athlete[];
  hasMore: boolean;
  /** Latest note sent to each client, keyed by roster id. */
  latestFeedback: Record<string, string>;
  actionsFor: ActionsFor;
  onSelectAthlete: (athlete: Athlete) => void;
  onLoadMore: () => void;
}

/** The coach's clients, with readiness, volume, and the note buttons. */
export function RosterSection({
  athletes,
  people,
  hasMore,
  latestFeedback,
  actionsFor,
  onSelectAthlete,
  onLoadMore,
}: RosterSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-o1-body font-semibold text-o1-text">
        Clients{athletes === null ? '' : ` (${people.length}${hasMore ? '+' : ''})`}
      </h3>
      {athletes === null ? (
        <Empty>Loading clients…</Empty>
      ) : people.length === 0 ? (
        <Empty>No active clients yet. Tap 'Invite a client' to send your coach link.</Empty>
      ) : (
        people.map((athlete) => (
          <FloorAthleteCard
            key={`roster-${athlete.id}`}
            name={athlete.name}
            avatar={athlete.avatar}
            subtitle={athlete.handle || athlete.status}
            meta={athlete.lastActive}
            stats={[
              { label: 'Readiness', value: stat(athlete.readiness, '%') },
              { label: 'Volume', value: kg(athlete.volume) },
              { label: 'Status', value: athlete.status },
            ]}
            lastFeedback={latestFeedback[rosterId(athlete)]}
            onOpenProfile={() => onSelectAthlete(athlete)}
            actions={actionsFor({
              athleteId: rosterId(athlete),
              name: athlete.name,
              avatar: athlete.avatar,
              athlete,
            })}
          />
        ))
      )}
      {hasMore ? (
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onLoadMore();
          }}
          className="flex h-[44px] w-full items-center justify-center rounded-full border border-white/[0.07] bg-o1-surface text-o1-body font-semibold text-o1-text active:scale-[0.99]"
        >
          Show more clients
        </button>
      ) : null}
    </section>
  );
}
