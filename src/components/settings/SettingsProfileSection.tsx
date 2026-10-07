import React, { useRef, useState, useMemo } from 'react';
import { Camera, Trash2, Edit2, Check, X, Radio, Lock, Plus, Sparkles, Film, UserCheck, Upload } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { useUserStore } from '../../stores/useUserStore';
import { useRoleStore } from '../../stores/useRoleStore';
import { useBuddyProfileStore } from '../../stores/useBuddyProfileStore';
import { PhotoVaultModal } from '../../features/log/components/PhotoVaultModal';
import { CoachVaultModal } from '../../features/coach/components/CoachVaultModal';
import { tactileEngine } from '../../services/tactileEngine';
import { parseCleanInt, parseCleanNumber } from '../../utils/numberInputUtils';

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
  const buddy = useBuddyProfileStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [localName, setLocalName] = useState(name || user.name);
  const [localHandle, setLocalHandle] = useState(handle || user.handle);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        tactileEngine.playPRCelebration();
        // 1. Update user profile avatar
        useUserStore.getState().updateProfile({ avatarUrl: dataUrl });
        try {
          localStorage.setItem('o1_profile_avatar_url', dataUrl);
        } catch (err) {
          console.error(err);
        }

        // 2. Sync to vault so it's safely stored
        try {
          const vaultKey = role === 'coach' ? 'o1_coach_exercise_vault_media' : 'o1_athlete_physique_vault_v1';
          const rawVault = localStorage.getItem(vaultKey);
          const existing = rawVault ? JSON.parse(rawVault) : [];
          if (role === 'coach') {
            existing.unshift({
              id: `coach-vault-${Date.now()}`,
              url: dataUrl,
              title: 'Profile Avatar',
              type: 'image',
              uploadedAt: new Date().toISOString(),
            });
          } else {
            existing.unshift({
              id: `athlete-vault-${Date.now()}`,
              dataUrl,
              note: 'Profile Avatar',
              timestamp: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0],
            });
          }
          localStorage.setItem(vaultKey, JSON.stringify(existing));
        } catch (err) {
          console.error('Failed to sync avatar to vault:', err);
        }

        // 3. Add to buddy photos for radar presence
        useBuddyProfileStore.getState().addBuddyPhoto(dataUrl);

        setIsAvatarPickerOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Read available photos from Vault (single master source, zero fake mock photos)
  const availableVaultPhotos = useMemo(() => {
    try {
      const athleteVault = localStorage.getItem('o1_athlete_physique_vault_v1');
      const coachVault = localStorage.getItem('o1_coach_exercise_vault_media');

      const items: { id: string; url: string; title: string }[] = [];

      if (role === 'coach' && coachVault) {
        const parsed = JSON.parse(coachVault);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.url && !item.url.includes('images.unsplash.com')) {
              items.push({
                id: item.id || `coach-${Math.random()}`,
                url: item.type === 'video' ? (item.thumbnailUrl || item.url) : item.url,
                title: item.title || 'Coach Media',
              });
            }
          });
        }
      } else if (athleteVault) {
        const parsed = JSON.parse(athleteVault);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.dataUrl && !item.dataUrl.includes('images.unsplash.com')) {
              items.push({
                id: item.id || `photo-${Math.random()}`,
                url: item.thumbnailUrl || item.dataUrl,
                title: item.note || 'Physique Check-in',
              });
            }
          });
        }
      }

      // If user uploaded genuine buddyPhotos
      if (buddy.buddyPhotos && buddy.buddyPhotos.length > 0) {
        buddy.buddyPhotos
          .filter((photoUrl) => typeof photoUrl === 'string' && !photoUrl.includes('images.unsplash.com'))
          .forEach((photoUrl, idx) => {
            if (!items.some((i) => i.url === photoUrl)) {
              items.push({
                id: `buddy-${idx}`,
                url: photoUrl,
                title: `Uploaded Photo #${idx + 1}`,
              });
            }
          });
      }

      return items;
    } catch (e) {
      return [];
    }
  }, [role, buddy.buddyPhotos, isVaultOpen, isAvatarPickerOpen]);

  const handleSelectAvatarFromVault = (url: string) => {
    tactileEngine.playPRCelebration();
    useUserStore.getState().updateProfile({ avatarUrl: url });
    try {
      localStorage.setItem('o1_profile_avatar_url', url);
    } catch (err) {
      console.error(err);
    }
    setIsAvatarPickerOpen(false);
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    useUserStore.getState().updateProfile({ avatarUrl: '' });
    try {
      localStorage.removeItem('o1_profile_avatar_url');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveName = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsEditingName(false);
    if (onUpdateName) onUpdateName(localName);
    useUserStore.getState().updateProfile({ name: localName });
  };

  const handleSaveHandle = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsEditingHandle(false);
    const formatted = localHandle.startsWith('@') ? localHandle : `@${localHandle}`;
    if (onUpdateHandle) onUpdateHandle(formatted);
    useUserStore.getState().updateProfile({ handle: formatted });
  };

  const handleWeightChange = (newWeight: number) => {
    if (onUpdateWeight) onUpdateWeight(newWeight);
    useUserStore.getState().setWeightKg(newWeight);
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold uppercase px-1">
        Profile &amp; Visibility
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5 text-white transition-colors">
        {/* Profile Card Header with Single Vault-Linked Avatar */}
        <div className="flex items-center gap-3.5">
          {/* Interactive Avatar Button */}
          <div
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsAvatarPickerOpen(true);
            }}
            className="relative w-14 h-14 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center font-tactical font-bold text-base shadow-xs cursor-pointer group shrink-0 overflow-hidden"
            title="Tap to change profile picture from Vault or Gallery"
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
          </div>

          {/* Profile Name & Handle (Tap to Edit) */}
          <div className="min-w-0 flex-1 space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="bg-black border border-white/[0.07] rounded-xl px-2 py-0.5 text-sm font-bold text-white focus:outline-none focus:border-o1-crimson w-full"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-1 rounded-md bg-o1-crimson text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h4 className="font-tactical font-bold text-sm text-white truncate group-hover:text-o1-crimson transition-colors">
                  {localName}
                </h4>
                <Edit2 className="w-3 h-3 text-neutral-400 group-hover:text-neutral-200" />
              </div>
            )}

            {isEditingHandle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={localHandle}
                  onChange={(e) => setLocalHandle(e.target.value)}
                  className="bg-black border border-white/[0.07] rounded-xl px-2 py-0.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-o1-crimson w-full"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveHandle}
                  className="p-1 rounded-md bg-o1-crimson text-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingHandle(true)}>
                <p className="font-sans text-xs text-neutral-400 truncate group-hover:text-neutral-200 transition-colors">
                  {localHandle}
                </p>
                <Edit2 className="w-2.5 h-2.5 text-neutral-400 group-hover:text-neutral-200" />
              </div>
            )}

            {user.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-red-400 flex items-center justify-center cursor-pointer"
                aria-label="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Input for Device Gallery Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Metrics 3-column row with interactive input */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] bg-o1-well rounded-xl py-1.5 px-1 text-center border border-white/[0.07]">
          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-tactical uppercase text-neutral-400 font-semibold leading-none">
              Age
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                placeholder="0"
                value={age === 0 ? '' : age}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdateAge && onUpdateAge(parseCleanInt(e.target.value))}
                className="w-12 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-tactical uppercase text-neutral-400 font-semibold leading-none">
              Height
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                placeholder="0"
                value={heightCm === 0 ? '' : heightCm}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onUpdateHeight && onUpdateHeight(parseCleanInt(e.target.value))}
                className="w-10 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] text-neutral-400 font-mono font-semibold leading-none ml-0.5">{heightUnit}</span>
            </div>
          </div>

          <div className="px-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-tactical uppercase text-neutral-400 font-semibold leading-none">
              Weight
            </span>
            <div className="flex items-center justify-center h-5 mt-0.5">
              <input
                type="number"
                step="0.5"
                placeholder="0"
                value={weightKg === 0 ? '' : weightKg}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleWeightChange(parseCleanNumber(e.target.value))}
                className="w-10 text-center bg-transparent font-mono font-bold text-xs text-white focus:outline-none p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] text-neutral-400 font-mono font-semibold leading-none ml-0.5">{weightUnit}</span>
            </div>
          </div>
        </div>

        {/* Athlete Bio Field */}
        <div>
          <label className="text-[11px] font-tactical uppercase text-neutral-400 font-bold block mb-1 tracking-wide">
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
            <span className="text-[11px] font-sans text-neutral-400 leading-tight block">
              Showcase your profile card and training highlights across reels
            </span>
          </div>
          <CrimsonSwitch checked={eliteReelsPresence} onChange={onToggleReels} />
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
                <Camera className="w-4 h-4 text-o1-crimson" />
                <h4 className="text-xs font-bold font-tactical uppercase tracking-wider text-white">
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

            <p className="text-[11px] text-neutral-400 leading-snug">
              Select or upload your genuine profile photo. Avatars sync directly to your private {role === 'coach' ? 'Coach' : 'Athlete'} Vault.
            </p>

            {/* Direct Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo from Gallery</span>
            </button>

            {availableVaultPhotos.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 block">
                  Photos in Your Vault ({availableVaultPhotos.length})
                </span>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableVaultPhotos.map((item) => {
                    const isCurrent = user.avatarUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectAvatarFromVault(item.url)}
                        className={`aspect-square rounded-xl overflow-hidden relative border transition-all cursor-pointer group ${
                          isCurrent
                            ? 'border-o1-crimson ring-2 ring-o1-crimson'
                            : 'border-white/[0.07] hover:border-white/[0.14]'
                        }`}
                      >
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {isCurrent && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-o1-crimson text-white flex items-center justify-center text-[9px] shadow-xs">
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
                className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open {role === 'coach' ? 'Coach' : 'Athlete'} Vault</span>
              </button>

              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleRemovePhoto(e);
                    setIsAvatarPickerOpen(false);
                  }}
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
