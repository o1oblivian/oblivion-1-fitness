import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Film, CheckCircle2, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import {
  compressVideo,
  CompressedMediaResult,
  VideoCompressionError,
  formatFileSize,
} from '../../../utils/mediaCompressor';
import { useUserStore } from '../../../stores/useUserStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ReelUploadMediaZone } from './ReelUploadMediaZone';
import { ReelCategorySelector } from './ReelCategorySelector';
import { ReelFormFields } from './ReelFormFields';
import { deleteOwnReel, publishReel } from '../services/publishReelService';
import { fetchMemberReels } from '../services/reelFeed';
import type { BodyPartTag, ReelCategoryId } from '../reelCategories';
import type { ExploreReelItem } from '../reelTypes';
import {
  REEL_LIMIT,
  REEL_LONG_EDGE,
  REEL_MAX_BYTES,
  REEL_MAX_SECS,
  reelSlotsLine,
} from '../../../../shared/reelLimits';

interface ReelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelPublished?: (reelTitle: string) => void;
}

type OwnReels =
  | { status: 'loading' }
  | { status: 'ready'; reels: ExploreReelItem[] }
  | { status: 'error'; message: string };

export const ReelUploadModal: React.FC<ReelUploadModalProps> = ({
  isOpen,
  onClose,
  onReelPublished,
}) => {
  const myId = useAuthStore((s) => s.user?.id ?? '');
  const authorName = useUserStore((s) => s.name || s.handle);
  const authorAvatar = useUserStore((s) => s.avatarUrl);

  const [own, setOwn] = useState<OwnReels>({ status: 'loading' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReelCategoryId | null>(null);
  const [selectedFilterTag, setSelectedFilterTag] = useState<BodyPartTag | null>(null);
  const [title, setTitle] = useState('');
  const [cues, setCues] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressed, setCompressed] = useState<CompressedMediaResult | null>(null);
  const [publishError, setPublishError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadOwn = useCallback(async () => {
    if (!myId) {
      setOwn({ status: 'error', message: 'Sign in to post reels.' });
      return;
    }
    setOwn({ status: 'loading' });
    try {
      setOwn({ status: 'ready', reels: await fetchMemberReels(myId) });
    } catch (err) {
      console.error('[ReelUpload] Own reels failed to load', err);
      setOwn({
        status: 'error',
        message: err instanceof Error ? err.message : 'Your reels could not load.',
      });
    }
  }, [myId]);

  useEffect(() => {
    if (isOpen) void loadOwn();
  }, [isOpen, loadOwn]);

  if (!isOpen) return null;

  const used = own.status === 'ready' ? own.reels.length : 0;
  const full = own.status === 'ready' && used >= REEL_LIMIT;
  const canPick = own.status === 'ready' && !full && !isCompressing && !isPublishing;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    tactileEngine.triggerSelectionBuzz();
    if (!file.type.startsWith('video/')) {
      setFileError('Reels are videos. Choose a video clip.');
      return;
    }
    setFileError('');
    setIsCompressing(true);
    setCompressionProgress(0);
    try {
      const result = await compressVideo(file, {
        maxLongEdge: REEL_LONG_EDGE,
        requireEncode: true,
        onProgress: (p) => setCompressionProgress(p),
      });
      if ((result.durationSecs ?? 0) > REEL_MAX_SECS) {
        URL.revokeObjectURL(result.url);
        setFileError(`Reels can be up to ${REEL_MAX_SECS} seconds. Trim the clip and try again.`);
        return;
      }
      if (result.compressedSizeBytes > REEL_MAX_BYTES) {
        URL.revokeObjectURL(result.url);
        setFileError(
          `Compressed, this clip is ${result.formattedCompressed}. Reels can be up to ${formatFileSize(REEL_MAX_BYTES)}. Trim it and try again.`,
        );
        return;
      }
      if (compressed) URL.revokeObjectURL(compressed.url);
      setCompressed(result);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    } catch (err) {
      console.error('[ReelUpload] Compression error', err);
      setFileError(
        err instanceof VideoCompressionError
          ? err.message
          : 'This video could not be prepared. Choose a different one.',
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDelete = async (reel: ExploreReelItem) => {
    if (deletingId) return;
    tactileEngine.triggerSelectionBuzz();
    setDeletingId(reel.id);
    const ok = await deleteOwnReel(reel);
    setDeletingId(null);
    if (!ok) {
      setPublishError('That reel could not be deleted. Check your connection and try again.');
      return;
    }
    setOwn((prev) =>
      prev.status === 'ready'
        ? { status: 'ready', reels: prev.reels.filter((r) => r.id !== reel.id) }
        : prev,
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compressed || !title.trim() || !selectedCategory || !rulesAccepted || isPublishing) return;
    if (full) return;
    setIsPublishing(true);
    setPublishError('');
    try {
      const result = await publishReel({
        title,
        cues,
        selectedCategory,
        selectedFilterTag,
        compressed,
        authorName,
        authorAvatar,
      });
      if (!result.ok) {
        if (result.reason === 'limit') void loadOwn();
        setPublishError(
          result.reason === 'signed-out'
            ? 'Sign in to post reels.'
            : result.reason === 'upload'
              ? 'Upload failed. Check your connection and try again.'
              : result.reason === 'limit'
                ? `You already have ${REEL_LIMIT} reels. Delete one to post another.`
                : `The reel uploaded but could not be posted. ${result.detail ?? ''}`.trim(),
        );
        return;
      }
      tactileEngine.playPRCelebration();
      URL.revokeObjectURL(compressed.url);
      onReelPublished?.(title.trim());
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      id="reel-upload-modal"
      className="fixed inset-0 z-[60] bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post a reel"
        className="o1-sheet-card relative w-full max-h-[100dvh] bg-o1-sheet border border-white/[0.07] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-black/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-crimson/20 border border-o1-crimson/40 flex items-center justify-center text-o1-crimson">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-o1-body font-semibold text-o1-text">
                <span>Post a reel</span>
                <ShieldCheck className="w-3.5 h-3.5 text-o1-crimson" />
              </div>
              <p className="text-o1-label text-o1-muted">
                {own.status === 'ready'
                  ? reelSlotsLine(used)
                  : `Up to ${REEL_LIMIT} reels per member`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-muted hover:text-o1-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-5 space-y-4">
          {own.status === 'loading' ? (
            <div className="flex items-center gap-2 text-o1-caption text-o1-muted" role="status">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your reels…
            </div>
          ) : own.status === 'error' ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-o1-surface px-3 py-2"
            >
              <p className="text-o1-caption text-o1-text">{own.message}</p>
              {myId ? (
                <button
                  type="button"
                  onClick={() => void loadOwn()}
                  className="min-h-[44px] shrink-0 rounded-full border border-white/[0.07] px-4 text-o1-caption font-semibold text-o1-text"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : own.reels.length > 0 ? (
            <div className="space-y-2">
              <p className="text-o1-caption text-o1-text">Your reels</p>
              <ul className="space-y-1.5">
                {own.reels.map((reel) => (
                  <li
                    key={reel.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-o1-surface p-2"
                  >
                    {reel.thumbnail ? (
                      <img
                        src={reel.thumbnail}
                        alt=""
                        className="h-12 w-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-o1-well text-o1-muted">
                        <Film className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-o1-caption text-o1-text">
                      {reel.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(reel)}
                      disabled={deletingId !== null}
                      aria-label={`Delete ${reel.title}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-o1-muted hover:text-o1-crimson disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === reel.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {full ? (
            <p
              role="status"
              className="rounded-xl border border-o1-amber-deep/30 bg-o1-amber-deep/10 px-3 py-2 text-o1-caption text-o1-amber"
            >
              You have {REEL_LIMIT} reels. Delete one to post another.
            </p>
          ) : (
            <>
              <ReelUploadMediaZone
                previewUrl={compressed?.url ?? ''}
                compressedResult={compressed}
                isCompressing={isCompressing}
                compressionProgress={compressionProgress}
                onSelectFile={() => {
                  if (canPick) fileInputRef.current?.click();
                }}
                fileInputRef={fileInputRef}
                onFileChange={handleFileSelect}
              />
              {fileError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-o1-amber-deep/30 bg-o1-amber-deep/10 px-3 py-2 text-o1-caption text-o1-amber"
                >
                  {fileError}
                </p>
              ) : null}
              <ReelCategorySelector
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedFilterTag={selectedFilterTag}
                onSelectFilterTag={setSelectedFilterTag}
              />
              <ReelFormFields title={title} setTitle={setTitle} cues={cues} setCues={setCues} />
              <label className="flex items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-o1-well p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-o1-crimson cursor-pointer"
                />
                <span className="space-y-1">
                  <span className="block text-o1-caption text-o1-text">
                    I filmed this clip or have permission to share it.
                  </span>
                  <span className="block text-o1-label leading-snug text-o1-muted">
                    No copyrighted music or footage, nudity, hate, harassment, or unsafe advice.
                    Members can report reels, and the Oblivion 1 team removes reels and accounts
                    that break these rules.
                  </span>
                </span>
              </label>
            </>
          )}
          {publishError ? (
            <p
              role="alert"
              className="rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-2 text-o1-caption text-o1-text"
            >
              {publishError}
            </p>
          ) : null}
          {full ? null : (
            <div className="pt-1">
              <button
                type="submit"
                disabled={
                  !compressed ||
                  !title.trim() ||
                  !selectedCategory ||
                  !rulesAccepted ||
                  isCompressing ||
                  isPublishing ||
                  own.status !== 'ready'
                }
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isPublishing ? 'Uploading…' : 'Post reel'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
