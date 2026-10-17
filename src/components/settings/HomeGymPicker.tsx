import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Search, Trash2, X } from 'lucide-react';
import { searchVenues, VenueHit } from '../../features/radar/services/venueSearch';
import { tactileEngine } from '../../services/tactileEngine';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';

interface HomeGymPickerProps {
  open: boolean;
  current: string;
  onClose: () => void;
  onPick: (label: string) => void;
}

/** A home gym can only be a real place returned by the live venue search, never typed-in text. */
function venueLabel(hit: VenueHit): string {
  return [hit.name, hit.locality].filter(Boolean).join(', ').slice(0, 80);
}

export const HomeGymPicker: React.FC<HomeGymPickerProps> = ({ open, current, onClose, onPick }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<VenueHit[]>([]);
  const [note, setNote] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHits([]);
      setNote('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const text = query.trim();
    if (text.length < 3) {
      setHits([]);
      setNote('');
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchVenues(text, '', '')
        .then((found) => {
          if (cancelled) return;
          setHits(found);
          setNote(found.length ? '' : 'No gyms found. Try the gym name and suburb.');
        })
        .catch(() => {
          if (cancelled) return;
          setHits([]);
          setNote('Search is not responding. Check your connection and try again.');
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="o1-sheet-card bg-black border border-white/[0.07] w-full p-5 shadow-xl relative space-y-4 overflow-y-auto text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-[#4F8F9A]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-bold text-sm text-neutral-100 tracking-wider">Home Gym</h3>
              <span className="text-[11px] text-neutral-400 block">Pick your gym from the live map search</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-11 h-11 -mr-2 rounded-full text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {current ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-o1-well border border-white/[0.07] px-3 py-2">
            <span className="text-[11px] text-neutral-300 truncate">Current: {current}</span>
            <button
              type="button"
              aria-label="Clear home gym"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onPick('');
              }}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-neutral-400 hover:text-white cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="home-gym-search" className="text-[11px] font-tactical font-bold text-neutral-400 block tracking-wider">
            Search for your gym
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="home-gym-search"
              type="text"
              value={query}
              maxLength={80}
              autoComplete="off"
              autoCorrect="off"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gym name and suburb"
              className="w-full min-h-[44px] bg-black border border-white/[0.07] rounded-xl pl-9 pr-9 text-xs font-sans text-white placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson"
            />
            {searching ? <Loader2 className="w-4 h-4 text-neutral-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" /> : null}
          </div>

          {note ? <p className="text-[11px] text-neutral-400 px-1">{note}</p> : null}

          {hits.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      onPick(venueLabel(hit));
                    }}
                    className="w-full min-h-[48px] px-3 py-2 text-left flex items-start gap-2.5 cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06]"
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#4F8F9A]" />
                    <span className="min-w-0">
                      <span className="block text-xs text-neutral-100 truncate">{hit.name}</span>
                      <span className="block text-[11px] text-neutral-400 truncate">{hit.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="text-[10px] text-neutral-500 px-1 leading-snug">
            Only the words you type are sent to the OpenStreetMap-based Photon search. Your account and location are not sent.
          </p>
        </div>
      </div>
    </div>
  );
};

/** Home gym row for forms: shows the saved gym and opens the live search to change it. */
export const HomeGymField: React.FC = () => {
  const homeGym = useBuddyProfileStore((s) => s.homeGym);
  const setHomeGym = useBuddyProfileStore((s) => s.setHomeGym);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setOpen(true);
        }}
        className="w-full min-h-[40px] bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between gap-2 cursor-pointer focus:outline-none focus:border-o1-crimson"
      >
        <span className={`truncate ${homeGym ? 'text-white' : 'text-neutral-500'}`}>{homeGym || 'Search for your gym'}</span>
        <Search className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
      </button>
      <HomeGymPicker
        open={open}
        current={homeGym}
        onClose={() => setOpen(false)}
        onPick={(label) => {
          setHomeGym(label);
          setOpen(false);
        }}
      />
    </>
  );
};


