/**
 * Oblivion 1 Fitness Club - Buddy Realtime Hook
 * Realtime PostgreSQL CDC for buddy_messages
 * Strict File Ceiling: < 110 lines
 */

import { useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useBuddyMessageStore, RealtimeBuddyMessage } from '../../../stores/useBuddyMessageStore';
import { tactileEngine } from '../../../services/tactileEngine';

interface UseBuddyRealtimeOptions {
  currentUserId?: string;
  onMessageReceived?: (message: RealtimeBuddyMessage) => void;
}

export function useBuddyRealtime({
  currentUserId = '',
  onMessageReceived,
}: UseBuddyRealtimeOptions = {}) {
  const incrementUnread = useBuddyMessageStore((s) => s.incrementUnread);
  const addLiveMessage = useBuddyMessageStore((s) => s.addLiveMessage);
  const activeMatchId = useBuddyMessageStore((s) => s.activeMatchId);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`buddy-messages-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msgData: any = payload.new;
          if (msgData) {
            tactileEngine.triggerSelectionBuzz();
            const message: RealtimeBuddyMessage = {
              id: msgData.id,
              match_id: msgData.match_id,
              sender_id: msgData.sender_id,
              recipient_id: msgData.recipient_id,
              content: msgData.content || msgData.text || '',
              created_at: msgData.created_at || new Date().toISOString(),
            };

            addLiveMessage(message);

            // Increment dock unread count if message is not for currently open conversation
            if (!activeMatchId || activeMatchId !== message.match_id) {
              incrementUnread();
            }

            if (onMessageReceived) {
              onMessageReceived(message);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeMatchId, incrementUnread, addLiveMessage, onMessageReceived]);

  return {
    unreadCount: useBuddyMessageStore((s) => s.unreadCount),
  };
}
