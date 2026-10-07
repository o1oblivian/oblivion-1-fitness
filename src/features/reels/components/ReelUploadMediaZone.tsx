import React from 'react';
import { Upload, Zap, ArrowDownRight } from 'lucide-react';
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
      <label className="text-[11px] font-bold font-mono tracking-wider text-neutral-300 uppercase flex items-center justify-between">
        <span>1. Reel Video File</span>
        <span className="text-[10px] text-o1-crimson font-semibold">Automatic MB → KB Compression</span>
      </label>

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
            <p className="text-[10px] text-neutral-400 mt-0.5">
              MP4, MOV, or WebM • Compresses down to ~1-3 MB automatically
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.07] aspect-video flex items-center justify-center">
            {compressedResult?.type === 'video' ? (
              <video src={previewUrl} controls playsInline className="w-full h-full object-contain max-h-52" />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-52" />
            )}
            <button
              type="button"
              onClick={onSelectFile}
              className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/[0.07] text-[10px] font-bold text-white hover:bg-black transition-colors cursor-pointer"
            >
              Change Video
            </button>
          </div>

          {compressedResult && (
            <div className="p-2.5 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap className="w-3 h-3" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-200">
                    <span className="line-through text-neutral-500">{compressedResult.formattedOriginal}</span>
                    <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{compressedResult.formattedCompressed}</span>
                  </div>
                  <p className="text-[9px] text-neutral-400 font-mono">Mobile optimized stream ready</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                -{compressedResult.savingsPercent}%
              </span>
            </div>
          )}
        </div>
      )}

      {isCompressing && (
        <div className="p-3 rounded-xl bg-o1-well border border-white/[0.07] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Compressing Video & Extracting Poster...</span>
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
