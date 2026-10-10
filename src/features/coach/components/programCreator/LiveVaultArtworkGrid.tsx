import React, { useRef } from 'react';
import { Upload, Plus, Check, FolderOpen } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useLiveCoachVault } from './useLiveCoachVault';

interface Props {
  coverImage: string;
  onSelectImage: (url: string) => void;
}

export const LiveVaultArtworkGrid: React.FC<Props> = ({ coverImage, onSelectImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { vaultItems, loading, addVaultItem } = useLiveCoachVault();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    tactileEngine.triggerImpactPulse();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Program Artwork';
      await addVaultItem(dataUrl, title);
      onSelectImage(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return <div className="p-4 text-center text-xs text-neutral-400 font-mono">Syncing Media Vault...</div>;
  }

  if (vaultItems.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-o1-well border border-dashed border-white/[0.07] text-center space-y-2.5">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <FolderOpen className="w-6 h-6 text-neutral-400 mx-auto" />
        <div className="text-xs text-neutral-300 font-medium">
          No media in vault. Upload program artwork or select from Presets.
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-tactical font-bold tracking-wider flex items-center gap-1.5 mx-auto cursor-pointer transition-all shadow-md"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>+ Upload Artwork</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      <div className="text-[10px] font-mono text-neutral-400 tracking-wider px-0.5">
        Coach Media Vault ({vaultItems.length})
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
        {/* First slot: [ + Upload ] tile */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video rounded-xl border border-dashed border-o1-crimson/60 bg-o1-crimson/10 hover:bg-o1-crimson/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-o1-crimson flex items-center justify-center shadow-xs">
            <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
          <span className="text-[9px] font-tactical font-bold text-neutral-200 tracking-wider">+ Upload</span>
        </button>

        {/* Coach's uploaded vault images */}
        {vaultItems.map((item) => {
          const isSelected = coverImage === item.url;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectImage(item.url);
              }}
              className={`relative aspect-video rounded-xl overflow-hidden border border-white/[0.07] transition-all cursor-pointer group ${
                isSelected ? 'opacity-100 shadow-md' : 'opacity-85 hover:opacity-100'
              }`}
            >
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5 text-[8.5px] text-white truncate font-medium">
                {item.title}
              </div>
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-o1-crimson flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LiveVaultArtworkGrid;
