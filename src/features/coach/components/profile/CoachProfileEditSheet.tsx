import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import { supabase } from '../../../../services/supabaseClient';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useUserStore } from '../../../../stores/useUserStore';
import { compressPhoto } from '../../../../utils/mediaCompressor';
import { fetchVaultRows, uploadMedia } from '../../../../services/mediaStorage';
import { StorefrontStats, saveStorefront } from '../../../reels/services/coachStorefront';
import { HANDLE_PATTERN, cleanHandle, saveMyPublicProfile } from '../../services/coachPublicProfile';

const BIO_LIMIT = 300;
const SPECIALTY_LIMIT = 5;

export interface CoachProfileDraft {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  specialties: string[];
  accepting: boolean;
}

interface CoachProfileEditSheetProps {
  open: boolean;
  initial: CoachProfileDraft;
  stats: StorefrontStats;
  onClose: () => void;
  onSaved: (profile: CoachProfileDraft, storefront: Pick<StorefrontStats, 'years' | 'capacity' | 'monthlyPriceCents'>) => void;
  onError: (message: string) => void;
}

function wholeOrNull(raw: string): number | null {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function parseSpecialties(raw: string): string[] {
  return [...new Set(raw.split(',').map((part) => part.trim()).filter(Boolean))].slice(0, SPECIALTY_LIMIT);
}

/** Name, handle, photo, bio and specialties for the coach card, plus the public offer numbers. */
export const CoachProfileEditSheet: React.FC<CoachProfileEditSheetProps> = ({ open, initial, stats, onClose, onSaved, onError }) => {
  if (!open) return null;
  return <EditSheetBody initial={initial} stats={stats} onClose={onClose} onSaved={onSaved} onError={onError} />;
};

const inputClass =
  'h-[44px] w-full rounded-xl border border-white/[0.07] bg-o1-canvas px-3 text-[14px] text-o1-text outline-none placeholder:text-o1-muted focus:border-o1-crimson';

const EditSheetBody: React.FC<Omit<CoachProfileEditSheetProps, 'open'>> = ({ initial, stats, onClose, onSaved, onError }) => {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [bio, setBio] = useState(initial.bio);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [specialties, setSpecialties] = useState(initial.specialties.join(', '));
  const [accepting, setAccepting] = useState(initial.accepting);
  const [years, setYears] = useState(stats.years != null ? String(stats.years) : '');
  const [capacity, setCapacity] = useState(stats.capacity != null ? String(stats.capacity) : '');
  const [monthly, setMonthly] = useState(stats.monthlyPriceCents != null ? String(stats.monthlyPriceCents / 100) : '');
  const [busy, setBusy] = useState<'photo' | 'save' | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleValue = cleanHandle(handle);
  const handleError = handleValue && !HANDLE_PATTERN.test(handleValue) ? '3 to 30 letters, numbers, dots or underscores.' : '';

  useEffect(() => {
    let live = true;
    void fetchVaultRows().then((rows) => {
      if (!live) return;
      setPhotos(rows.filter((row) => row.type === 'photo').map((row) => row.media_url).slice(0, 12));
    });
    return () => {
      live = false;
    };
  }, []);

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy('photo');
    try {
      const result = await compressPhoto(file, { maxDimension: 512 });
      const stored = await uploadMedia(result.file, 'avatars');
      if (stored) setAvatar(stored.url);
      else onError('Photo upload failed. Check your connection and try again.');
    } catch {
      onError('Could not read that photo.');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      onError('Add your name.');
      return;
    }
    if (handleError) {
      onError(handleError);
      return;
    }
    const cleanBio = bio.trim().slice(0, BIO_LIMIT);
    const monthlyRaw = Number(monthly);
    const storefront = {
      years: wholeOrNull(years),
      capacity: wholeOrNull(capacity),
      monthlyPriceCents: monthly.trim() && Number.isFinite(monthlyRaw) && monthlyRaw >= 0 ? Math.round(monthlyRaw * 100) : null,
    };
    const draft: CoachProfileDraft = {
      name: cleanName,
      handle: handleValue,
      bio: cleanBio,
      avatar,
      specialties: parseSpecialties(specialties),
      accepting,
    };
    setBusy('save');
    const [result, frontOk] = await Promise.all([
      saveMyPublicProfile(
        { displayName: cleanName, avatarUrl: avatar, bio: cleanBio, acceptingNewAthletes: accepting, handle: handleValue, specialties: draft.specialties },
        initial.handle,
      ).catch(() => ({ card: false, handle: 'failed' as const })),
      saveStorefront(storefront).catch(() => false),
      supabase.auth.updateUser({ data: { full_name: cleanName } }).catch(() => null),
    ]);
    setBusy(null);
    if (!result.card || !frontOk) {
      onError('Could not save your profile. Check your connection and try again.');
      return;
    }
    if (result.handle === 'taken') {
      onError(`@${handleValue} is taken. Pick another handle.`);
      return;
    }
    if (result.handle === 'failed' || result.handle === 'invalid') {
      onError('Profile saved, but the handle could not be updated.');
      draft.handle = cleanHandle(initial.handle);
    }
    useUserStore.getState().updateProfile({ name: cleanName, avatarUrl: avatar });
    onSaved(draft, storefront);
  };

  const numberField = (label: string, value: string, set: (next: string) => void) => (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-o1-muted">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => set(event.target.value)}
        className="h-[44px] w-28 rounded-xl border border-white/[0.07] bg-o1-canvas px-3 text-right text-[13px] text-o1-text outline-none focus:border-o1-crimson"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 sm:items-center" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border border-white/[0.07] bg-o1-sheet p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-o1-text">Edit profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-o1-muted active:scale-95">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.07] bg-o1-surface active:scale-95"
          >
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xl font-semibold text-o1-text">{(name || '?').slice(0, 1).toUpperCase()}</span>}
            <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/60">
              {busy === 'photo' ? <Loader2 size={12} className="animate-spin text-o1-text" /> : <Camera size={12} className="text-o1-text" />}
            </span>
          </button>
          <div className="flex flex-1 flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="h-[40px] rounded-xl bg-o1-crimson text-[13px] font-semibold text-white active:scale-[0.98]">
              Upload photo
            </button>
            {avatar ? (
              <button type="button" onClick={() => setAvatar('')} className="h-[36px] rounded-xl border border-white/[0.07] text-[12px] font-semibold text-o1-muted active:scale-[0.98]">
                Remove photo
              </button>
            ) : null}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void pickFile(event)} />
        </div>

        {photos.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold text-o1-muted">From your Vault</p>
            <div className="grid grid-cols-6 gap-1.5">
              {photos.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setAvatar(url);
                  }}
                  className={`relative aspect-square overflow-hidden rounded-lg border ${avatar === url ? 'border-white/60' : 'border-white/[0.07]'}`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {avatar === url ? (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-o1-text text-o1-canvas">
                      <Check size={10} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-o1-muted">Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} className={inputClass} />
        </label>

        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-o1-muted">Handle</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-o1-muted">@</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value.replace(/^@+/, ''))}
              maxLength={31}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourname"
              aria-invalid={Boolean(handleError)}
              className={`${inputClass} pl-7`}
            />
          </div>
          {handleError ? <span className="block text-[12px] text-o1-text">{handleError}</span> : null}
        </label>

        <label className="block space-y-1">
          <span className="flex justify-between text-[12px] font-semibold text-o1-muted">
            <span>Bio</span>
            <span className="tabular-nums">{bio.length}/{BIO_LIMIT}</span>
          </span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, BIO_LIMIT))}
            rows={3}
            placeholder="What you coach and who you coach"
            className="w-full resize-none rounded-xl border border-white/[0.07] bg-o1-canvas p-3 text-[13px] leading-snug text-o1-text outline-none placeholder:text-o1-muted focus:border-o1-crimson"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[12px] font-semibold text-o1-muted">Specialties</span>
          <input
            value={specialties}
            onChange={(event) => setSpecialties(event.target.value)}
            maxLength={160}
            placeholder="Powerlifting, Hypertrophy, HYROX"
            className={inputClass}
          />
          <span className="block text-[11px] text-o1-muted">Separate with commas. Up to {SPECIALTY_LIMIT}.</span>
        </label>

        <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
          {numberField('Years coaching', years, setYears)}
          {numberField('Athlete spots', capacity, setCapacity)}
          {numberField('Monthly price (USD)', monthly, setMonthly)}
          <label className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-o1-muted">Taking new athletes</span>
            <button
              type="button"
              role="switch"
              aria-checked={accepting}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setAccepting((on) => !on);
              }}
              className={`relative h-7 w-12 rounded-full transition-colors ${accepting ? 'bg-o1-crimson' : 'bg-white/[0.12]'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-o1-text transition-transform ${accepting ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-[44px] flex-1 rounded-xl border border-white/[0.07] text-[13px] font-semibold text-o1-text active:scale-[0.98]">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy !== null || Boolean(handleError)}
            onClick={() => void save()}
            className="h-[44px] flex-1 rounded-xl bg-o1-crimson text-[13px] font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          >
            {busy === 'save' ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
