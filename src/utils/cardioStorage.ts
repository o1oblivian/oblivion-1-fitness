import { CardioMachineEntry } from '../types/cardio';

const CARDIO_STORAGE_KEY = 'ofc_cardio_machine_logs_v1';

export const INITIAL_CARDIO_LOGS: CardioMachineEntry[] = [
  {
    id: 'c-1',
    date: 'Today',
    timestamp: Date.now() - 3600000 * 2,
    machineType: 'treadmill',
    durationMinutes: 30,
    distanceKm: 3.85,
    caloriesBurned: 320,
    avgHeartRate: 138,
    stepsCount: 4620,
    inclinePercent: 12.0,
    avgSpeedKmh: 4.8,
    source: 'ocr_scan',
    notes: '12-3-30 Incline Walk',
  },
  {
    id: 'c-2',
    date: 'Yesterday',
    timestamp: Date.now() - 86400000,
    machineType: 'stairmaster',
    durationMinutes: 25,
    floorsClimbed: 118,
    caloriesBurned: 295,
    avgHeartRate: 152,
    stepsCount: 2360,
    resistanceLevel: 8,
    source: 'manual_dial',
    notes: 'High Intensity Stair Intervals',
  },
  {
    id: 'c-3',
    date: '2 days ago',
    timestamp: Date.now() - 86400000 * 2,
    machineType: 'rower',
    durationMinutes: 20,
    distanceKm: 4.5,
    caloriesBurned: 240,
    avgWatts: 195,
    avgHeartRate: 144,
    source: 'manual_dial',
    notes: 'Concept2 500m split pace',
  }
];

export function getCardioLogs(): CardioMachineEntry[] {
  try {
    const raw = localStorage.getItem(CARDIO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(INITIAL_CARDIO_LOGS));
      return INITIAL_CARDIO_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CARDIO_LOGS;
  }
}

export function saveCardioLog(entry: Omit<CardioMachineEntry, 'id' | 'timestamp'>): CardioMachineEntry {
  const logs = getCardioLogs();
  const newEntry: CardioMachineEntry = {
    ...entry,
    id: `cardio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...logs];
  try {
    localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist cardio entry:', err);
  }
  return newEntry;
}

export function deleteCardioLog(id: string): void {
  const logs = getCardioLogs();
  const filtered = logs.filter(l => l.id !== id);
  localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(filtered));
}
