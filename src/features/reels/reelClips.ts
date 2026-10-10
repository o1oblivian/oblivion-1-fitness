import { FilmstripClip } from './reelTypes';

/** Catalog filmstrips also carry consult and program promo cards; those are not videos to watch. */
export function isPlayableClip(clip: FilmstripClip): boolean {
  return clip.duration !== 'Consult' && !clip.badge?.includes('Consult') && !clip.badge?.includes('PROGRAMS');
}
