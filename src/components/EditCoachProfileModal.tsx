import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Instagram, Music, Youtube, Twitter, Bike, Award, X, Check, Sliders, Film } from 'lucide-react';
import { FullScreenModal, ModalHeader } from '@/components/ui/FullScreenModal';
import { loadSocialProfiles, saveSocialProfiles, type SocialProfiles } from '@/utils/socialProfilesStore';
import { CoachShowcaseSlotModal } from '@/components/CoachShowcaseSlotModal';
import { getCoachShowcase, CoachShowcaseConfig } from '@/utils/coachShowcaseStore';

export interface CoachProfileData {
  name: string;
  title: string;
  bio: string;
  specialties: string[];
  pricingTiers: { title: string; price: string; desc: string }[];
  credentials: string[];
  socials: {
    instagram: string;
    tiktok: string;
    thirdPlatform: {
      platform: string;
      handle: string;
    };
  };
}

interface EditCoachProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachData: CoachProfileData;
  onSave: (updatedData: CoachProfileData) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const DEFAULT_COACH_DATA: CoachProfileData = {
  name: '',
  title: '',
  bio: '',
  specialties: [],
  credentials: [],
  pricingTiers: [],
  socials: {
    instagram: '',
    tiktok: '',
    thirdPlatform: { platform: 'Strava', handle: '' },
  },
};

export const EditCoachProfileModal: React.FC<EditCoachProfileModalProps> = ({
  isOpen,
  onClose,
  coachData,
  onSave,
  showToast,
}) => {
  const getSafeData = (data?: CoachProfileData): CoachProfileData => {
    if (!data) return DEFAULT_COACH_DATA;
    return {
      name: data.name || DEFAULT_COACH_DATA.name,
      title: data.title || DEFAULT_COACH_DATA.title,
      bio: data.bio || DEFAULT_COACH_DATA.bio,
      specialties: Array.isArray(data.specialties) ? data.specialties : DEFAULT_COACH_DATA.specialties,
      credentials: Array.isArray(data.credentials) ? data.credentials : DEFAULT_COACH_DATA.credentials,
      pricingTiers: Array.isArray(data.pricingTiers) ? data.pricingTiers : [],
      socials: {
        instagram: data.socials?.instagram || DEFAULT_COACH_DATA.socials.instagram,
        tiktok: data.socials?.tiktok || DEFAULT_COACH_DATA.socials.tiktok,
        thirdPlatform: {
          platform: data.socials?.thirdPlatform?.platform || DEFAULT_COACH_DATA.socials.thirdPlatform.platform,
          handle: data.socials?.thirdPlatform?.handle || DEFAULT_COACH_DATA.socials.thirdPlatform.handle,
        },
      },
    };
  };

  const [formData, setFormData] = useState<CoachProfileData>(() => getSafeData(coachData));
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [socials, setSocials] = useState<SocialProfiles>(loadSocialProfiles());

  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [showcaseConfig, setShowcaseConfig] = useState<CoachShowcaseConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(getSafeData(coachData));
      setSocials(loadSocialProfiles());
      setShowcaseConfig(getCoachShowcase(coachData.name || 'default'));
    }
  }, [isOpen, coachData]);

  const handleAddSpecialty = () => {
    if (!newSpecialty.trim()) return;
    setFormData((prev) => ({
      ...prev,
      specialties: [...prev.specialties, newSpecialty.trim()],
    }));
    setNewSpecialty('');
  };

  const handleRemoveSpecialty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const handleAddCredential = () => {
    if (!newCredential.trim()) return;
    setFormData((prev) => ({
      ...prev,
      credentials: [...prev.credentials, newCredential.trim()],
    }));
    setNewCredential('');
  };

  const handleRemoveCredential = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    showToast?.('Coach Profile updated & published to Athlete Roster!', 'success');
    onClose();
  };

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose} zIndex={190}>
        <ModalHeader
          onClose={onClose}
          badge={{ label: 'Coach Dossier', color: '#DC2626' }}
          title="Edit Coach Profile & Bio"
          closeSize="sm"
        />

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          {/* Name & Title */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:border-[#DC2626]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:border-[#DC2626]"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block mb-1">
              Coaching Bio & Philosophy
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl p-3 text-xs outline-none focus:border-[#DC2626] font-sans leading-relaxed"
            />
          </div>

          {/* Coaching Specialties */}
          <div>
            <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block mb-1">
              Coaching Specialties
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                >
                  #{spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialty(i)}
                    className="hover:text-black dark:hover:text-white flex items-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add specialty e.g. Hypertrophy..."
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="flex-1 bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-2 py-1 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddSpecialty}
                className="px-2 py-1 bg-[#1A1E1D] dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Credentials */}
          <div>
            <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block mb-1">
              Credentials & Certifications
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.credentials.map((cred, i) => (
                <span
                  key={i}
                  className="bg-[#7A9382]/10 text-[#7A9382] border border-[#7A9382]/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5"
                >
                  <Award className="w-3 h-3 text-[#7A9382]" />
                  <span>{cred}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCredential(i)}
                    className="hover:text-black dark:hover:text-white flex items-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add credential e.g. CSCS, USAW-L2..."
                value={newCredential}
                onChange={(e) => setNewCredential(e.target.value)}
                className="flex-1 bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-2 py-1 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddCredential}
                className="px-2 py-1 bg-[#7A9382] text-white font-bold rounded-xl text-xs"
              >
                + Add
              </button>
            </div>
          </div>

          {/* 5-Slot Reel & Media Showcase (Main Reel + 4 Mini Windows) */}
          <div className="p-3 bg-[#F2F2F7] dark:bg-white/[0.04] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Film className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 dark:text-white block">
                    5-Slot Reel & Media Vault Showcase
                  </span>
                  <span className="text-[9px] text-zinc-500 dark:text-white/50 block">
                    Main Hero Video + 4 Mini Windows (Drill, Cue, Photo, Programs)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShowcaseModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <Sliders className="w-3 h-3" />
                <span>Configure 5 Slots</span>
              </button>
            </div>

            {/* Quick 5-slot summary chip row */}
            {showcaseConfig && (
              <div className="grid grid-cols-5 gap-1 pt-1">
                <div className="p-1 rounded-lg bg-white dark:bg-black/40 border border-red-500/30 text-center">
                  <span className="text-[7.5px] font-black text-red-500 block uppercase">Slot 1</span>
                  <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-200 truncate block">Main Hero</span>
                </div>
                <div className="p-1 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-center">
                  <span className="text-[7.5px] font-black text-zinc-400 block uppercase">Slot 2</span>
                  <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-200 truncate block">{showcaseConfig.slot2.title}</span>
                </div>
                <div className="p-1 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-center">
                  <span className="text-[7.5px] font-black text-zinc-400 block uppercase">Slot 3</span>
                  <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-200 truncate block">{showcaseConfig.slot3.title}</span>
                </div>
                <div className="p-1 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-center">
                  <span className="text-[7.5px] font-black text-zinc-400 block uppercase">Slot 4</span>
                  <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-200 truncate block">{showcaseConfig.slot4.title}</span>
                </div>
                <div className="p-1 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-center">
                  <span className="text-[7.5px] font-black text-amber-500 block uppercase">Slot 5</span>
                  <span className="text-[8px] font-bold text-zinc-700 dark:text-zinc-200 truncate block">{showcaseConfig.slot5.title}</span>
                </div>
              </div>
            )}
          </div>

          {/* Connected Social Accounts — unified 6-platform section */}
          <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
            <label className="text-[10px] text-[#5A5F5D] uppercase font-bold block flex items-center gap-1">
              <Globe className="w-3 h-3" /> Connected Social Accounts
            </label>

            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-3 h-3 text-pink-500" /> },
                { key: 'strava', label: 'Strava', icon: <Bike className="w-3 h-3 text-orange-500" /> },
                { key: 'youtube', label: 'YouTube', icon: <Youtube className="w-3 h-3 text-red-500" /> },
                { key: 'tiktok', label: 'TikTok', icon: <Music className="w-3 h-3 text-cyan-400" /> },
                { key: 'spotify', label: 'Spotify', icon: <Music className="w-3 h-3 text-red-500" /> },
                { key: 'x', label: 'X', icon: <Twitter className="w-3 h-3 text-neutral-400" /> },
              ] as const).map(({ key, label, icon }) => (
                <div key={key} className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-[#5A5F5D] dark:text-white/60 flex items-center gap-1">
                    {icon} {label}
                  </span>
                  <input
                    type="text"
                    value={socials[key]}
                    onChange={(e) => {
                      const updated = { ...socials, [key]: e.target.value };
                      setSocials(updated);
                      saveSocialProfiles(updated);
                    }}
                    placeholder="@handle"
                    className="w-full bg-white dark:bg-black/40 border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-[#7A9382]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-3 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#F2F2F7] dark:bg-white/10 text-[#5A5F5D] dark:text-gray-300 font-bold rounded-2xl text-xs hover:bg-[#E5E5EA] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold rounded-2xl text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish Coach Profile</span>
            </button>
          </div>
        </form>

        {/* 5-Slot Showcase Modal */}
        <CoachShowcaseSlotModal
          isOpen={showShowcaseModal}
          onClose={() => setShowShowcaseModal(false)}
          coachIdOrName={formData.name || 'default'}
          showToast={showToast}
          onSaved={(newConfig) => {
            setShowcaseConfig(newConfig);
            showToast('5-Slot Showcase saved successfully!', 'success');
          }}
        />
    </FullScreenModal>
  );
};
