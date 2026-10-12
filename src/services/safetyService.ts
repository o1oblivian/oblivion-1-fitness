import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';

export type SafetyContext = 'buddy' | 'coach';

export async function reportUser(input: {
  reportedId: string;
  name: string;
  reason: string;
  details?: string;
  context: SafetyContext;
}): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!me || !input.reportedId || me === input.reportedId || !input.reason) return false;
  const note = [input.name ? `Name shown: ${input.name}` : '', input.details || ''].filter(Boolean).join('\n');
  const { error } = await supabase.from('safety_reports').insert({
    reporter_id: me,
    reported_id: input.reportedId,
    context: input.context,
    reason: input.reason.slice(0, 200),
    details: note ? note.slice(0, 2000) : null,
  });
  return !error;
}

export async function blockUser(blockedId: string): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!me || !blockedId || me === blockedId) return false;
  const { error } = await supabase
    .from('user_blocks')
    .upsert({ blocker_id: me, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
  return !error;
}

export async function fetchBlockedIds(): Promise<string[]> {
  const me = await getAuthenticatedUserId();
  if (!me) return [];
  const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', me);
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => String(row.blocked_id)).filter(Boolean);
}
