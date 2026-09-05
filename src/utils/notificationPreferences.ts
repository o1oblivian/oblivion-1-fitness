import { triggerHaptic } from './haptics';
import { playSoftTickSound, playRealBellSound } from './audio';

export interface NotificationPreferences {
  coachUpdates: boolean;
  buddyMatches: boolean;
  gymCheckins: boolean;
  systemBilling: boolean;
}

const NOTIF_PREFS_KEY = 'o1fc_notification_preferences';

export const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  coachUpdates: true,
  buddyMatches: true,
  gymCheckins: true,
  systemBilling: false,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('[NotificationPreferences] Failed to read preferences:', e);
  }
  return DEFAULT_NOTIF_PREFS;
}

export function saveNotificationPreferences(
  partial: Partial<NotificationPreferences>
): NotificationPreferences {
  const current = getNotificationPreferences();
  const updated: NotificationPreferences = { ...current, ...partial };
  try {
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ofc_notification_prefs_changed', { detail: updated })
      );
    }
  } catch (e) {
    console.error('[NotificationPreferences] Failed to save preferences:', e);
  }
  return updated;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('[NotificationPreferences] Permission request error:', e);
    return Notification.permission;
  }
}

export interface InstantNotificationPayload {
  title: string;
  body: string;
  channel: keyof NotificationPreferences;
  icon?: string;
  tag?: string;
}

/**
 * Sends a verified notification across browser push (if granted) and in-app interactive banner.
 * Validates against athlete's channel toggle state before sending.
 */
export function sendInstantNotification(payload: InstantNotificationPayload): boolean {
  const prefs = getNotificationPreferences();
  if (!prefs[payload.channel]) {
    // Channel is toggled off by the user
    return false;
  }

  // 1. Trigger haptic feedback
  try {
    triggerHaptic('medium');
  } catch {}

  // 2. Play subtle acoustic sound
  try {
    playSoftTickSound(1.0);
  } catch {}

  // 3. Dispatch in-app instant alert event (rendered by toast / app alert listener)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ofc_instant_notification', {
        detail: {
          ...payload,
          timestamp: Date.now(),
        },
      })
    );
  }

  // 4. Send OS / Browser notification if permission is granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.tag || payload.channel,
      });
    } catch (e) {
      console.warn('[NotificationPreferences] Browser notification dispatch warning:', e);
    }
  }

  return true;
}

/**
 * Fires a test notification for a specific channel to verify hardware & audio response immediately.
 */
export function sendChannelTestNotification(channel: keyof NotificationPreferences): void {
  const channelData: Record<
    keyof NotificationPreferences,
    { title: string; body: string }
  > = {
    coachUpdates: {
      title: 'Coach Updates Active',
      body: 'Verified: Program adjustments, workout dispatches, and form feedback will alert you instantly.',
    },
    buddyMatches: {
      title: 'Buddy Radar Match Alert',
      body: 'Verified: You will be notified whenever nearby verified athletes match your training discipline.',
    },
    gymCheckins: {
      title: 'Partner Facility Check-In',
      body: 'Verified: Proximity check-in is live for partner club facilities and squat rack zones.',
    },
    systemBilling: {
      title: 'System & Security Alert',
      body: 'Verified: Account verification, membership billing updates, and security notices are active.',
    },
  };

  const item = channelData[channel];
  sendInstantNotification({
    channel,
    title: item.title,
    body: item.body,
  });
}
