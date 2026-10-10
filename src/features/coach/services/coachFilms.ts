import { ExploreReelItem } from '../../reels/reelTypes';

export interface ProfileFilm {
  id: string;
  title: string;
  thumb: string;
}

function asFilm(item: { id?: string; title?: string; thumbnail?: string }): ProfileFilm | null {
  const thumb = String(item.thumbnail || '');
  const id = String(item.id || '');
  if (!id || !thumb || thumb.includes('images.unsplash.com')) return null;
  return { id, title: String(item.title || 'Film'), thumb };
}

/** Clips this coach published on this phone. Catalog films are never included. */
export function uploadedFilms(coachId: string): ProfileFilm[] {
  try {
    const raw = localStorage.getItem('o1_coach_uploaded_reels');
    const uploaded = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(uploaded)) return [];
    const films: ProfileFilm[] = [];
    for (const item of uploaded) {
      if (!item || typeof item !== 'object') continue;
      const ownerId = String(item.coach?.id || '');
      if (coachId && ownerId && ownerId !== coachId) continue;
      const film = asFilm(item);
      if (film) films.push(film);
    }
    return films.slice(0, 18);
  } catch {
    return [];
  }
}

/** This coach's uploads, plus any reel in the library whose coach id matches. */
export function filmsForCoach(coachId: string, reels: ExploreReelItem[]): ProfileFilm[] {
  const own = uploadedFilms(coachId);
  const seen = new Set(own.map((film) => film.id));
  const matched: ProfileFilm[] = [];
  for (const reel of reels) {
    if (!coachId || reel.coach?.id !== coachId || seen.has(reel.id)) continue;
    const film = asFilm(reel);
    if (!film) continue;
    seen.add(film.id);
    matched.push(film);
  }
  return [...own, ...matched].slice(0, 18);
}

export function figureCount(count: number): string {
  return count > 0 ? String(count) : '--';
}
