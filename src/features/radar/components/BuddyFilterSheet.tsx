import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { DeckFilters, FREE_RADIUS_KM, PREMIUM_RADIUS_KM } from '../services/buddyMatch';

const TRAINING = [
  'Strength',
  'Hypertrophy',
  'Powerlifting',
  'Olympic',
  'Conditioning',
  'Running',
  'Run club',
  'Walking',
  'Cycling',
  'Swimming',
  'Hyrox',
  'Mobility',
  'Yoga',
  'Pilates',
  'Sauna',
  'CrossFit',
  'Calisthenics',
  'Boxing',
  'Climbing',
  'Rowing',
];

const LOOKING = ['Training partner', 'Spotter', 'Run club', 'Program swap', 'Sauna and recover', 'Something ongoing'];
const WHEN = ['Morning', 'Midday', 'Evening', 'Night'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PLACES = [
  { id: 'any' as const, label: 'Anywhere' },
  { id: 'gym' as const, label: 'Gym' },
  { id: 'home' as const, label: 'Home' },
  { id: 'outdoors' as const, label: 'Outdoors' },
];

function Pill({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onClick();
      }}
      className={`h-9 rounded-full px-3 text-[13px] font-semibold ${on ? 'bg-white text-neutral-950' : 'border border-white/[0.07] bg-[#161616] text-neutral-300'}`}
    >
      {label}
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onClick();
      }}
      className={`relative h-7 w-12 rounded-full ${on ? 'bg-white' : 'bg-[#2a2a2a]'}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full ${on ? 'right-0.5 bg-neutral-950' : 'left-0.5 bg-neutral-400'}`} />
    </button>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#121214] p-4">
      <p className="text-[15px] font-semibold text-white">{title}</p>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const BuddyFilterSheet: React.FC<{
  open: boolean;
  filters: DeckFilters;
  isPro: boolean;
  onClose: () => void;
  onApply: (next: DeckFilters) => void;
  onNeedPremium: () => void;
}> = ({ open, filters, isPro, onClose, onApply, onNeedPremium }) => {
  const [draft, setDraft] = useState(filters);
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  if (!open) return null;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const setDistance = (km: number) => {
    if (km > FREE_RADIUS_KM && !isPro) {
      onNeedPremium();
      setDraft({ ...draft, distanceKm: FREE_RADIUS_KM });
      return;
    }
    setDraft({ ...draft, distanceKm: Math.min(km, isPro ? PREMIUM_RADIUS_KM : FREE_RADIUS_KM) });
  };

  const setAge = (low: number, high: number) => {
    const ageMin = Math.max(18, Math.min(low, high));
    const ageMax = Math.min(80, Math.max(low, high));
    setDraft({ ...draft, ageMin, ageMax });
  };

  return (
    <div className="fixed inset-0 z-[60] flex o1-sheet-scrim o1-page-scrim">
      <div className="o1-sheet-card o1-page flex flex-col bg-black text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" aria-label="Close filters" onClick={onClose} className="text-neutral-300">
            <X className="h-5 w-5" />
          </button>
          <p className="text-[15px] font-semibold">Preferences</p>
          <span className="w-5" />
        </div>

        <div className="mx-4 mb-3 grid grid-cols-2 rounded-full bg-[#161616] p-1">
          {(['basic', 'advanced'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (item === 'advanced' && !isPro) {
                  onNeedPremium();
                  return;
                }
                setMode(item);
              }}
              className={`h-9 rounded-full text-[13px] font-semibold ${mode === item ? 'bg-white text-neutral-950' : 'text-neutral-400'}`}
            >
              {item === 'basic' ? 'Basic' : 'Advanced'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {mode === 'basic' ? (
            <>
              <Card title="Who do you want to train with?">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all' as const, label: 'Everyone' },
                    { id: 'women' as const, label: 'Women' },
                    { id: 'men' as const, label: 'Men' },
                  ].map((item) => (
                    <Pill key={item.id} on={draft.show === item.id} label={item.label} onClick={() => setDraft({ ...draft, show: item.id })} />
                  ))}
                </div>
              </Card>

              <Card title={`Between ${draft.ageMin} and ${draft.ageMax}`}>
                <div className="o1-dual-range">
                  <div className="absolute left-0 right-0 top-[17px] h-1 rounded-full bg-[#2a2a2a]" />
                  <div
                    className="absolute top-[17px] h-1 rounded-full bg-white"
                    style={{
                      left: `${((draft.ageMin - 18) / 62) * 100}%`,
                      right: `${((80 - draft.ageMax) / 62) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={draft.ageMin}
                    onChange={(event) => setAge(Number(event.target.value), draft.ageMax)}
                    aria-label="Youngest"
                  />
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={draft.ageMax}
                    onChange={(event) => setAge(draft.ageMin, Number(event.target.value))}
                    aria-label="Oldest"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[12px] text-neutral-400">Show people a little outside this range</p>
                  <Toggle on={draft.stretchAge} onClick={() => setDraft({ ...draft, stretchAge: !draft.stretchAge })} />
                </div>
              </Card>

              <Card title={`Up to ${draft.distanceKm} km`} hint="Free stays inside 25 km. Farther is premium, up to 250 km.">
                <input
                  type="range"
                  min={5}
                  max={isPro ? PREMIUM_RADIUS_KM : FREE_RADIUS_KM}
                  step={5}
                  value={Math.min(draft.distanceKm, isPro ? PREMIUM_RADIUS_KM : FREE_RADIUS_KM)}
                  onChange={(event) => setDistance(Number(event.target.value))}
                  className="w-full accent-white"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[12px] text-neutral-400">Show people a little further if the deck runs thin</p>
                  <Toggle on={draft.stretchDistance} onClick={() => setDraft({ ...draft, stretchDistance: !draft.stretchDistance })} />
                </div>
              </Card>

              <Card title="Training" hint="Empty means any. Pick what you want to see.">
                <div className="flex flex-wrap gap-1.5">
                  {TRAINING.map((item) => (
                    <Pill key={item} on={draft.disciplines.includes(item)} label={item} onClick={() => setDraft({ ...draft, disciplines: toggle(draft.disciplines, item) })} />
                  ))}
                </div>
              </Card>

              <Card title="On the card">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-neutral-200">Photo required</p>
                  <Toggle on={draft.photoOnly} onClick={() => setDraft({ ...draft, photoOnly: !draft.photoOnly })} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[13px] text-neutral-200">Verified only</p>
                  <Toggle on={draft.verifiedOnly} onClick={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })} />
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card title="What are they looking for?">
                <div className="flex flex-wrap gap-1.5">
                  {LOOKING.map((item) => (
                    <Pill key={item} on={draft.intents.includes(item)} label={item} onClick={() => setDraft({ ...draft, intents: toggle(draft.intents, item) })} />
                  ))}
                </div>
              </Card>
              <Card title="When do they train?">
                <div className="flex flex-wrap gap-1.5">
                  {WHEN.map((item) => (
                    <Pill key={item} on={draft.times.includes(item)} label={item} onClick={() => setDraft({ ...draft, times: toggle(draft.times, item) })} />
                  ))}
                </div>
              </Card>
              <Card title="Experience">
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map((item) => (
                    <Pill key={item} on={draft.levels.includes(item)} label={item} onClick={() => setDraft({ ...draft, levels: toggle(draft.levels, item) })} />
                  ))}
                </div>
              </Card>
              <Card title="Where they train">
                <div className="flex flex-wrap gap-1.5">
                  {PLACES.map((item) => (
                    <Pill key={item.id} on={draft.place === item.id} label={item.label} onClick={() => setDraft({ ...draft, place: item.id })} />
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="h-12 w-full rounded-full bg-white text-[15px] font-semibold text-neutral-950"
          >
            Show people
          </button>
        </div>
      </div>
    </div>
  );
};
