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

    const authorName = profile?.name || (user?.name ? user.name : 'Verified Coach');
    const authorHandle = user?.handle ? (user.handle.startsWith('@') ? user.handle : `@${user.handle}`) : '@verified.coach';
    const authorAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
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
    <div id="coach-reel-upload-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[92vh] bg-[#121214] border border-neutral-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#09090b]/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C4121A]/20 border border-[#C4121A]/40 flex items-center justify-center text-[#C4121A]">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold font-tactical uppercase tracking-wider text-white">
                <span>Upload Vault Directive Reel</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#C4121A]" />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">Silent session binding • Auto-compression</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-[#18181b] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-5 space-y-4">
          <ReelUploadMediaZone previewUrl={previewUrl} compressedResult={compressedResult} isCompressing={isCompressing} compressionProgress={compressionProgress} onSelectFile={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} onFileChange={handleFileSelect} />
          <ReelCategorySelector selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} selectedFilterTag={selectedFilterTag} onSelectFilterTag={setSelectedFilterTag} />
          <ReelFormFields title={title} setTitle={setTitle} cues={cues} setCues={setCues} showOnBuddy={showOnBuddy} setShowOnBuddy={setShowOnBuddy} disabled={!previewUrl || !title.trim() || isCompressing} selectedCategory={selectedCategory} />
          <div className="pt-1">
            <button type="submit" disabled={!previewUrl || !title.trim() || isCompressing} className="w-full py-3.5 rounded-2xl bg-[#C4121A] hover:bg-[#a30f16] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold font-tactical uppercase tracking-wider shadow-lg shadow-red-950/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Reel to Train Ring ({selectedCategory})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
