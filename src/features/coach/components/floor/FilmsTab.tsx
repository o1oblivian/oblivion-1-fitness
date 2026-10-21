import { useState } from 'react';
import { nextReelCover, reelCover } from '../../../reels/coverPresets';
import type { ProfileFilm } from '../../services/coachFilms';
import { Empty, RetryAlert } from './FloorBits';

function FilmTile({ film, onOpen }: { film: ProfileFilm; onOpen: () => void }) {
  const [src, setSrc] = useState(reelCover(film.id, film.thumb));
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[4/5] overflow-hidden bg-o1-surface active:scale-[0.98]"
      aria-label={film.title}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setSrc(nextReelCover(src))}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
    </button>
  );
}

interface FilmsTabProps {
  /** Null while the films load. */
  films: ProfileFilm[] | null;
  failed: boolean;
  onRetry: () => void;
  onOpenReel: (reelId: string) => void;
}

/** The coach's published films as a grid of covers. */
export function FilmsTab({ films, failed, onRetry, onOpenReel }: FilmsTabProps) {
  const filmList = films ?? [];
  return (
    <div className="space-y-2">
      {failed ? <RetryAlert message="Could not load your films." onRetry={onRetry} /> : null}
      {films === null ? (
        <Empty>Loading films…</Empty>
      ) : filmList.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-8 text-center text-o1-body text-o1-text">
          No films yet. Tap + on your photo to open your Vault and publish a clip.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-0.5">
          {filmList.slice(0, 30).map((film) => (
            <FilmTile key={film.id} film={film} onOpen={() => onOpenReel(film.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
