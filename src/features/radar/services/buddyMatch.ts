import { supabase } from '../../../services/supabaseClient';
import { DemoAthlete } from '../types';

export const FREE_RADIUS_KM = 25;
export const PREMIUM_RADIUS_KM = 250;
export const FREE_DAILY_LIKES = 5;

const LIKES_KEY = 'o1_buddy_likes_day';
const OUT_KEY = 'o1_buddy_outgoing_likes';
const MUTUAL_KEY = 'o1_buddy_mutuals';
const PASS_KEY = 'o1_buddy_passes';

export interface ViewerPrefs {
  discipline: string;
  split: string;
  time: string;
  gym: string;
  age: number;
  ageMin: number;
  ageMax: number;
}

export function capRadius(isPro: boolean, requested: number): number {
  const n = Number(requested);
  const value = Number.isFinite(n) && n > 0 ? n : FREE_RADIUS_KM;
  if (!isPro) return Math.min(FREE_RADIUS_KM, value);
  return Math.min(PREMIUM_RADIUS_KM, value);
}

export function searchRadius(isPro: boolean, filters: DeckFilters): number {
  const extra = filters.stretchDistance ? 10 : 0;
  return capRadius(isPro, filters.distanceKm + extra);
}

function dayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function likesUsedToday(): string[] {
  const saved = readJson<{ day: string; ids: string[] }>(LIKES_KEY, { day: '', ids: [] });
  if (saved.day !== dayKey()) return [];
  return Array.isArray(saved.ids) ? saved.ids : [];
}

export function likesLeft(isPro: boolean): number {
  if (isPro) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_DAILY_LIKES - likesUsedToday().length);
}

export function rememberLike(id: string, unlimited = false): boolean {
  const ids = likesUsedToday();
  if (!ids.includes(id)) {
    if (!unlimited && ids.length >= FREE_DAILY_LIKES) return false;
    localStorage.setItem(LIKES_KEY, JSON.stringify({ day: dayKey(), ids: [...ids, id] }));
  }
  const outgoing = readJson<Record<string, true>>(OUT_KEY, {});
  outgoing[id] = true;
  localStorage.setItem(OUT_KEY, JSON.stringify(outgoing));
  return true;
}

export function readOutgoing(): Record<string, true> {
  return readJson<Record<string, true>>(OUT_KEY, {});
}

export function readMutuals(): Record<string, true> {
  return readJson<Record<string, true>>(MUTUAL_KEY, {});
}

export function readPasses(): string[] {
  const rows = readJson<string[]>(PASS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function rememberPass(id: string): void {
  const rows = readPasses().filter((row) => row !== id);
  localStorage.setItem(PASS_KEY, JSON.stringify([id, ...rows].slice(0, 200)));
}

export function clearPasses(): void {
  localStorage.setItem(PASS_KEY, JSON.stringify([]));
}

function markMutual(id: string): void {
  const mutuals = readMutuals();
  mutuals[id] = true;
  localStorage.setItem(MUTUAL_KEY, JSON.stringify(mutuals));
}

export function rememberMutual(id: string): void {
  markMutual(id);
}

export function forgetMutual(id: string): void {
  const mutuals = readMutuals();
  delete mutuals[id];
  localStorage.setItem(MUTUAL_KEY, JSON.stringify(mutuals));
}

const BLOCK_KEY = 'o1_buddy_blocks';
const REPORT_KEY = 'o1_buddy_reports';
const LINE_KEY = 'o1_buddy_last_line';

export function readBlocks(): string[] {
  const rows = readJson<string[]>(BLOCK_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function rememberBlock(id: string): void {
  const rows = readBlocks().filter((row) => row !== id);
  localStorage.setItem(BLOCK_KEY, JSON.stringify([id, ...rows]));
  forgetMutual(id);
  rememberPass(id);
}

export function rememberReport(entry: { id: string; name: string; reason: string }): void {
  const rows = readJson<Array<{ id: string; name: string; reason: string; at: string }>>(REPORT_KEY, []);
  const next = [{ ...entry, at: new Date().toISOString() }, ...(Array.isArray(rows) ? rows : [])].slice(0, 50);
  localStorage.setItem(REPORT_KEY, JSON.stringify(next));
}

export function readLastLines(): Record<string, string> {
  return readJson<Record<string, string>>(LINE_KEY, {});
}

export function rememberLine(id: string, text: string): void {
  const lines = readLastLines();
  lines[id] = text;
  localStorage.setItem(LINE_KEY, JSON.stringify(lines));
}

export async function syncMutuals(myId: string): Promise<string[] | null> {
  if (!myId) return null;
  const [incoming, outgoing] = await Promise.all([
    supabase.from('buddy_likes').select('from_id').eq('to_id', myId),
    supabase.from('buddy_likes').select('to_id').eq('from_id', myId),
  ]);
  if (incoming.error || outgoing.error) return null;
  const sent = new Set((outgoing.data || []).map((row) => String(row.to_id)).filter((id) => id && !id.includes('|')));
  const hits = (incoming.data || [])
    .map((row) => String(row.from_id))
    .filter((id) => id && !id.includes('|') && sent.has(id));
  const kept: Record<string, true> = {};
  for (const id of Object.keys(readMutuals())) {
    if (id.startsWith('preview-')) kept[id] = true;
  }
  hits.forEach((id) => {
    kept[id] = true;
  });
  localStorage.setItem(MUTUAL_KEY, JSON.stringify(kept));
  return Object.keys(kept);
}

export async function withdrawLike(myId: string, theirId: string): Promise<void> {
  forgetMutual(theirId);
  if (!myId || !theirId) return;
  await supabase.from('buddy_likes').delete().eq('id', `${myId}:${theirId}`);
}

export type LikeResult =
  | { ok: true; mutual: boolean }
  | { ok: false; reason: 'auth' | 'cap' | 'save' };

async function likesSavedToday(myId: string): Promise<number | null> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('buddy_likes')
    .select('id', { count: 'exact', head: true })
    .eq('from_id', myId)
    .gte('created_at', start.toISOString());
  if (error || count == null) return null;
  return count;
}

export async function sendLike(myId: string, theirId: string, unlimited = false): Promise<LikeResult> {
  if (!myId || !theirId) return { ok: false, reason: 'auth' };
  const remote = await supabase.rpc('send_buddy_like', { their_id: theirId, unlimited });
  if (!remote.error && remote.data && typeof remote.data === 'object') {
    const row = remote.data as { ok?: boolean; reason?: string; mutual?: boolean };
    if (row.ok) {
      if (row.mutual) markMutual(theirId);
      return { ok: true, mutual: Boolean(row.mutual) };
    }
    if (row.reason === 'cap' || row.reason === 'auth') return { ok: false, reason: row.reason };
    return { ok: false, reason: 'save' };
  }
  const likeId = `${myId}:${theirId}`;
  if (!unlimited) {
    const existing = await supabase.from('buddy_likes').select('id').eq('id', likeId).limit(1);
    const already = !existing.error && Array.isArray(existing.data) && existing.data.length > 0;
    if (!already) {
      const used = await likesSavedToday(myId);
      const fallback = likesUsedToday().filter((id) => id !== theirId).length;
      const count = used === null ? fallback : used;
      if (count >= FREE_DAILY_LIKES) return { ok: false, reason: 'cap' };
    }
  }
  const { error } = await supabase.from('buddy_likes').upsert(
    { id: likeId, from_id: myId, to_id: theirId },
    { onConflict: 'id' },
  );
  if (error) return { ok: false, reason: 'save' };
  const back = await supabase
    .from('buddy_likes')
    .select('id')
    .eq('from_id', theirId)
    .eq('to_id', myId)
    .limit(1);
  const mutual = !back.error && Array.isArray(back.data) && back.data.length > 0;
  if (mutual) markMutual(theirId);
  return { ok: true, mutual };
}

const MAX_LINE_ID_BYTES = 1800;

function mailRow(kind: 'm' | 'b' | 'r', myId: string, theirId: string, body = ''): { id: string; from_id: string; to_id: string } | null {
  const stamp = Date.now();
  const id = body
    ? `${kind}|${myId}|${theirId}|${stamp}|raw|${body}`
    : `${kind}|${myId}|${theirId}`;
  if (new TextEncoder().encode(id).length > MAX_LINE_ID_BYTES) return null;
  return {
    id,
    from_id: `${kind}|${myId}`,
    to_id: theirId,
  };
}

export async function postLine(myId: string, theirId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!myId || !theirId) return { ok: false, error: 'Sign in to send' };
  if (!body.trim()) return { ok: false, error: 'Message did not send' };
  const row = mailRow('m', myId, theirId, body);
  if (!row) return { ok: false, error: 'Message is too long' };
  const { error } = await supabase.from('buddy_likes').insert(row);
  if (error) return { ok: false, error: 'Message did not send' };
  return { ok: true };
}

export async function publishBlock(myId: string, theirId: string): Promise<boolean> {
  rememberBlock(theirId);
  if (!myId || !theirId) return false;
  const { error } = await supabase.from('buddy_likes').upsert(
    {
      id: `b|${myId}|${theirId}`,
      from_id: `b|${myId}`,
      to_id: theirId,
    },
    { onConflict: 'id' },
  );
  return !error;
}

export async function publishReport(myId: string, theirId: string, name: string, reason: string): Promise<boolean> {
  rememberReport({ id: theirId, name, reason });
  if (!myId || !theirId || !reason) return false;
  const row = mailRow('r', myId, theirId, JSON.stringify({ name, reason }));
  if (!row) return false;
  const { error } = await supabase.from('buddy_likes').insert(row);
  return !error;
}

export async function syncBlocks(myId: string): Promise<string[]> {
  if (!myId) return readBlocks();
  const [sent, received] = await Promise.all([
    supabase.from('buddy_likes').select('to_id').eq('from_id', `b|${myId}`),
    supabase.from('buddy_likes').select('from_id').eq('to_id', myId).like('id', 'b|%'),
  ]);
  const ids = new Set(readBlocks());
  (sent.data || []).forEach((row) => {
    const id = String(row.to_id || '');
    if (id && !id.includes('|')) ids.add(id);
  });
  (received.data || []).forEach((row) => {
    const from = String(row.from_id || '');
    const id = from.startsWith('b|') ? from.slice(2) : '';
    if (id) ids.add(id);
  });
  const next = [...ids];
  next.forEach((id) => {
    if (!readBlocks().includes(id)) rememberBlock(id);
  });
  return next;
}

export interface SharedLine {
  id: string;
  senderId: string;
  body: string;
  at: string;
}

export function unpackLine(id: string, at: string): SharedLine | null {
  const parts = String(id).split('|');
  if (parts[0] !== 'm' || parts.length < 5) return null;
  const senderId = parts[1];
  if (parts[4] === 'raw') {
    const body = parts.slice(5).join('|');
    return body ? { id, senderId, body, at } : null;
  }
  try {
    return {
      id,
      senderId,
      body: decodeURIComponent(parts.slice(4).join('|')),
      at,
    };
  } catch {
    return null;
  }
}

export async function readThread(myId: string, theirId: string): Promise<SharedLine[]> {
  if (!myId || !theirId) return [];
  const [sent, got] = await Promise.all([
    supabase.from('buddy_likes').select('id,created_at').eq('from_id', `m|${myId}`).like('id', `m|${myId}|${theirId}|%`),
    supabase.from('buddy_likes').select('id,created_at').eq('from_id', `m|${theirId}`).like('id', `m|${theirId}|${myId}|%`),
  ]);
  const rows = [...(sent.data || []), ...(got.data || [])];
  return rows
    .map((row) => unpackLine(String(row.id), String(row.created_at || '')))
    .filter((row): row is SharedLine => Boolean(row))
    .sort((a, b) => a.at.localeCompare(b.at));
}

export async function fetchBuddyCardsById(ids: string[]): Promise<DemoAthlete[]> {
  const usable = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!usable.length) return [];
  const { data, error } = await supabase.from('buddy_profiles').select('*').in('id', usable);
  if (error || !Array.isArray(data)) return [];
  return data.filter((row) => row.athlete_name !== 'line').map((row) => ({
    id: String(row.id),
    name: row.athlete_name || 'Athlete',
    age: Number(row.age) || 0,
    home_gym: row.home_gym || '',
    distance_km: 0,
    match_score: 0,
    image_url: row.image_url || row.avatar_url || '',
    photos: row.image_url || row.avatar_url ? [row.image_url || row.avatar_url] : [],
    discipline: row.discipline || '',
    training_discipline: row.discipline || '',
    gender: row.gender || '',
    looking_for: row.looking_for || '',
    training_place: row.training_place || '',
    bio: row.bio || '',
    current_split: row.current_split || '',
    preferred_time: row.training_time || '',
    experience_level: row.experience_level || '',
  }));
}

function overlap(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function scorePair(viewer: ViewerPrefs, athlete: DemoAthlete, distanceKm: number): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const discipline = athlete.discipline || athlete.training_discipline || '';
  if (overlap(viewer.discipline, discipline)) {
    score += 35;
    reasons.push(discipline);
  }
  if (overlap(viewer.split, athlete.current_split || '')) {
    score += 20;
    reasons.push(athlete.current_split || '');
  }
  if (overlap(viewer.time, athlete.preferred_time || '')) {
    score += 20;
    reasons.push(athlete.preferred_time || '');
  }
  if (overlap(viewer.gym, athlete.home_gym || athlete.homeGym || '')) {
    score += 15;
    reasons.push('Same gym');
  }
  if (distanceKm <= 5) score += 20;
  else if (distanceKm <= 10) score += 15;
  else if (distanceKm <= 25) score += 10;
  else if (distanceKm <= 100) score += 5;
  else score += 2;
  const age = Number(athlete.age) || 0;
  if (viewer.age >= 18 && age >= 18 && Math.abs(viewer.age - age) <= 5) {
    score += 10;
    reasons.push('Similar age');
  }
  return { score: Math.min(99, score), reasons: reasons.filter(Boolean) };
}

export function rankAthletes(viewer: ViewerPrefs, rows: DemoAthlete[], radiusKm: number, filters?: DeckFilters): DemoAthlete[] {
  const ranked: DemoAthlete[] = [];
  for (const row of rows) {
    const dist = Number(row.distance_km ?? row.distanceKm);
    if (!Number.isFinite(dist) || dist < 0 || dist > radiusKm) continue;
    const age = Number(row.age) || 0;
    const slack = filters?.stretchAge ? 4 : 0;
    if (age < 18 || age < viewer.ageMin - slack || age > viewer.ageMax + slack) continue;
    if (filters && !passesDeckFilters(row, filters)) continue;
    const scored = scorePair(viewer, row, dist);
    ranked.push({
      ...row,
      distance_km: dist,
      match_score: scored.reasons.length ? scored.score : 0,
      match_reasons: scored.reasons,
    });
  }
  ranked.sort((a, b) => (b.match_score || 0) - (a.match_score || 0) || a.distance_km - b.distance_km);
  return ranked;
}

export interface DeckFilters {
  distanceKm: number;
  ageMin: number;
  ageMax: number;
  show: 'all' | 'women' | 'men';
  disciplines: string[];
  times: string[];
  levels: string[];
  intents: string[];
  place: 'any' | 'gym' | 'home' | 'outdoors';
  photoOnly: boolean;
  verifiedOnly: boolean;
  stretchAge: boolean;
  stretchDistance: boolean;
}

const FILTER_KEY = 'o1_buddy_deck_filters';

export const DEFAULT_DECK_FILTERS: DeckFilters = {
  distanceKm: FREE_RADIUS_KM,
  ageMin: 18,
  ageMax: 45,
  show: 'all',
  disciplines: [],
  times: [],
  levels: [],
  intents: [],
  place: 'any',
  photoOnly: false,
  verifiedOnly: false,
  stretchAge: false,
  stretchDistance: false,
};

export function readDeckFilters(): DeckFilters {
  const saved = readJson<Partial<DeckFilters>>(FILTER_KEY, {});
  return { ...DEFAULT_DECK_FILTERS, ...saved };
}

export function writeDeckFilters(next: DeckFilters): void {
  localStorage.setItem(FILTER_KEY, JSON.stringify(next));
}

function passesDeckFilters(athlete: DemoAthlete, filters: DeckFilters): boolean {
  if (filters.photoOnly && !(athlete.image_url || athlete.avatar || athlete.photos?.[0])) return false;
  if (filters.verifiedOnly && !athlete.is_verified) return false;
  const gender = (athlete.gender || '').toLowerCase();
  if (filters.show !== 'all' && gender !== filters.show) return false;
  if (filters.disciplines.length) {
    const disc = `${athlete.discipline || ''} ${athlete.training_discipline || ''}`.toLowerCase();
    if (!filters.disciplines.some((item) => disc.includes(item.toLowerCase()))) return false;
  }
  if (filters.times.length) {
    const time = (athlete.preferred_time || '').toLowerCase();
    if (!filters.times.some((item) => time.includes(item.toLowerCase()))) return false;
  }
  if (filters.levels.length) {
    const level = (athlete.experience_level || '').toLowerCase();
    if (!filters.levels.some((item) => level === item.toLowerCase())) return false;
  }
  if (filters.intents.length) {
    const intent = (athlete.looking_for || '').toLowerCase();
    if (!filters.intents.some((item) => intent.includes(item.toLowerCase()))) return false;
  }
  const gym = athlete.home_gym || athlete.homeGym || '';
  const place = (athlete.training_place || '').toLowerCase();
  if (filters.place === 'gym' && place !== 'gym' && !(place === '' && gym)) return false;
  if (filters.place === 'home' && place !== 'home') return false;
  if (filters.place === 'outdoors' && place !== 'outdoors') return false;
  return true;
}

export function profileIsReady(profile: {
  displayName: string;
  age: number;
  homeGym: string;
  selectedDisciplines: string[];
  buddyPhotos: string[];
}): boolean {
  const name = profile.displayName.trim();
  return Boolean(
    name &&
      name !== 'Jordan Vance' &&
      profile.age >= 18 &&
      profile.age <= 80 &&
      profile.homeGym.trim() &&
      profile.homeGym !== 'Oblivion 1 • Downtown' &&
      profile.selectedDisciplines.length > 0 &&
      profile.buddyPhotos.length > 0,
  );
}
