import React, { useState, useRef } from 'react';
import { Camera, X, MapPin, Dumbbell, Users, Film, Sparkles, Check } from 'lucide-react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';

interface ProfileSectionProps {
  name: string;
  handle: string;
  profileImage?: string;
  onSaveName?: (name: string) => void;
  onSaveHandle?: (handle: string) => void;
  onSaveProfileImage?: (url: string) => void;
  onOpenPrivacy?: () => void;
}

const DISCIPLINES = [
  'Hypertrophy',
  'Powerlifting',
  'Hyrox / Hybrid',
  'CrossFit',
  'Calisthenics',
  'Endurance',
  'Strength & Conditioning',
];

export function ProfileSection({
  name: initName,
  handle: initHandle,
  profileImage: initImg,
  onSaveName,
  onSaveHandle,
  onSaveProfileImage,
}: ProfileSectionProps) {
  const [name, setName] = useState(initName || '');
  const [handle, setHandle] = useState(initHandle || '');
  const [profileImg, setProfileImg] = useState(initImg || '');
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [statValue, setStatValue] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile } = useAuthStorage();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfileImg(dataUrl);
      onSaveProfileImage?.(dataUrl);
      updateProfile({ avatar_url: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initName) {
      onSaveName?.(trimmed);
      updateProfile({ display_name: trimmed });
    }
  };

  const saveHandle = () => {
    const clean = handle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
    if (clean && clean !== initHandle) {
      onSaveHandle?.(clean);
      updateProfile({ username: clean });
    }
  };

  const openStatEditor = (key: string, val: any) => {
    setEditingStat(key);
    setStatValue(val ? `${val}` : '');
  };

  const saveStat = () => {
    if (!editingStat) return;
    const num = parseFloat(statValue);
    if (editingStat === 'age') updateProfile({ age: isNaN(num) ? undefined : num });
    if (editingStat === 'height') updateProfile({ height_cm: isNaN(num) ? undefined : num });
    if (editingStat === 'weight') updateProfile({ weight_kg: isNaN(num) ? undefined : num });
    setEditingStat(null);
  };

  return (
    <div>
      <SectionHeader title="Profile & Visibility" />
      <SettingsGroup>
        <div className="min-h-[56px] p-3.5 flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 cursor-pointer group"
          >
            {profileImg ? (
              <img src={profileImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {(name || 'U').slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              placeholder="Your Name"
              className="block w-full text-sm font-semibold text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-zinc-400 font-mono">@</span>
              <input
                value={handle}
                onChange={e => setHandle(e.target.value)}
                onBlur={saveHandle}
                placeholder="username"
                className="text-xs text-zinc-500 dark:text-zinc-400 bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 w-full font-medium"
              />
            </div>
          </div>
        </div>

        {/* Biometrics 3-Column Strip */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-b border-zinc-100 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={() => openStatEditor('age', profile.age)}
            className="min-h-[52px] py-1.5 px-2 flex flex-col items-center justify-center hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Age</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">
              {profile.age ? `${profile.age} yrs` : 'Add'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => openStatEditor('height', profile.height_cm)}
            className="min-h-[52px] py-1.5 px-2 flex flex-col items-center justify-center hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Height</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">
              {profile.height_cm ? `${profile.height_cm} cm` : 'Add'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => openStatEditor('weight', profile.weight_kg)}
            className="min-h-[52px] py-1.5 px-2 flex flex-col items-center justify-center hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Weight</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 mt-0.5">
              {profile.weight_kg ? `${profile.weight_kg} kg` : 'Add'}
            </span>
          </button>
        </div>

        {/* Primary Training Focus / Discipline */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5 mb-2">
            <Dumbbell className="w-3.5 h-3.5 text-[#FF3B30] dark:text-[#FF453A]" />
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Primary Training Discipline
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DISCIPLINES.map((disc) => {
              const isSelected = (profile.primary_focus || 'Hypertrophy') === disc;
              return (
                <button
                  key={disc}
                  type="button"
                  onClick={() => updateProfile({ primary_focus: disc })}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF3B30] dark:bg-[#FF453A] text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {disc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio row */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
            Athlete Bio
          </span>
          <textarea
            value={profile.bio || ''}
            onChange={e => updateProfile({ bio: e.target.value })}
            placeholder="Add training background, PR targets, or coaching philosophy..."
            rows={2}
            className="w-full text-xs text-zinc-800 dark:text-zinc-200 bg-transparent outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed"
          />
        </div>

        {/* Network & Reels Visibility Toggles */}
        <SettingsRow
          label="Buddy Radar Discovery"
          sublabel="Allow nearby athletes to discover your training profile"
          rightElement={
            <ToggleSwitch
              checked={profile.buddy_match_enabled !== false}
              onChange={() => updateProfile({ buddy_match_enabled: profile.buddy_match_enabled === false })}
            />
          }
        />
        <SettingsRow
          label="Elite Reels Presence"
          sublabel="Showcase your profile card and training highlights across reels"
          rightElement={
            <ToggleSwitch
              checked={profile.reels_visibility_enabled !== false}
              onChange={() => updateProfile({ reels_visibility_enabled: profile.reels_visibility_enabled === false })}
            />
          }
        />
      </SettingsGroup>

      {/* Stat Editor Modal */}
      {editingStat && (
        <div className="fixed inset-0 z-[400] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150" onClick={() => setEditingStat(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xs bg-zinc-50 dark:bg-zinc-950 rounded-t-[1.5rem] sm:rounded-2xl border-t sm:border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xl flex flex-col">
            <div className="w-8 h-1 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                Set {editingStat}
              </span>
              <button
                type="button"
                onClick={() => setEditingStat(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-200/70 hover:bg-stone-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              value={statValue}
              onChange={e => setStatValue(e.target.value)}
              type="number"
              autoFocus
              className="w-full text-base font-bold text-center text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 rounded-xl px-3 py-2 outline-none mb-3 focus:border-[#FF3B30]/60 dark:focus:border-[#FF453A]/60"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingStat(null)}
                className="flex-1 py-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStat}
                className="flex-1 py-2 rounded-lg bg-[#FF3B30] dark:bg-[#FF453A] hover:bg-[#E52E24] dark:hover:bg-[#FF3B30] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
