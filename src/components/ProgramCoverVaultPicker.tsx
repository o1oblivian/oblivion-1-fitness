import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  Check,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Camera,
  Layers,
} from 'lucide-react';
import {
  getSavedCoachVaultItems,
  getSavedAthleteVaultItems,
  persistUploadedVaultMedia,
} from '@/utils/vaultPersistenceStore';
import { VaultMediaItem } from '@/components/MediaVaultModal';

export interface PresetPack {
  label: string;
  category: string;
  images: { url: string; title: string }[];
}

export const O1_CURATED_PRESET_PACKS: PresetPack[] = [
  {
    label: 'Hypertrophy & Iron',
    category: 'Hypertrophy',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
        title: 'Barbell Plates & Rack',
      },
      {
        url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
        title: 'Heavy Dumbbell Focus',
      },
      {
        url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop',
        title: 'Cable Muscular Tension',
      },
      {
        url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
        title: 'Squat Rack & Barbell',
      },
    ],
  },
  {
    label: 'Strength & Power',
    category: 'Strength',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
        title: 'Chalked Hands Barbell',
      },
      {
        url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000&auto=format&fit=crop',
        title: 'Deadlift Platform',
      },
      {
        url: 'https://images.unsplash.com/photo-1584863265045-f9d10ca7fa61?q=80&w=1000&auto=format&fit=crop',
        title: 'Iron Bumper Plates',
      },
      {
        url: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=1000&auto=format&fit=crop',
        title: 'Powerlifting Grit',
      },
    ],
  },
  {
    label: 'HYROX & Conditioning',
    category: 'Conditioning',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1000&auto=format&fit=crop',
        title: 'Sled Turf & Sprint',
      },
      {
        url: 'https://images.unsplash.com/photo-1434596922112-19c563067271?q=80&w=1000&auto=format&fit=crop',
        title: 'Metabolic Conditioning',
      },
      {
        url: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=1000&auto=format&fit=crop',
        title: 'High-Pace Athlete Drive',
      },
      {
        url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
        title: 'Endurance & Stamina',
      },
    ],
  },
  {
    label: 'Mobility & Studio',
    category: 'Mobility',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
        title: 'Calm Studio Movement',
      },
      {
        url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
        title: 'Functional Flexibility',
      },
      {
        url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1000&auto=format&fit=crop',
        title: 'Decompression & Alignment',
      },
    ],
  },
  {
    label: 'Physique & Recomp',
    category: 'Body Recomp',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop',
        title: 'Athletic Definition',
      },
      {
        url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1000&auto=format&fit=crop',
        title: 'Performance Lighting',
      },
      {
        url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop',
        title: 'Lean Athletic Silhouette',
      },
    ],
  },
];

interface Props {
  coverUrl: string;
  onSelectCover: (url: string) => void;
  programCategory?: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProgramCoverVaultPicker: React.FC<Props> = ({
  coverUrl,
  onSelectCover,
  programCategory,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'vault' | 'presets' | 'url'>('vault');
  const [presetCategory, setPresetCategory] = useState<string>(() => {
    if (programCategory?.toLowerCase().includes('strength') || programCategory?.toLowerCase().includes('power')) return 'Strength';
    if (programCategory?.toLowerCase().includes('hyrox') || programCategory?.toLowerCase().includes('conditioning')) return 'Conditioning';
    if (programCategory?.toLowerCase().includes('mobility')) return 'Mobility';
    if (programCategory?.toLowerCase().includes('recomp')) return 'Body Recomp';
    return 'Hypertrophy';
  });

  const [vaultItems, setVaultItems] = useState<VaultMediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync vault items from storage & events
  const loadVault = () => {
    const coachItems = getSavedCoachVaultItems();
    const athleteItems = getSavedAthleteVaultItems();
    // Combine unique media items (filtering to photos or video thumbnails)
    const combined = [...coachItems, ...athleteItems].filter(
      (it, idx, arr) => arr.findIndex((x) => x.url === it.url || x.id === it.id) === idx
    );
    setVaultItems(combined);
  };

  useEffect(() => {
    loadVault();

    const handleVaultSync = () => loadVault();
    window.addEventListener('o1fc_coach_vault_updated', handleVaultSync);
    window.addEventListener('o1fc_athlete_vault_updated', handleVaultSync);
    window.addEventListener('o1fc_vault_sync', handleVaultSync);

    return () => {
      window.removeEventListener('o1fc_coach_vault_updated', handleVaultSync);
      window.removeEventListener('o1fc_athlete_vault_updated', handleVaultSync);
      window.removeEventListener('o1fc_vault_sync', handleVaultSync);
    };
  }, []);

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a photo (JPG, PNG, WEBP)', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const savedItem = await persistUploadedVaultMedia(file, 'coach', 'Program Cover Artwork');
      const chosenUrl = savedItem.url || savedItem.thumbnailUrl;
      if (chosenUrl) {
        onSelectCover(chosenUrl);
        loadVault();
        showToast('Photo added to Vault & set as Cover Artwork', 'success');
      }
    } catch (err) {
      console.error('Failed to upload cover to vault:', err);
      showToast('Could not process photo upload. Please retry.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      showToast('Enter a valid image URL starting with https://', 'error');
      return;
    }
    onSelectCover(trimmed);
    showToast('Custom cover link applied', 'success');
  };

  const activePresetPack = O1_CURATED_PRESET_PACKS.find((p) => p.category === presetCategory) || O1_CURATED_PRESET_PACKS[0];

  return (
    <div className="space-y-2.5 obsidian-panel rounded-2xl p-3 shadow-2xs border border-black/10 dark:border-white/10">
      {/* 1. HERO PREVIEW CARD */}
      <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-zinc-900 border border-black/10 dark:border-white/15 shadow-inner group">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Program Cover Preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1.5 bg-zinc-900">
            <ImageIcon className="w-6 h-6 opacity-40" />
            <span className="text-[11px] font-medium">No cover artwork selected</span>
          </div>
        )}

        {/* Gradient Overlay & Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-sm">
            Program Artwork
          </span>
          {coverUrl && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
            </span>
          )}
        </div>

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/90 drop-shadow truncate max-w-[65%]">
            {programCategory || 'Training OS'} · Official Artwork
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-black text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-3 h-3" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 2. SEGMENTED VAULT CONTROLLER TABS */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('vault')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <FolderOpen className="w-3 h-3" />
          <span>My Vault ({vaultItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>O1 Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          <span>URL</span>
        </button>
      </div>

      {/* 3. TAB PANELS */}

      {/* TAB 1: MY VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-2 pt-0.5 animate-fadeIn">
          {vaultItems.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5 scrollbar-thin">
              {vaultItems.map((item) => {
                const isSelected = coverUrl === item.url || coverUrl === item.thumbnailUrl;
                const displaySrc = item.thumbnailUrl || item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectCover(item.url || item.thumbnailUrl);
                      showToast('Selected artwork from Vault', 'success');
                    }}
                    className={`relative h-20 rounded-xl overflow-hidden border transition-all cursor-pointer group text-left ${
                      isSelected
                        ? 'border-black dark:border-white ring-2 ring-black/20 dark:ring-white/30'
                        : 'border-black/10 dark:border-white/10 hover:border-black/40 dark:hover:border-white/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={displaySrc} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                    <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-medium text-white truncate">
                      {item.title || 'Vault Asset'}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-black/15 dark:border-white/15 text-center space-y-2">
              <FolderOpen className="w-5 h-5 mx-auto text-zinc-400 opacity-60" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-black dark:text-white">Your Vault is empty</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Upload gym photos or choose from O1 Presets to save assets to your vault.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <Upload className="w-3 h-3" /> Upload First Photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: O1 PRESETS */}
      {activeTab === 'presets' && (
        <div className="space-y-2 pt-0.5 animate-fadeIn">
          {/* Preset Category Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {O1_CURATED_PRESET_PACKS.map((pack) => (
              <button
                key={pack.category}
                type="button"
                onClick={() => setPresetCategory(pack.category)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                  presetCategory === pack.category
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-2xs'
                    : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {pack.label}
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-0.5 scrollbar-thin">
            {activePresetPack.images.map((img, i) => {
              const isSelected = coverUrl === img.url;
              return (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => {
                    onSelectCover(img.url);
                    showToast(`Applied ${img.title}`, 'success');
                  }}
                  className={`relative h-20 rounded-xl overflow-hidden border transition-all cursor-pointer group text-left ${
                    isSelected
                      ? 'border-black dark:border-white ring-2 ring-black/20 dark:ring-white/30'
                      : 'border-black/10 dark:border-white/10 opacity-75 hover:opacity-100 hover:border-black/40 dark:hover:border-white/40'
                  }`}
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-medium text-white truncate">
                    {img.title}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT DEVICE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-2 pt-0.5 animate-fadeIn">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-dashed border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white transition-all cursor-pointer text-center bg-black/[0.02] dark:bg-white/[0.02] space-y-2 active:scale-[0.99]"
          >
            {isUploading ? (
              <div className="py-3 flex flex-col items-center justify-center gap-1.5">
                <Loader2 className="w-5 h-5 text-black dark:text-white animate-spin" />
                <span className="text-xs font-semibold text-black dark:text-white">Uploading & Saving to Vault...</span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto text-black dark:text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-black dark:text-white">Tap to browse Camera Roll or Files</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Supports high-resolution JPG, PNG, and WebP (Stored permanently in your Vault)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM URL */}
      {activeTab === 'url' && (
        <div className="space-y-2 pt-0.5 animate-fadeIn">
          <div className="flex gap-1.5 items-center">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 obsidian-input rounded-xl px-3 py-2 text-xs placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs"
            >
              Apply Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
