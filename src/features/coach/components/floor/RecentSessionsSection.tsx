import type { CoachFinishedWorkoutLog } from '../../../../stores/coachTypes';
import type { Athlete } from '../../services/coachService';
import { FloorAthleteCard } from './FloorAthleteCard';
import { Empty } from './FloorBits';
import { type ActionsFor, ago, kg, stat } from './floorFormat';

interface RecentSessionsSectionProps {
  workouts: CoachFinishedWorkoutLog[];
  findAthlete: (id: string, name: string) => Athlete | undefined;
  actionsFor: ActionsFor;
  onSelectAthlete: (athlete: Athlete) => void;
}

/** The latest finished workouts, each with a Note or Review button. */
export function RecentSessionsSection({
  workouts,
  findAthlete,
  actionsFor,
  onSelectAthlete,
}: RecentSessionsSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-o1-body font-semibold text-o1-text">Who trained this week</h3>
      {workouts.length === 0 ? (
        <Empty>No sessions finished yet.</Empty>
      ) : (
        workouts.slice(0, 8).map((log) => {
          const athlete = findAthlete(log.athleteId, log.athleteName);
          const avatar = log.athleteAvatar || athlete?.avatar;
          return (
            <FloorAthleteCard
              key={log.id}
              name={log.athleteName}
              avatar={avatar}
              subtitle={log.title}
              meta={ago(log.completedAt)}
              stats={[
                { label: 'Volume', value: kg(log.tonnageKg) },
                { label: 'Sets', value: stat(log.totalSets) },
                { label: 'Minutes', value: stat(log.durationMinutes) },
              ]}
              lastFeedback={log.feedback}
              onOpenProfile={athlete ? () => onSelectAthlete(athlete) : undefined}
              actions={actionsFor(
                {
                  athleteId: log.athleteId,
                  name: log.athleteName,
                  avatar,
                  athlete,
                  workoutId: log.id,
                },
                log.feedback ? 'Note' : 'Review',
              )}
            />
          );
        })
      )}
    </section>
  );
}
