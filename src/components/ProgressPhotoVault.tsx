import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Play,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Grid2X2,
  Grid3X3,
} from 'lucide-react';
import {
  VaultPhoto,
  fetchVaultPhotos,
  uploadVaultPhoto,
  deleteVaultPhoto,
  toggleBuddyVisibility,
} from '../utils/profileMediaStore';
import { ApplePhotoGalleryViewer, AppleGalleryItem } from './ApplePhotoGalleryViewer';

interface ProgressPhotoVaultProps {
  onOpenPayPlan?: () => void;
  showToast?: (message: string) => void;
  isPaid?: boolean;
}

export const ProgressPhotoVault: React.FC<ProgressPhotoVaultProps> = ({ onOpenPayPlan, showToast }) => {
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gridDensity, setGridDensity] = useState<'3-col' | '4-col'>('3-col');
  const [showBatchDeletePrompt, setShowBatchDeletePrompt] = useState(false);

  const isPaid = true;
  const maxPhotos = 12;

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVaultPhotos('current_user');
      setPhotos(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();

    const handleVaultUpdated = () => {
      loadPhotos();
    };

    window.addEventListener('o1fc_athlete_vault_updated', handleVaultUpdated);
    window.addEventListener('o1fc_vault_sync', handleVaultUpdated);
    return () => {
      window.removeEventListener('o1fc_athlete_vault_updated', handleVaultUpdated);
      window.removeEventListener('o1fc_vault_sync', handleVaultUpdated);
    };
  }, [loadPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= maxPhotos) {
      if (onOpenPayPlan) onOpenPayPlan();
      return;
    }

    setIsUploading(true);
    try {
      const newPhoto = await uploadVaultPhoto(file);
      if (newPhoto) {
        setPhotos((prev) => [newPhoto, ...prev.filter((p) => p.id !== newPhoto.id)]);
        if (showToast) showToast('Media added to Athlete Vault');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to upload media');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (galleryItem: AppleGalleryItem) => {
    const photo = photos.find((p) => p.id === galleryItem.id);
    if (!photo) return;
    try {
      await deleteVaultPhoto(photo.id, photo.media_url);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (showToast) showToast('Media removed from vault');
    } catch {
      if (showToast) showToast('Failed to delete media');
    }
  };

  const handleToggleBuddy = async (galleryItem: AppleGalleryItem) => {
    const photo = photos.find((p) => p.id === galleryItem.id);
    if (!photo) return;
    const nextState = !photo.show_on_buddy;
    try {
      await toggleBuddyVisibility(photo.id, nextState);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, show_on_buddy: nextState } : p))
      );
      if (showToast) {
        showToast(nextState ? 'Media will show on Buddy Card' : 'Media hidden from Buddy Card');
      }
    } catch {
      // rollback
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleBatchToggleBuddy = async (makeVisible: boolean) => {
    const targetIds = selectedIds.size > 0 ? selectedIds : new Set(photos.map((p) => p.id));
    try {
      for (const id of targetIds) {
        await toggleBuddyVisibility(id, makeVisible);
      }
      setPhotos((prev) =>
        prev.map((p) => (targetIds.has(p.id) ? { ...p, show_on_buddy: makeVisible } : p))
      );
      if (showToast) {
        showToast(makeVisible ? 'Selected media activated on Buddy Radar' : 'Selected media hidden from Buddy Radar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchDelete = async () => {
    const targetIds = selectedIds.size > 0 ? selectedIds : new Set(photos.map((p) => p.id));
    try {
      for (const id of targetIds) {
        const photo = photos.find((p) => p.id === id);
        if (photo) {
          await deleteVaultPhoto(photo.id, photo.media_url);
        }
      }
      setPhotos((prev) => prev.filter((p) => !targetIds.has(p.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBatchDeletePrompt(false);
      if (showToast) showToast('Selected media removed from vault');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to delete some media');
    }
  };

  const galleryItems: AppleGalleryItem[] = useMemo(() => {
    return photos.map((p) => ({
      id: p.id,
      url: p.media_url,
      thumbnailUrl: p.media_url,
      type: (p.media_type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
      title: p.caption || (p.media_type === 'video' ? 'Form Check Video' : 'Athlete Progress Log'),
      date: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      show_on_buddy: p.show_on_buddy,
      created_at: p.created_at,
    }));
  }, [photos]);

  const buddyCount = photos.filter((p) => p.show_on_buddy).length;

  return (
    <div className="w-full bg-white dark:bg-[#121620] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-2xl p-3.5 shadow-2xs dark:shadow-xl text-[#1C1C1E] dark:text-white space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shrink-0">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[10px] font-bold uppercase font-mono tracking-wider">Athlete Media Vault</h3>
              {buddyCount > 0 && (
                <span className="flex items-center gap-0.5 text-[8px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20 shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  {buddyCount} on Buddy
                </span>
              )}
            </div>
            <p className="text-[9px] text-[#848785] dark:text-gray-400 font-mono">
              {photos.length} / {maxPhotos} media
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Density Switcher */}
          <button
            type="button"
            onClick={() => setGridDensity((prev) => (prev === '3-col' ? '4-col' : '3-col'))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            title={gridDensity === '3-col' ? 'Compact 4-Column Grid' : 'Standard 3-Column Grid'}
            aria-label="Toggle Grid Density"
          >
            {gridDensity === '3-col' ? <Grid3X3 className="w-3.5 h-3.5" /> : <Grid2X2 className="w-3.5 h-3.5" />}
          </button>

          {/* Select Mode Toggle */}
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedIds(new Set());
              }}
              className={`px-2 py-1 rounded-lg font-mono text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                isSelectMode
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-neutral-200 dark:hover:bg-white/15'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>{isSelectMode ? 'Done' : 'Select'}</span>
            </button>
          )}

          <label className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0">
            {isUploading ? (
              <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            <span>Add</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Select Mode Quick Bar */}
      {isSelectMode && (
        <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2 animate-in fade-in duration-150 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectAll}
              className="py-1 px-2 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-zinc-800 dark:text-white text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
            >
              {selectedIds.size === photos.length && photos.length > 0 ? (
                <CheckSquare className="w-3 h-3 text-red-500" />
              ) : (
                <Square className="w-3 h-3" />
              )}
              <span>{selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
              {selectedIds.size} of {photos.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={selectedIds.size === 0 && photos.length === 0}
              onClick={() => handleBatchToggleBuddy(true)}
              className="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
              title="Show all selected on Buddy Radar"
            >
              <Eye className="w-3 h-3" />
              <span>Show Radar</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0 && photos.length === 0}
              onClick={() => handleBatchToggleBuddy(false)}
              className="py-1 px-2 rounded-lg bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
              title="Hide all selected from Buddy Radar"
            >
              <EyeOff className="w-3 h-3" />
              <span>Hide</span>
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setShowBatchDeletePrompt(true)}
              className="py-1 px-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/30 text-[9px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40"
              title="Delete selected media"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-20">
          <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-center">
          <Camera className="w-6 h-6 text-[#848785] dark:text-gray-600" />
          <p className="text-[10px] font-mono text-[#848785] dark:text-gray-500">
            Athlete Vault is empty. Upload physique photos & form videos.
          </p>
          <p className="text-[8px] font-mono text-[#848785] dark:text-gray-600">
            Toggle the eye icon on any media to display it on your Buddy card.
          </p>
        </div>
      ) : (
        <div className={gridDensity === '4-col' ? 'grid grid-cols-4 gap-1' : 'grid grid-cols-3 gap-1.5'}>
          {photos.map((p, idx) => {
            const isVideo = p.media_type === 'video';
            const isSelected = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (isSelectMode) {
                    handleToggleSelect(p.id);
                  } else {
                    setSelectedIndex(idx);
                  }
                }}
                className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 group cursor-pointer transition-all active:scale-[0.97] ${
                  isSelected
                    ? 'border-2 border-red-500 ring-2 ring-red-500/40'
                    : 'border border-[rgba(0,0,0,0.08)] dark:border-white/10 hover:border-red-500/60'
                }`}
              >
                {isVideo && p.media_url ? (
                  <video
                    src={p.media_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    muted
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <img
                    src={p.media_url || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = '0.5';
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {isVideo && (
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                    <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                  </span>
                )}
                
                {/* Select Mode Checkbox or Direct Eye Toggle Button for Buddy Card */}
                {isSelectMode ? (
                  <div
                    className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm ring-1 ring-white/60'
                        : 'bg-black/60 text-white/40 border border-white/30'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVal = !p.show_on_buddy;
                      handleToggleBuddy({ id: p.id, show_on_buddy: nextVal } as any);
                    }}
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 z-10 ${
                      p.show_on_buddy
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-black/50 text-white/70 hover:text-white'
                    }`}
                    title={p.show_on_buddy ? 'Visible on Buddy Card (tap to hide)' : 'Hidden from Buddy Card (tap to show)'}
                    aria-label="Toggle Buddy Visibility"
                  >
                    {p.show_on_buddy ? (
                      <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 stroke-[1.8]" />
                    )}
                  </button>
                )}
                <span className="absolute bottom-1.5 left-1.5 text-[8px] font-mono text-white/80">
                  {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </button>
            );
          })}
          {photos.length < maxPhotos && !isSelectMode && (
            <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-[rgba(0,0,0,0.08)] dark:border-white/15 hover:border-red-500/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95">
              <Plus className="w-4 h-4 text-[#848785] dark:text-gray-500" />
              <span className="text-[8px] font-mono font-bold text-[#848785] dark:text-gray-500">Add Pic/Vid</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      )}

      {/* Batch Deletion Confirmation Modal */}
      {showBatchDeletePrompt && (
        <div
          className="fixed inset-0 z-[99999] bg-black/50 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowBatchDeletePrompt(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#181B22] border border-neutral-200 dark:border-white/15 rounded-2xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150 text-center text-zinc-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Delete {selectedIds.size} Media Item{selectedIds.size > 1 ? 's' : ''}?
              </h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed">
                These photos and videos will be permanently removed from your vault. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeletePrompt(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-mono text-xs font-bold cursor-pointer transition-all active:scale-95 border border-neutral-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-red-900/30"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple Photo Gallery Fullscreen Viewer */}
      {selectedIndex !== null && (
        <ApplePhotoGalleryViewer
          isOpen={selectedIndex !== null}
          onClose={() => setSelectedIndex(null)}
          items={galleryItems}
          initialIndex={selectedIndex}
          ownerName="Athlete"
          onToggleBuddy={handleToggleBuddy}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
