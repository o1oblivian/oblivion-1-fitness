import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Check, X, Plus, Upload } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { useUserStore } from '../../stores/useUserStore';
import { useRoleStore } from '../../stores/useRoleStore';
import { PhotoVaultModal } from '../../features/log/components/PhotoVaultModal';
import { CoachVaultModal } from '../../features/coach/components/CoachVaultModal';
import { tactileEngine } from '../../services/tactileEngine';
import { parseCleanInt, parseCleanNumber } from '../../utils/numberInputUtils';
import { compressPhoto } from '../../utils/mediaCompressor';
import {
  fetchVaultRows,
  removeMedia,
  saveProfileAvatar,
  saveVaultRow,
  uploadMedia,
} from '../../services/mediaStorage';

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;

interface ProfileSectionProps {
  name: string;
  handle: string;
  age: number;
  heightCm: number;
  weightKg: number;
  bio: string;
  eliteReelsPresence: boolean;
  weightUnit?: string;
  heightUnit?: string;
  onUpdateBio: (val: string) => void;
  onToggleReels: (val: boolean) => void;
  onUpdateName?: (val: string) => void;
  onUpdateHandle?: (val: string) => void;
  onUpdateAge?: (val: number) => void;
  onUpdateHeight?: (val: number) => void;
  onUpdateWeight?: (val: number) => void;
}

export const SettingsProfileSection: React.FC<ProfileSectionProps> = ({
  name,
  handle,
  age,
  heightCm,
  weightKg,
  bio,
  eliteReelsPresence,
  weightUnit = 'kg',
  heightUnit = 'cm',
  onUpdateBio,
  onToggleReels,
  onUpdateName,
  onUpdateHandle,
  onUpdateAge,
  onUpdateHeight,
  onUpdateWeight,
}) => {
  const user = useUserStore();
  const role = useRoleStore((s) => s.role);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [localName, setLocalName] = useState(name || user.name);
  const [localHandle, setLocalHandle] = useState(handle || user.handle);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultPhotos, setVaultPhotos] = useState<{ id: string; url: string; title: string }[]>([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const compressed = await compressPhoto(file, { maxDimension: 1024 })
        .then((r) => r.file)
        .catch(() => file);
      const stored = await uploadMedia(compressed, 'avatars');
      if (!stored || !(await saveProfileAvatar(stored.url))) {
        if (stored) void removeMedia([stored.path]);
        setAvatarError('Upload failed. Check your connection and try again.');
        return;
      }
      tactileEngine.playPRCelebration();
      useUserStore.getState().updateProfile({ avatarUrl: stored.url });
      void saveVaultRow({
        id: `vault-avatar-${Date.now()}`,
        type: 'photo',
        title: 'Profile photo',
        media_url: stored.url,
        storage_path: stored.path,
      });
      setIsAvatarPickerOpen(false);
    } finally {
      setAvatarBusy(false);
    }
  };

  useEffect(() => {
    if (!isAvatarPickerOpen) return;
    let live = true;
    void fetchVaultRows().then((rows) => {
      if (!live) return;
      const seen = new Set<string>();
      const photos = rows
        .map((row) => ({
          id: row.id,
          url: row.type === 'video' ? row.thumbnail_url || '' : row.media_url,
          title: row.title,
        }))
        .filter((item) => item.url && !seen.has(item.url) && seen.add(item.url));
      setVaultPhotos(photos);
    });
    return () => {
      live = false;
    };
  }, [isAvatarPickerOpen]);

  const applyAvatar = async (url: string) => {
    setAvatarError(null);
    setAvatarBusy(true);
    const ok = await saveProfileAvatar(url);
    setAvatarBusy(false);
    if (!ok) {
      setAvatarError('Could not update your profile photo. Try again.');
      return false;
    }
    useUserStore.getState().updateProfile({ avatarUrl: url });
    return true;
  };

  const handleSelectAvatarFromVault = async (url: string) => {
    if (!(await applyAvatar(url))) return;
    tactileEngine.playPRCelebration();
    setIsAvatarPickerOpen(false);
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    if (await applyAvatar('')) setIsAvatarPickerOpen(false);
  };

  const handleSaveName = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsEditingName(false);
    const trimmed = localName.trim();
    if (!trimmed) {
      setLocalName(name || user.name);
      return;
    }
    setLocalName(trimmed);
    if (onUpdateName) onUpdateName(trimmed);
    useUserStore.getState().updateProfile({ name: trimmed });
  };

  const handleSaveHandle = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsEditingHandle(false);
    const bare = localHandle
      .trim()
      .replace(/^@+/, '')
      .replace(/[^a-zA-Z0-9._]/g, '');
    if (!bare) {
      setLocalHandle(handle || user.handle);
      return;
    }
    const formatted = `@${bare}`;
    setLocalHandle(formatted);
    if (onUpdateHandle) onUpdateHandle(formatted);
    useUserStore.getState().updateProfile({ handle: formatted });
  };

  const handleWeightChange = (newWeight: number) => {
    if (onUpdateWeight) onUpdateWeight(newWeight);
    useUserStore.getState().setWeightKg(newWeight);
  };

  const inLbs = weightUnit === 'lbs';
  const inInches = heightUnit === 'in';
  const shownWeight = Math.round(weightKg * (inLbs ? LB_PER_KG : 1) * 10) / 10;
  const shownHeight = Math.round(inInches ? heightCm / CM_PER_IN : heightCm);

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Profile &amp; Visibility
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5 text-white transition-colors">
        {/* Profile Card Header with Single Vault-Linked Avatar */}
        <div className="flex items-center gap-3.5">
          {/* Interactive Avatar Button */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsAvatarPickerOpen(true);
            }}
            aria-label="Change profile photo"
            className="relative w-14 h-14 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center font-tactical font-bold text-base shadow-xs cursor-pointer group shrink-0 overflow-hidden"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-lg font-black">O1</span>
            )}

            {/* Hover / Tap Camera Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Profile Name & Handle (Tap to Edit) */}
          <div className="min-w-0 flex-1 space-y-1">
            {isEditingName ? (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
              >
                <input
                  type="text"
                  aria-label="Name"
                  value={localName}
                  maxLength={40}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="bg-black border border-white/[0.07] rounded-xl px-2 min-h-[36px] text-sm font-bold text-white focus:outline-none focus:border-o1-crimson w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  aria-label="Save name"
                  className="w-11 h-11 shrink-0 rounded-xl bg-o1-crimson text-white flex items-center justify-center cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="block max-w-full text-left cursor-pointer"
                onClick={() => setIsEditingName(true)}
              >
                <h4
                  className={`font-sans font-semibold text-sm truncate ${localName ? 'text-white' : 'text-neutral-400'}`}
                >
                  {localName || 'Add your name'}
                </h4>
              </button>
            )}

            {isEditingHandle ? (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveHandle();
                }}
              >
                <input
                  type="text"
                  aria-label="Handle"
                  value={localHandle}
                  maxLength={31}
                  autoCapitalize="none"
                  autoCorrect="off"
                  onChange={(e) => setLocalHandle(e.target.value)}
                  className="bg-black border border-white/[0.07] rounded-xl px-2 min-h-[36px] text-xs font-mono text-neutral-300 focus:outline-none focus:border-o1-crimson w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  aria-label="Save handle"
                  className="w-11 h-11 shrink-0 rounded-xl bg-o1-crimson text-white flex items-center justify-center cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="block max-w-full text-left cursor-pointer"
                onClick={() => setIsEditingHandle(true)}
              >
                <p className="font-sans text-xs text-neutral-400 truncate">
                  {localHandle || 'Add a handle'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input for Device Gallery Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => void handleFileUpload(e)}
          accept="image/*"
          className="hidden"
        />

        {/* Metrics 3-column row with interactive input */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] bg-o1-well rounded-xl py-1.5 px-1 text-center border border-white/[0.07]">
          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-o1-label font-tactical text-neutral-400 font-semibold leading-none">
              Age
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                inputMode="numeric"
                placeholder="--"
                aria-label="Age"
                value={age === 0 ? '' : age}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const next = parseCleanInt(e.target.value);
                  onUpdateAge?.(next <= 0 ? 0 : Math.min(99, next));
                }}
                className="w-12 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-o1-label font-tactical text-neutral-400 font-semibold leading-none">
              Height
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                inputMode="numeric"
                placeholder="--"
                aria-label={`Height in ${heightUnit}`}
                value={shownHeight === 0 ? '' : shownHeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const entered = parseCleanInt(e.target.value);
                  onUpdateHeight?.(inInches ? entered * CM_PER_IN : entered);
                }}
                className="w-10 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-o1-label text-neutral-400 font-mono font-semibold leading-none ml-0.5">
                {heightUnit}
              </span>
            </div>
          </div>

          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-o1-label font-tactical text-neutral-400 font-semibold leading-none">
              Weight
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="--"
                aria-label={`Weight in ${weightUnit}`}
                value={shownWeight === 0 ? '' : shownWeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const entered = parseCleanNumber(e.target.value);
                  handleWeightChange(inLbs ? entered / LB_PER_KG : entered);
                }}
                className="w-12 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-o1-label text-neutral-400 font-mono font-semibold leading-none ml-0.5">
                {weightUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Athlete Bio Field */}
        <div>
          <label className="text-o1-label font-tactical text-neutral-400 font-bold block mb-1 tracking-wide">
            Athlete Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => onUpdateBio(e.target.value)}
            placeholder="Add training background, PR targets, or coaching philosophy..."
            rows={2}
            className="w-full text-xs font-sans bg-black border border-white/[0.07] rounded-xl p-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-o1-crimson transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Elite Reels Presence Toggle */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-tactical font-semibold text-neutral-100 block">
              Elite Reels Presence
            </span>
            <span className="text-o1-label font-sans text-neutral-400 leading-tight block">
              Showcase your profile card and training highlights across reels
            </span>
          </div>
          <CrimsonSwitch
            label="Elite Reels presence"
            checked={eliteReelsPresence}
            onChange={onToggleReels}
          />
        </div>
      </div>

      {/* Avatar Selector from Vault Modal */}
      {isAvatarPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAvatarPickerOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-o1-card border border-white/[0.07] rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-neutral-400" />
                <h4 className="text-xs font-bold font-tactical tracking-wider text-white">
                  Select Profile Avatar
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-o1-label text-neutral-400 leading-snug">
              Select or upload your genuine profile photo. Avatars sync directly to your private{' '}
              {role === 'coach' ? 'Coach' : 'Athlete'} Vault.
            </p>

            {avatarError ? (
              <p
                role="alert"
                className="rounded-xl border border-o1-crimson/40 bg-o1-crimson/10 px-3 py-2 text-o1-label font-semibold text-o1-text"
              >
                {avatarError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              <span>{avatarBusy ? 'Saving…' : 'Upload Photo from Gallery'}</span>
            </button>

            {vaultPhotos.length > 0 && (
              <div className="space-y-2">
                <span className="text-o1-label font-mono font-bold text-neutral-400 block">
                  Photos in Your Vault ({vaultPhotos.length})
                </span>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {vaultPhotos.map((item) => {
                    const isCurrent = user.avatarUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={avatarBusy}
                        onClick={() => void handleSelectAvatarFromVault(item.url)}
                        className={`aspect-square rounded-xl overflow-hidden relative border transition-all cursor-pointer group ${
                          isCurrent
                            ? 'border-o1-crimson'
                            : 'border-white/[0.07] hover:border-white/[0.14]'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isCurrent && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-o1-crimson text-white flex items-center justify-center text-o1-label">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setIsAvatarPickerOpen(false);
                  setIsVaultOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-white text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open {role === 'coach' ? 'Coach' : 'Athlete'} Vault</span>
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={(e) => void handleRemovePhoto(e)}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Avatar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vault Modals (Single Unified Location) */}
      {isVaultOpen && role === 'coach' && (
        <CoachVaultModal isOpen onClose={() => setIsVaultOpen(false)} />
      )}
      {isVaultOpen && role !== 'coach' && (
        <PhotoVaultModal isOpen onClose={() => setIsVaultOpen(false)} />
      )}
    </div>
  );
};
