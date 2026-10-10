import { useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useBuddyMessageStore, RealtimeBuddyMessage } from '../../../stores/useBuddyMessageStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { unpackLine } from '../services/buddyMatch';

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
      .channel(`buddy-lines-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_likes',
          filter: `to_id=eq.${currentUserId}`,
        },
        (payload) => {
          const row = payload.new as { id?: string; created_at?: string };
          const line = unpackLine(String(row.id || ''), String(row.created_at || ''));
          if (!line) return;
          tactileEngine.triggerSelectionBuzz();
          const message: RealtimeBuddyMessage = {
            id: line.id,
            match_id: line.senderId,
            sender_id: line.senderId,
            recipient_id: currentUserId,
            content: line.body,
            created_at: line.at || new Date().toISOString(),
          };
          addLiveMessage(message);
          if (!activeMatchId || activeMatchId !== line.senderId) incrementUnread();
          onMessageReceived?.(message);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, activeMatchId, incrementUnread, addLiveMessage, onMessageReceived]);

  return {
    unreadCount: useBuddyMessageStore((s) => s.unreadCount),
  };
}
