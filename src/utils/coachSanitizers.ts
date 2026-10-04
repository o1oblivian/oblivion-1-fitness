import { CoachEarnings, CoachEarningsTransaction } from '../types';

export const DEFAULT_EARNINGS: CoachEarnings = [];

/**
 * Sanitizes Coach Earnings transactions. Returns empty array if none exist,
 * never falling back to fake mock transactions.
 */
export function sanitizeCoachEarnings(transactions: unknown): CoachEarnings {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const result: CoachEarningsTransaction[] = [];

  for (const item of transactions) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;

    const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id : `tx-${Math.random().toString(36).slice(2, 8)}`;
    const athleteName = typeof rec.athleteName === 'string' && rec.athleteName.trim() ? rec.athleteName : 'Anonymous Athlete';
    const plan = typeof rec.plan === 'string' && rec.plan.trim() ? rec.plan : 'Standard Coaching Retainer';
    const amount = typeof rec.amount === 'number' && !isNaN(rec.amount) ? Math.max(0, rec.amount) : 0;
    const date = typeof rec.date === 'string' && rec.date.trim() ? rec.date : 'Recent';
    const statusRaw = typeof rec.status === 'string' ? rec.status.toUpperCase() : 'COMPLETED';
    const status: 'COMPLETED' | 'PENDING' | 'REFUNDED' =
      statusRaw === 'PENDING' || statusRaw === 'REFUNDED' ? statusRaw : 'COMPLETED';

    result.push({
      id,
      athleteName,
      plan,
      amount,
      date,
      status,
    });
  }

  return result.length > 0 ? result : DEFAULT_EARNINGS;
}
