import React from 'react';
import { X, Play, Image as ImageIcon } from 'lucide-react';
import { FilmstripClip } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelAssetGalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clips: FilmstripClip[];
  photos: string[];
  activeClip: FilmstripClip | null;
  onSelectClip: (clip: FilmstripClip) => void;
}

export const ReelAssetGalleryDrawer: React.FC<ReelAssetGalleryDrawerProps> = ({
  isOpen,
  onClose,
  clips,
  photos,
  activeClip,
  onSelectClip,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 bg-[#121214]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-tactical font-black text-white uppercase tracking-wider">
            Reel Assets & Directives
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
            {clips.length} Clips • {photos.length} Photos
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="pt-3 space-y-3 max-h-[48vh] overflow-y-auto">
        {clips.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
              Movement Clips & Form Cues
            </span>
            <div className="grid grid-cols-2 gap-2">
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#C4121A]/20 border-[#C4121A] text-white'
                        : 'bg-[#18181b] border-white/10 text-neutral-300 hover:border-white/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center shrink-0 text-white">
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{clip.title}</p>
                      <span className="text-[9px] text-neutral-400 font-mono">{clip.duration}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
              Clinical & Biomechanics Photos
            </span>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black group"
                >
                  <img
                    src={photoUrl}
                    alt={`Asset ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white flex items-center gap-0.5">
                    <ImageIcon className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
