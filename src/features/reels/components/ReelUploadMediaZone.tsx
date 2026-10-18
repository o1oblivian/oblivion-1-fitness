import React from 'react';
import { Upload } from 'lucide-react';
import { CompressedMediaResult } from '../../../utils/mediaCompressor';

interface ReelUploadMediaZoneProps {
  previewUrl: string;
  compressedResult: CompressedMediaResult | null;
  isCompressing: boolean;
  compressionProgress: number;
  onSelectFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ReelUploadMediaZone: React.FC<ReelUploadMediaZoneProps> = ({
  previewUrl,
  compressedResult,
  isCompressing,
  compressionProgress,
  onSelectFile,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <div className="space-y-2">
      <p className="text-o1-caption text-o1-text">1. Video</p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="video/*,image/*"
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onClick={onSelectFile}
          className="w-full h-40 rounded-2xl border border-dashed border-white/[0.07] hover:border-o1-crimson bg-o1-well/50 hover:bg-o1-well transition-all flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center group"
        >
          <div className="w-11 h-11 rounded-full bg-o1-crimson/10 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white group-hover:text-o1-crimson transition-colors">
              Tap to Choose Video from Device
            </span>
            <p className="text-o1-label text-neutral-400 mt-0.5">
              MP4, MOV or WebM · up to 60 seconds · plays without sound
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.07] aspect-video flex items-center justify-center">
            {compressedResult?.type === 'video' ? (
              <video
                src={previewUrl}
                controls
                muted
                playsInline
                className="w-full h-full object-contain max-h-52"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain max-h-52"
              />
            )}
            <button
              type="button"
              onClick={onSelectFile}
              className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/[0.07] text-o1-label font-bold text-white hover:bg-black transition-colors cursor-pointer"
            >
              Change Video
            </button>
          </div>

          {compressedResult && (
            <p className="px-1 text-o1-label text-o1-muted">
              {compressedResult.formattedOriginal}
              {compressedResult.type === 'video' && (compressedResult.durationSecs ?? 0) > 0
                ? ` · ${compressedResult.durationSecs}s`
                : ''}
            </p>
          )}
        </div>
      )}

      {isCompressing && (
        <div className="p-3 rounded-xl bg-o1-well border border-white/[0.07] space-y-1.5">
          <div className="flex items-center justify-between text-o1-label font-mono text-neutral-400">
            <span>Preparing video…</span>
            <span className="text-emerald-400 font-bold">{compressionProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${compressionProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
