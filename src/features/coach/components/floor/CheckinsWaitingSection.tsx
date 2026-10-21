import type { Athlete } from '../../services/coachService';
import type { AthleteCheckInSubmission } from '../../types/coachPlatformTypes';
import { FloorAthleteCard } from './FloorAthleteCard';
import { Empty } from './FloorBits';
import { type ActionsFor, ago, stat } from './floorFormat';

interface CheckinsWaitingSectionProps {
  /** Null while the check-ins load. */
  checkins: AthleteCheckInSubmission[] | null;
  findAthlete: (id: string, name: string) => Athlete | undefined;
  actionsFor: ActionsFor;
  onSelectAthlete: (athlete: Athlete) => void;
}

/** Check-ins the coach has not replied to yet. */
export function CheckinsWaitingSection({
  checkins,
  findAthlete,
  actionsFor,
  onSelectAthlete,
}: CheckinsWaitingSectionProps) {
  const pending = (checkins ?? []).filter((row) => !row.coachFeedback?.feedbackText?.trim());
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-o1-body font-semibold text-o1-text">Check-ins waiting</h3>
      {checkins === null ? (
        <Empty>Loading check-ins…</Empty>
      ) : pending.length === 0 ? (
        <Empty>No check-ins waiting.</Empty>
      ) : (
        pending.slice(0, 8).map((row) => {
          const athlete = findAthlete(row.athleteId, row.athleteName);
          return (
            <FloorAthleteCard
              key={row.id}
              name={row.athleteName}
              avatar={athlete?.avatar}
              subtitle={row.notes || undefined}
              meta={ago(row.createdAt) || row.date}
              stats={[
                { label: 'Weight', value: row.weightKg > 0 ? `${row.weightKg} kg` : '--' },
                { label: 'Sleep', value: row.sleepHours > 0 ? `${row.sleepHours} h` : '--' },
                { label: 'Soreness', value: stat(row.sorenessRating, '/10') },
              ]}
              onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
              actions={actionsFor(
                {
                  athleteId: row.athleteId,
                  name: row.athleteName,
                  avatar: athlete?.avatar,
                  athlete,
                  checkinId: row.id,
                },
                'Reply',
              )}
            />
          );
        })
      )}
    </section>
  );
}
