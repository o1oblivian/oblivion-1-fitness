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
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressedResult, setCompressedResult] = useState<CompressedMediaResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
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
    if (!previewUrl || !title.trim()) return;
    tactileEngine.playPRCelebration();

    const authorName = profile?.name || user?.name || 'Coach';
    const authorHandle = user?.handle ? (user.handle.startsWith('@') ? user.handle : `@${user.handle}`) : '';
    const authorAvatar = user?.avatarUrl || '';
    const authorId = profile?.id || user?.userId || 'coach_current';

    await publishCoachReel({
      title, cues, selectedCategory, selectedFilterTag, previewUrl,
      compressedResult, authorName, authorHandle, authorAvatar, authorId,
    });

    if (showOnBuddy) {
      const thumb = compressedResult?.thumbnailUrl || previewUrl;
      if (!buddy.isPhotoOnBuddy(thumb)) buddy.toggleVaultPhotoOnBuddy(thumb);
    }

    onReelPublished?.(title, selectedCategory);
    onClose();
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
              <div className="flex items-center gap-1.5 text-xs font-bold font-tactical tracking-wider text-white">
                <span>Upload Vault Directive Reel</span>
                <ShieldCheck className="w-3.5 h-3.5 text-o1-crimson" />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">Silent session binding • Auto-compression</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-5 space-y-4">
          <ReelUploadMediaZone previewUrl={previewUrl} compressedResult={compressedResult} isCompressing={isCompressing} compressionProgress={compressionProgress} onSelectFile={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} onFileChange={handleFileSelect} />
          <ReelCategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} selectedFilterTag={selectedFilterTag} onSelectFilterTag={setSelectedFilterTag} />
          <ReelFormFields title={title} setTitle={setTitle} cues={cues} setCues={setCues} showOnBuddy={showOnBuddy} setShowOnBuddy={setShowOnBuddy} disabled={!previewUrl || !title.trim() || isCompressing} selectedCategory={selectedCategory} />
          <div className="pt-1">
            <button type="submit" disabled={!previewUrl || !title.trim() || isCompressing} className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-semibold tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Reel to Train Ring ({selectedCategory})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
