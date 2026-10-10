import React from 'react';
import { X, Play } from 'lucide-react';
import { FilmstripClip } from '../reelTypes';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelAssetGalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clips: FilmstripClip[];
  activeClip: FilmstripClip | null;
  onSelectClip: (clip: FilmstripClip) => void;
}

export const ReelAssetGalleryDrawer: React.FC<ReelAssetGalleryDrawerProps> = ({
  isOpen,
  onClose,
  clips,
  activeClip,
  onSelectClip,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close clips"
        className="absolute inset-0 z-40 cursor-default bg-black/40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-label="Clips in this reel"
        className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[#1F1F1F] bg-[#0E0E0E] p-4 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#EAE8DF]">Clips in this reel</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#8A887F]">{clips.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-[#8A887F] hover:text-white"
            aria-label="Close clips"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid max-h-[48vh] grid-cols-2 gap-2 overflow-y-auto pt-3">
          {clips.map((clip) => {
            const isCurrent = activeClip?.id === clip.id;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSelectClip(clip);
                  onClose();
                }}
                aria-pressed={isCurrent}
                className={`flex min-h-[52px] items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                  isCurrent ? 'border-white bg-white text-neutral-950' : 'border-[#1F1F1F] bg-black text-[#EAE8DF] hover:border-white/20'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCurrent ? 'bg-neutral-950 text-white' : 'bg-[#1F1F1F] text-white'}`}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{clip.title}</span>
                  {clip.duration ? <span className={`text-[11px] ${isCurrent ? 'text-neutral-600' : 'text-[#8A887F]'}`}>{clip.duration}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
