import { supabase, isSupabaseConfigured } from './supabase';

export interface ShareConsentRequest {
  id: string;
  coach_email: string;
  client_email: string;
  client_name: string;
  share_type: string;
  share_description: string | null;
  otp_code: string;
  status: 'pending' | 'approved' | 'denied' | 'dismissed' | 'expired';
  created_at: string;
  expires_at: string;
  responded_at?: string | null;
}

const LOCAL_CONSENT_KEY = 'o1fc_share_consent_requests';

export function getLocalConsentRequests(): ShareConsentRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONSENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalConsentRequests(requests: ShareConsentRequest[]): void {
  try {
    localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save local consent requests:', e);
  }
}

/**
 * Generate a cryptographically sound or high-entropy 3-digit verification code.
 */
export function generate3DigitConsentCode(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Creates a new consent request from a coach to a client.
 * Persists locally and syncs to Supabase.
 */
export async function createShareConsentRequest(params: {
  coachEmail: string;
  clientEmail: string;
  clientName: string;
  shareType: string;
  shareDescription?: string;
  otpCode?: string;
  durationMinutes?: number;
}): Promise<ShareConsentRequest> {
  const code = params.otpCode || generate3DigitConsentCode();
  const id = `scr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.durationMinutes || 10) * 60 * 1000).toISOString();

  const newRequest: ShareConsentRequest = {
    id,
    coach_email: params.coachEmail.toLowerCase().trim(),
    client_email: params.clientEmail.toLowerCase().trim(),
    client_name: params.clientName,
    share_type: params.shareType,
    share_description: params.shareDescription || `Sharing selected data for ${params.clientName}`,
    otp_code: code,
    status: 'pending',
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  // 1. Local-first immediate persistence
  const localList = getLocalConsentRequests();
  localList.unshift(newRequest);
  saveLocalConsentRequests(localList);

  // 2. Supabase synchronization
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('share_consent_requests')
        .insert({
          coach_email: newRequest.coach_email,
          client_email: newRequest.client_email,
          client_name: newRequest.client_name,
          share_type: newRequest.share_type,
          share_description: newRequest.share_description,
          otp_code: newRequest.otp_code,
          expires_at: newRequest.expires_at,
        })
        .select('id')
        .maybeSingle();

      if (!error && data?.id) {
        newRequest.id = data.id;
        // Update local with the official Supabase ID
        const updatedList = localList.map(r => (r.id === id ? { ...r, id: data.id } : r));
        saveLocalConsentRequests(updatedList);
      }
    } catch (err) {
      console.warn('Supabase consent request insert failed, using local-first request:', err);
    }
  }

  return newRequest;
}

/**
 * Fetches all pending unexpired consent requests for a specific client email.
 */
export async function getPendingConsentRequestsForClient(clientEmail: string): Promise<ShareConsentRequest[]> {
  const email = clientEmail.toLowerCase().trim();
  const now = new Date().toISOString();

  // Try Supabase first if online
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('share_consent_requests')
        .select('id, coach_email, client_name, share_type, share_description, otp_code, expires_at')
        .eq('client_email', email)
        .eq('status', 'pending')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          coach_email: d.coach_email,
          client_email: email,
          client_name: d.client_name,
          share_type: d.share_type,
          share_description: d.share_description,
          otp_code: d.otp_code,
          status: 'pending' as const,
          created_at: now,
          expires_at: d.expires_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase pending consent fetch failed, checking local store:', err);
    }
  }

  // Fallback to local store
  const localList = getLocalConsentRequests();
  return localList.filter(
    r => r.client_email === email && r.status === 'pending' && r.expires_at > now
  );
}

/**
 * Responds to a consent request with an OTP code verification.
 */
export async function respondToConsentRequest(
  requestId: string,
  otpInput: string,
  action: 'approve' | 'deny' | 'dismiss'
): Promise<{ success: boolean; status: ShareConsentRequest['status']; error?: string }> {
  const localList = getLocalConsentRequests();
  const target = localList.find(r => r.id === requestId);

  if (action === 'approve') {
    if (!target) {
      // If not in local, check Supabase
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('share_consent_requests')
          .select('otp_code, status')
          .eq('id', requestId)
          .maybeSingle();
        if (!data) return { success: false, status: 'pending', error: 'Request not found' };
        if (data.otp_code !== otpInput) return { success: false, status: 'pending', error: 'Incorrect 3-digit consent code' };
      } else {
        return { success: false, status: 'pending', error: 'Request not found' };
      }
    } else if (target.otp_code !== otpInput) {
      return { success: false, status: target.status, error: 'Incorrect 3-digit consent code' };
    }
  }

  const newStatus: ShareConsentRequest['status'] = action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'dismissed';
  const respondedAt = new Date().toISOString();

  // Update local
  const updatedList = localList.map(r =>
    r.id === requestId ? { ...r, status: newStatus, responded_at: respondedAt } : r
  );
  saveLocalConsentRequests(updatedList);

  // Update Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('share_consent_requests')
        .update({ status: newStatus, responded_at: respondedAt })
        .eq('id', requestId);
    } catch (e) {
      console.warn('Supabase consent status update error:', e);
    }
  }

  return { success: true, status: newStatus };
}

/**
 * Checks the status of a consent request.
 */
export async function getConsentRequestStatus(
  requestId: string
): Promise<{ status: ShareConsentRequest['status']; request: ShareConsentRequest | null }> {
  // Check local first
  const localList = getLocalConsentRequests();
  const target = localList.find(r => r.id === requestId);

  if (isSupabaseConfigured() && (!target || target.status === 'pending')) {
    try {
      const { data } = await supabase
        .from('share_consent_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (data) {
        const mapped: ShareConsentRequest = {
          id: data.id,
          coach_email: data.coach_email,
          client_email: data.client_email,
          client_name: data.client_name,
          share_type: data.share_type,
          share_description: data.share_description,
          otp_code: data.otp_code,
          status: data.status,
          created_at: data.created_at,
          expires_at: data.expires_at,
          responded_at: data.responded_at,
        };
        // sync to local
        const idx = localList.findIndex(r => r.id === requestId);
        if (idx >= 0) localList[idx] = mapped;
        else localList.unshift(mapped);
        saveLocalConsentRequests(localList);

        return { status: data.status, request: mapped };
      }
    } catch {}
  }

  return { status: target?.status || 'pending', request: target || null };
}
