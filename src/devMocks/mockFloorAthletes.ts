import type { Athlete } from '../features/coach/services/coachService';

export const MOCK_FLOOR_ATHLETES: Athlete[] = [
  {
    id: 'sample-alex',
    name: 'Alex Vance',
    handle: '@alex.vance',
    status: 'Active',
    readiness: 86,
    volume: 14250,
    sets: 16,
    prs: 2,
    sleepHours: 8.2,
    soreness: 'Mild',
    fuelPct: 100,
    cycle: 'Strength block · Week 3',
    lastActive: 'Today',
  },
  {
    id: 'sample-elena',
    name: 'Elena Rostova',
    handle: '@elena.rostova',
    status: 'Active',
    readiness: 91,
    volume: 9800,
    sets: 12,
    prs: 0,
    sleepHours: 8.2,
    soreness: 'Mild',
    fuelPct: 100,
    cycle: 'Restored',
    lastActive: 'Today',
  },
];
