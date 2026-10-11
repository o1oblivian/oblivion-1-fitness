import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Camera, Trash2, Play, Film, UserCheck, Check, Loader2, Radio } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useUserStore } from '../../../stores/useUserStore';
import { useReelsStore } from '../../../stores/useReelsStore';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { compressPhoto, compressVideo } from '../../../utils/mediaCompressor';
import { VaultRow, deleteVaultRow, fetchVaultRows, removeMedia, saveVaultRow, uploadMedia } from '../../../services/mediaStorage';
import { CoachReelUploadModal } from '../../reels/components/CoachReelUploadModal';
import { insertReelRow } from '../../reels/services/publishCoachReelService';
import { mapReelRow } from '../../reels/services/reelFeed';
import { fetchCoachCard, toExploreCoach } from '../services/coachDirectory';
import { saveMyCoachAvatar } from '../services/coachPublicProfile';

interface VaultMediaItem {
  id: string;
  type: 'photo' | 'video';
  title: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  storagePaths: string[];
}

type VaultTab = 'all' | 'photo' | 'video';

function fromRow(row: VaultRow): VaultMediaItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title || (row.type === 'video' ? 'Clip' : 'Photo'),
    url: row.media_url,
    thumbnailUrl: row.thumbnail_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
    storagePaths: row.storage_path ? [row.storage_path] : [],
  };
}

export const CoachVaultView: React.FC = () => {
  const buddy = useBuddyProfileStore();
  const user = useUserStore();
  const reels = useReelsStore((s) => s.reels);
  const addCoachReel = useReelsStore((s) => s.addCoachReel);
  const [tab, setTab] = useState<VaultTab>('all');
  const [items, setItems] = useState<VaultMediaItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [preview, setPreview] = useState<VaultMediaItem | null>(null);
  const [reelUploadOpen, setReelUploadOpen] = useState(false);
  const [busy, setBusy] = useState<'upload' | 'publish' | 'avatar' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const flash = useCallback((tone: 'ok' | 'error', text: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ tone, text });
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  }, []);

  const reload = useCallback(async () => {
    const uid = await getAuthenticatedUserId();
    if (!uid) {
      setStatus('error');
      return;
    }
    const rows = await fetchVaultRows();
    setItems(rows.map(fromRow));
    setStatus('ready');
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [reload]);

  const isPublished = (item: VaultMediaItem) => reels.some((reel) => reel.videoUrl === item.url);
  const photoCount = items.filter((i) => i.type === 'photo').length;
  const videoCount = items.length - photoCount;
  const visible = items.filter((item) => tab === 'all' || item.type === tab);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    tactileEngine.triggerImpactPulse();
    setBusy('upload');
    const isVideo = file.type.startsWith('video');
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || (isVideo ? 'Clip' : 'Photo');
    try {
      let source: Blob = file;
      let poster: string | undefined;
      try {
        const result = isVideo ? await compressVideo(file) : await compressPhoto(file);
        source = result.file;
        poster = result.thumbnailUrl;
      } catch (err) {
        console.warn('[CoachVault] compression skipped:', err);
      }
      const [media, cover] = await Promise.all([
        uploadMedia(source, 'vault'),
        isVideo && poster ? uploadMedia(poster, 'vault') : Promise.resolve(null),
      ]);
      if (!media) {
        flash('error', 'Upload failed. Check your connection and try again.');
        return;
      }
      const row: VaultRow = {
        id: `vault-media-${Date.now()}`,
        type: isVideo ? 'video' : 'photo',
        title,
        media_url: media.url,
        thumbnail_url: cover?.url ?? null,
        storage_path: media.path,
      };
      if (!(await saveVaultRow(row))) {
        void removeMedia([media.path, cover?.path]);
        flash('error', 'Could not save to your Vault. Try again.');
        return;
      }
      setItems((prev) => [fromRow({ ...row, created_at: new Date().toISOString() }), ...prev]);
      tactileEngine.playPRCelebration();
      flash('ok', 'Saved to your Vault');
    } finally {
      setBusy(null);
    }
  };

  const handleSetAsAvatar = async (item: VaultMediaItem) => {
    const avatarUrl = item.thumbnailUrl || item.url;
    setBusy('avatar');
    const ok = await saveMyCoachAvatar(avatarUrl);
    setBusy(null);
    if (!ok) {
      flash('error', 'Could not update your profile photo. Save your coach profile first.');
      return;
    }
    user.updateProfile({ avatarUrl });
    tactileEngine.playPRCelebration();
    flash('ok', 'Profile photo updated');
  };

  const handlePublishToReels = async (item: VaultMediaItem) => {
    const coachId = await getAuthenticatedUserId();
    if (!coachId) {
      flash('error', 'Sign in to publish reels.');
      return;
    }
    setBusy('publish');
    const card = await fetchCoachCard(coachId);
    const coach = toExploreCoach(
      card ?? { id: coachId, name: user.name || 'Coach', handle: '', avatar: '', bio: '', specialties: [], hourlyRate: null, monthlyRate: null, verified: false, accepting: true },
    );
    const reel = mapReelRow(
      { id: `reel-${Date.now()}`, title: item.title, category: 'BIOMECHANICS', filter_tag: 'TUTORIAL', video_url: item.url, thumbnail_url: item.thumbnailUrl || '', cues: '' },
      coach,
    );
    const ok = await insertReelRow(reel);
    setBusy(null);
    if (!ok) {
      flash('error', 'Could not publish this clip. Try again.');
      return;
    }
    addCoachReel(reel);
    tactileEngine.playPRCelebration();
    flash('ok', 'Published to Reels');
  };

  const handleDelete = (item: VaultMediaItem) => {
    tactileEngine.triggerSelectionBuzz();
    const cover = item.thumbnailUrl || item.url;
    if (buddy.isPhotoOnBuddy(cover)) buddy.toggleVaultPhotoOnBuddy(cover);
    const urls = [item.url, item.thumbnailUrl].filter(Boolean);
    const inUse = urls.includes(user.avatarUrl) || reels.some((reel) => urls.includes(reel.videoUrl) || urls.includes(reel.thumbnail));
    if (!inUse) void removeMedia(item.storagePaths);
    void deleteVaultRow(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setPreview(null);
  };

  const tabs: { id: VaultTab; label: string; icon?: typeof Camera }[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'photo', label: `Photos (${photoCount})`, icon: Camera },
    { id: 'video', label: `Clips (${videoCount})`, icon: Film },
  ];

  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/[0.07] bg-o1-surface p-3.5 text-o1-text select-none">
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={(e) => void handleFileChange(e)} className="hidden" />

      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-2 text-[12px] text-o1-muted">
          <Radio className="h-3.5 w-3.5 text-o1-crimson" />
          On your Buddy card: <strong className="text-o1-text">{buddy.buddyPhotos.length}/6</strong>
        </span>
      </div>

      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-center gap-2 rounded-xl border p-2.5 text-[12px] font-semibold ${
            notice.tone === 'error' ? 'border-o1-crimson/40 bg-o1-crimson/10 text-o1-text' : 'border-emerald-600/30 bg-emerald-600/10 text-emerald-500'
          }`}
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-o1-sheet p-1" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTab(id);
              }}
              className={`flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12px] font-semibold ${
                tab === id ? 'bg-o1-surface text-o1-text' : 'text-o1-muted'
              }`}
            >
              {Icon ? <Icon size={13} /> : null}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy !== null || status !== 'ready'}
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (tab === 'video') setReelUploadOpen(true);
            else fileInputRef.current?.click();
          }}
          className="flex min-h-[40px] items-center gap-1.5 rounded-2xl bg-o1-crimson px-3.5 text-[12px] font-semibold text-white active:scale-95 hover:bg-o1-crimson-hover disabled:opacity-60"
        >
          {busy === 'upload' ? <Loader2 size={14} className="animate-spin" /> : tab === 'video' ? <Film size={14} /> : <Camera size={14} />}
          <span>{busy === 'upload' ? 'Uploading…' : 'Add'}</span>
        </button>
      </div>

      {status === 'loading' ? (
        <p className="py-16 text-center text-[13px] text-o1-muted">Loading your Vault…</p>
      ) : status === 'error' ? (
        <p role="alert" className="py-16 text-center text-[13px] text-o1-text">Sign in to use your Vault.</p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.07] bg-o1-sheet text-o1-muted">
            <Camera size={26} />
          </div>
          <p className="text-[13px] font-semibold text-o1-text">Nothing here yet</p>
          <p className="max-w-xs text-[12px] text-o1-muted">Tap Add to upload photos and training clips. They are backed up to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setPreview(item);
              }}
              aria-label={item.title}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-sheet text-left"
            >
              {item.type === 'video' && !item.thumbnailUrl ? (
                <video src={item.url} className="h-full w-full object-cover" preload="metadata" muted playsInline />
              ) : (
                <img src={item.thumbnailUrl || item.url} alt="" className="h-full w-full object-cover" />
              )}
              {item.type === 'video' ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-o1-text">
                    <Play size={18} className="ml-0.5" />
                  </span>
                </span>
              ) : null}
              {isPublished(item) ? (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-o1-crimson px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  <Film size={10} />
                  Reel
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
                <span className="block truncate text-[12px] font-semibold text-o1-text">{item.title}</span>
                <span className="block text-[10px] text-o1-muted">{item.createdAt}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-3" role="dialog" aria-modal="true" aria-label={preview.title}>
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-sheet text-o1-text">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-3">
              <h3 className="max-w-xs truncate text-[13px] font-semibold sm:max-w-md">{preview.title}</h3>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => handleDelete(preview)} aria-label="Delete" className="flex h-10 w-10 items-center justify-center text-o1-muted">
                  <Trash2 size={16} />
                </button>
                <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="flex h-10 w-10 items-center justify-center text-o1-muted">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex max-h-[60vh] min-h-[260px] items-center justify-center overflow-hidden bg-o1-canvas">
              {preview.type === 'video' ? (
                <video src={preview.url} controls autoPlay playsInline className="max-h-[60vh] w-auto max-w-full object-contain" />
              ) : (
                <img src={preview.url} alt={preview.title} className="max-h-[60vh] w-auto max-w-full object-contain" />
              )}
            </div>

            <div className="space-y-2 border-t border-white/[0.07] bg-o1-canvas p-4">
              {(() => {
                const cover = preview.thumbnailUrl || preview.url;
                const onBuddy = buddy.isPhotoOnBuddy(cover);
                const published = isPublished(preview);
                return (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-o1-sheet p-2">
                      <span className="text-[12px] text-o1-text">{onBuddy ? 'Shown on your Buddy card' : 'Not on your Buddy card'}</span>
                      <button
                        type="button"
                        onClick={() => buddy.toggleVaultPhotoOnBuddy(cover)}
                        className={`min-h-[36px] rounded-xl px-3 text-[12px] font-semibold ${onBuddy ? 'bg-o1-crimson text-white' : 'bg-white/[0.08] text-o1-text'}`}
                      >
                        {onBuddy ? 'Remove' : 'Show'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void handleSetAsAvatar(preview)}
                        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.08] text-[12px] font-semibold text-o1-text disabled:opacity-50"
                      >
                        {busy === 'avatar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                        <span>Use as profile photo</span>
                      </button>
                      {preview.type === 'video' ? (
                        <button
                          type="button"
                          disabled={published || busy !== null}
                          onClick={() => void handlePublishToReels(preview)}
                          className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold ${
                            published ? 'border border-white/[0.07] text-o1-muted' : 'bg-o1-crimson text-white hover:bg-o1-crimson-hover disabled:opacity-50'
                          }`}
                        >
                          {busy === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
                          <span>{published ? 'On Reels' : 'Publish to Reels'}</span>
                        </button>
                      ) : (
                        <button type="button" onClick={() => setPreview(null)} className="min-h-[44px] rounded-xl bg-white/[0.08] text-[12px] font-semibold text-o1-text">
                          Done
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <CoachReelUploadModal
        isOpen={reelUploadOpen}
        onClose={() => setReelUploadOpen(false)}
        onReelPublished={(reelTitle) => {
          tactileEngine.playPRCelebration();
          flash('ok', `"${reelTitle}" published`);
          void reload();
        }}
      />
    </div>
  );
};

export interface CoachVaultModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CoachVaultModal: React.FC<CoachVaultModalProps> = ({ isOpen = true, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-o1-canvas text-o1-text animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label="Vault">
      <div className="sticky top-0 z-20 flex min-h-[52px] items-center justify-between border-b border-white/[0.07] bg-o1-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <span className="text-[14px] font-semibold text-o1-text">Vault</span>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose?.();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-o1-muted"
          aria-label="Close vault"
        >
          <X size={15} />
        </button>
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 p-3 pb-16">
        <CoachVaultView />
      </div>
    </div>
  );
};

export default CoachVaultModal;
