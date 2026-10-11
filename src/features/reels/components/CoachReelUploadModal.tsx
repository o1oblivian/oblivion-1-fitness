import React, { useState, useRef } from 'react';
import { X, Film, CheckCircle2, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { compressVideo, compressPhoto, CompressedMediaResult } from '../../../utils/mediaCompressor';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useUserStore } from '../../../stores/useUserStore';
import { ReelUploadMediaZone } from './ReelUploadMediaZone';
import { ReelCategorySelector, REEL_CATEGORIES, SUB_FILTER_TAGS } from './ReelCategorySelector';
import { ReelFormFields } from './ReelFormFields';
import { publishCoachReel } from '../services/publishCoachReelService';

export { REEL_CATEGORIES, SUB_FILTER_TAGS } from './ReelCategorySelector';

interface CoachReelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelPublished?: (reelTitle: string, category: string) => void;
}

export const CoachReelUploadModal: React.FC<CoachReelUploadModalProps> = ({ isOpen, onClose, onReelPublished }) => {
  const buddy = useBuddyProfileStore();
  const profile = useAuthStore((s) => s.profile);
  const user = useUserStore();

  const [selectedCategory, setSelectedCategory] = useState<(typeof REEL_CATEGORIES)[number]['id']>('HYPERTROPHY');
  const [selectedFilterTag, setSelectedFilterTag] = useState<(typeof SUB_FILTER_TAGS)[number]>('CHEST & TRICEPS');
  const [title, setTitle] = useState('');
  const [cues, setCues] = useState('');
  const [showOnBuddy, setShowOnBuddy] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressedResult, setCompressedResult] = useState<CompressedMediaResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [publishError, setPublishError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    tactileEngine.triggerSelectionBuzz();
    setIsCompressing(true);
    setCompressionProgress(10);
    try {
      if (file.type.startsWith('video/')) {
        const result = await compressVideo(file, { onProgress: (p) => setCompressionProgress(p) });
        setCompressedResult(result);
        setPreviewUrl(result.url);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      } else {
        const result = await compressPhoto(file, { maxDimension: 1280, quality: 0.82 });
        setCompressedResult(result);
        setPreviewUrl(result.url);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      console.error('[CoachReelUpload] Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl || !title.trim() || isPublishing) return;
    setIsPublishing(true);
    setPublishError('');
    try {
      const result = await publishCoachReel({
        title, cues, selectedCategory, selectedFilterTag, previewUrl, compressedResult,
        fallbackName: profile?.name || user?.name || 'Coach',
      });
      if (!result.ok) {
        setPublishError(
          result.reason === 'signed-out'
            ? 'Sign in to publish reels.'
            : result.reason === 'upload'
            ? 'Upload failed. Check your connection and try again.'
            : 'The reel uploaded but could not be published. Try again.',
        );
        return;
      }
      tactileEngine.playPRCelebration();
      const cover = result.reel.thumbnail;
      if (showOnBuddy && cover && !buddy.isPhotoOnBuddy(cover)) buddy.toggleVaultPhotoOnBuddy(cover);
      onReelPublished?.(title, selectedCategory);
      onClose();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div id="coach-reel-upload-modal" className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200" onClick={onClose}>
      <div className="o1-sheet-card relative w-full bg-o1-card border border-white/[0.07] overflow-hidden flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-black/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-o1-crimson/20 border border-o1-crimson/40 flex items-center justify-center text-o1-crimson">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-o1-text">
                <span>Publish a reel</span>
                <ShieldCheck className="w-3.5 h-3.5 text-o1-crimson" />
              </div>
              <p className="text-[11px] text-o1-muted">Clips are compressed before upload.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-muted hover:text-o1-text transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-5 space-y-4">
          <ReelUploadMediaZone previewUrl={previewUrl} compressedResult={compressedResult} isCompressing={isCompressing} compressionProgress={compressionProgress} onSelectFile={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} onFileChange={handleFileSelect} />
          <ReelCategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} selectedFilterTag={selectedFilterTag} onSelectFilterTag={setSelectedFilterTag} />
          <ReelFormFields title={title} setTitle={setTitle} cues={cues} setCues={setCues} showOnBuddy={showOnBuddy} setShowOnBuddy={setShowOnBuddy} disabled={!previewUrl || !title.trim() || isCompressing} selectedCategory={selectedCategory} />
          {publishError ? (
            <p role="alert" className="rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-2 text-[12px] text-o1-text">
              {publishError}
            </p>
          ) : null}
          <div className="pt-1">
            <button type="submit" disabled={!previewUrl || !title.trim() || isCompressing || isPublishing} className="w-full min-h-[44px] py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPublishing ? 'Uploading…' : 'Publish reel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
