import React from 'react';
import { Check, Sparkles, Folder } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { PresetsArtworkGrid } from './PresetsArtworkGrid';
import { LiveVaultArtworkGrid } from './LiveVaultArtworkGrid';

interface Props {
  coverImage: string;
  coverSource: 'vault' | 'presets' | 'upload' | 'url';
  category: string;
  onUpdate: (updates: { coverImage?: string; coverSource?: 'vault' | 'presets' | 'upload' | 'url' }) => void;
}

export const ProgramCoverArtworkPicker: React.FC<Props> = ({
  coverImage,
  coverSource,
  category,
  onUpdate,
}) => {
  const activeTab: 'presets' | 'vault' = coverSource === 'vault' ? 'vault' : 'presets';

  const handleImageSelected = (url: string) => {
    onUpdate({ coverImage: url });
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#121214] border border-neutral-800 space-y-3 select-none">
      {/* Banner Preview */}
      <div className="relative h-32 rounded-xl overflow-hidden bg-black/60 border border-neutral-800">
        <img src={coverImage} alt="Program Artwork" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-black/60 text-[9px] font-mono font-bold uppercase text-neutral-300 border border-white/10">
              PROGRAM ARTWORK
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" />Active
            </span>
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{category} · Official Cover</span>
        </div>
      </div>

      {/* Streamlined 2 Tabs: [ PRESETS / STOCK ] and [ VAULT ] */}
      <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-[10.5px] font-tactical font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onUpdate({ coverSource: 'presets' });
          }}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-[#C4121A] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRESETS / STOCK</span>
        </button>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onUpdate({ coverSource: 'vault' });
          }}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-[#C4121A] text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>VAULT</span>
        </button>
      </div>

      {/* 2 Tab Views */}
      {activeTab === 'presets' ? (
        <PresetsArtworkGrid coverImage={coverImage} onSelectImage={handleImageSelected} />
      ) : (
        <LiveVaultArtworkGrid coverImage={coverImage} onSelectImage={handleImageSelected} />
      )}
    </div>
  );
};

export default ProgramCoverArtworkPicker;
