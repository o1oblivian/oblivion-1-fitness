import { useState, useEffect } from 'react';

export interface CoachClientRecord {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status: 'ACTIVE' | 'PENDING' | 'PAUSED';
  badge?: string;
  weeklyVolumeKg: number;
  readinessScore: number;
  lastActive: string;
  email: string;
  programName: string;
  isDemo?: boolean;
}

export const INITIAL_DEMO_CLIENTS: CoachClientRecord[] = [
  {
    id: 'demo-1',
    name: 'Marcus Vance',
    handle: '@marcus.lift',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    badge: 'PR • BENCH 142.5KG',
    weeklyVolumeKg: 18450,
    readinessScore: 92,
    lastActive: '12m ago',
    email: 'marcus.vance@ofc.app',
    programName: 'HYROX Strength Pro',
    isDemo: true,
  },
  {
    id: 'demo-2',
    name: 'Elena Rostova',
    handle: '@elena.cross',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'PENDING',
    badge: 'PENDING REVIEW',
    weeklyVolumeKg: 14200,
    readinessScore: 78,
    lastActive: '45m ago',
    email: 'elena.rostova@ofc.app',
    programName: 'Functional Metcon Elite',
    isDemo: true,
  },
  {
    id: 'demo-3',
    name: 'Liam Chen',
    handle: '@liam.power',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    badge: 'COMPLETED',
    weeklyVolumeKg: 22100,
    readinessScore: 88,
    lastActive: '2h ago',
    email: 'liam.chen@ofc.app',
    programName: 'Heavy Compound 1RM',
    isDemo: true,
  },
  {
    id: 'demo-4',
    name: 'Sarah Jenkins',
    handle: '@sarah.fit',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    badge: 'PR • SQUAT 135KG',
    weeklyVolumeKg: 12800,
    readinessScore: 91,
    lastActive: '3h ago',
    email: 'sarah.jenkins@ofc.app',
    programName: 'Hypertrophy Track',
    isDemo: true,
  },
];

const ROSTER_STORAGE_KEY = 'o1fc_coach_roster_v2';
const DEMO_STORAGE_KEY = 'o1fc_coach_demo_mode';

let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((l) => l());
}

export const coachRosterMemory = {
  getClients: (): CoachClientRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  getIsDemoMode: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  },
  addClient: (newClient: Omit<CoachClientRecord, 'id' | 'isDemo'>) => {
    const clients = coachRosterMemory.getClients();
    const created: CoachClientRecord = {
      ...newClient,
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isDemo: false,
    };
    const updated = [created, ...clients.filter((c) => !c.isDemo)];
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(DEMO_STORAGE_KEY, 'false');
    notify();
  },
  removeClient: (id: string) => {
    const clients = coachRosterMemory.getClients();
    const updated = clients.filter((c) => c.id !== id);
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(updated));
    notify();
  },
  toggleDemoMode: () => {
    const current = coachRosterMemory.getIsDemoMode();
    localStorage.setItem(DEMO_STORAGE_KEY, (!current).toString());
    notify();
  },
  setDemoMode: (enabled: boolean) => {
    localStorage.setItem(DEMO_STORAGE_KEY, enabled.toString());
    notify();
  },
};

export function useCoachRosterStore() {
  const [clients, setClients] = useState<CoachClientRecord[]>(() => coachRosterMemory.getClients());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => coachRosterMemory.getIsDemoMode());

  useEffect(() => {
    const sync = () => {
      setClients(coachRosterMemory.getClients());
      setIsDemoMode(coachRosterMemory.getIsDemoMode());
    };
    listeners.push(sync);
    return () => {
      listeners = listeners.filter((l) => l !== sync);
    };
  }, []);

  return {
    clients,
    isDemoMode,
    addClient: coachRosterMemory.addClient,
    removeClient: coachRosterMemory.removeClient,
    toggleDemoMode: coachRosterMemory.toggleDemoMode,
    setDemoMode: coachRosterMemory.setDemoMode,
  };
}

useCoachRosterStore.getState = () => ({
  clients: coachRosterMemory.getClients(),
  isDemoMode: coachRosterMemory.getIsDemoMode(),
});
