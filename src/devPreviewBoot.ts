/**
 * Dev-only. Copies the laptop preview rows onto whatever browser opens the dev host,
 * including the phone. Production builds never call this.
 */
type PreviewPack = {
  athletes: unknown[];
  programs: unknown[];
  notes: unknown[];
  messages: unknown[];
  checkins: Array<Record<string, unknown>>;
  finished: unknown[];
  buddies: unknown[];
  assigned: unknown;
  coach: Record<string, unknown>;
};

function dropPreview(key: string) {
  const prev = JSON.parse(localStorage.getItem(key) || '[]');
  if (!Array.isArray(prev)) return;
  localStorage.setItem(
    key,
    JSON.stringify(prev.filter((row) => !String((row as { id?: string; athleteId?: string })?.id || '').startsWith('preview-') && !String((row as { athleteId?: string })?.athleteId || '').startsWith('preview-'))),
  );
}

function keep(key: string, rows: unknown[]) {
  const prev = JSON.parse(localStorage.getItem(key) || '[]');
  const list = Array.isArray(prev)
    ? prev.filter((row) => !String((row as { id?: string })?.id || '').startsWith('preview-'))
    : [];
  localStorage.setItem(key, JSON.stringify(rows.concat(list)));
}

export async function applyDevPreview(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const res = await fetch('/preview-data.json', { cache: 'no-store' });
  if (!res.ok) return;
  const pack = (await res.json()) as PreviewPack;
  dropPreview('o1fc_custom_coach_clients');
  dropPreview('o1fc_day_checkins_v1');
  dropPreview('o1_finished_workouts_v1');
  dropPreview('o1_coach_custom_programs');
  dropPreview('o1_coach_notes_local');
  dropPreview('o1_coach_messages_local');
  keep('o1_buddy_local', pack.buddies || []);
  if (String(localStorage.getItem('o1_assigned_local') || '').includes('preview-')) {
    localStorage.removeItem('o1_assigned_local');
  }
  if (String(localStorage.getItem('o1_my_coach') || '').includes('preview-coach')) {
    localStorage.removeItem('o1_my_coach');
  }
}
