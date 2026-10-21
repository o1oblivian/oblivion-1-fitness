import {
  type CloudMeal,
  type FuelDayPatch,
  type FuelProfilePatch,
  deleteMealRow,
  insertMealRow,
  toMealRow,
  upsertFuelDay,
  upsertFuelProfile,
} from '../services/fuelCloud';

interface PendingMeal {
  dateKey: string;
  meal: CloudMeal;
}

/** Changes made on this device that the account has not confirmed yet. */
export interface Outbox {
  inserts: PendingMeal[];
  deletes: string[];
  profile: FuelProfilePatch;
  days: Record<string, FuelDayPatch>;
}

export function emptyOutbox(): Outbox {
  return { inserts: [], deletes: [], profile: {}, days: {} };
}

/** Empties the outbox in place, so anything already holding it sees the reset. */
export function clearOutbox(outbox: Outbox): void {
  Object.assign(outbox, emptyOutbox());
}

/** How many separate changes are waiting to be sent. */
export function outboxPending(outbox: Outbox): number {
  return (
    outbox.inserts.length +
    outbox.deletes.length +
    (Object.keys(outbox.profile).length > 0 ? 1 : 0) +
    Object.keys(outbox.days).length
  );
}

/**
 * Sends queued changes in order and drops each one once the account has it. Stops at the first
 * failure and leaves the rest queued for the next attempt.
 */
export async function flushOutbox(outbox: Outbox, userId: string): Promise<void> {
  for (const pending of [...outbox.inserts]) {
    if (!(await insertMealRow(toMealRow(userId, pending.dateKey, pending.meal)))) return;
    outbox.inserts = outbox.inserts.filter((p) => p.meal.id !== pending.meal.id);
  }
  for (const id of [...outbox.deletes]) {
    if (!(await deleteMealRow(userId, id))) return;
    outbox.deletes = outbox.deletes.filter((d) => d !== id);
  }
  const profilePatch = outbox.profile;
  if (Object.keys(profilePatch).length > 0) {
    if (!(await upsertFuelProfile(userId, profilePatch))) return;
    // Keep any edits made while the request was in flight.
    if (outbox.profile === profilePatch) outbox.profile = {};
  }
  for (const [dateKey, dayPatch] of Object.entries(outbox.days)) {
    if (!(await upsertFuelDay(userId, dateKey, dayPatch))) return;
    if (outbox.days[dateKey] === dayPatch) {
      const { [dateKey]: _sent, ...rest } = outbox.days;
      outbox.days = rest;
    }
  }
}
