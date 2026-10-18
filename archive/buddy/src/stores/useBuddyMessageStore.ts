/**
 * Oblivion 1 Fitness Club - Buddy Realtime & Message Store
 * Manages unread badge counts and active chat messages
 * Strict File Ceiling: < 120 lines
 */

import { create } from 'zustand';

export interface RealtimeBuddyMessage {
  id: string;
  match_id?: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

interface BuddyRealtimeState {
  unreadCount: number;
  activeMatchId: string | null;
  liveMessages: RealtimeBuddyMessage[];
  incrementUnread: () => void;
  clearUnread: () => void;
  setActiveMatchId: (matchId: string | null) => void;
  addLiveMessage: (msg: RealtimeBuddyMessage) => void;
}

export const useBuddyMessageStore = create<BuddyRealtimeState>((set) => ({
  unreadCount: 0,
  activeMatchId: null,
  liveMessages: [],
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
  setActiveMatchId: (matchId) => set({ activeMatchId: matchId }),
  addLiveMessage: (msg) => set((s) => ({ liveMessages: [...s.liveMessages, msg] })),
}));
