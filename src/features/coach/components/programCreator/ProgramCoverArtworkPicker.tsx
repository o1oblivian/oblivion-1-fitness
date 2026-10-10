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
    <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-3 select-none">
      {/* Banner Preview */}
      <div className="relative h-32 rounded-xl overflow-hidden bg-black/60 border border-white/[0.07]">
        <img src={coverImage} alt="Program Artwork" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-black/60 text-[9px] font-mono font-bold text-neutral-300 border border-white/[0.07]">
              Program Artwork
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-2.5 h-2.5" />Active
            </span>
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{category} · Official Cover</span>
        </div>
      </div>

      {/* Streamlined 2 Tabs: [ PRESETS / STOCK ] and [ VAULT ] */}
      <div className="flex items-center gap-1.5 bg-o1-well p-1 rounded-xl border border-white/[0.07] text-[10.5px] font-tactical font-bold tracking-wider">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onUpdate({ coverSource: 'presets' });
          }}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-o1-crimson text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets / Stock</span>
        </button>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onUpdate({ coverSource: 'vault' });
          }}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-o1-crimson text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Vault</span>
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
