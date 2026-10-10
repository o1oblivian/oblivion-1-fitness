import React from 'react';
import { Check } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { O1_PRESETS } from './artworkPresets';
import { mockCoverArt } from '../../../../services/devMocks';

interface Props {
  coverImage: string;
  onSelectImage: (url: string) => void;
}

const STOCK_ASSETS = [
  ...O1_PRESETS.map((p) => ({ id: p.id, title: p.label, url: p.url })),
  ...mockCoverArt(),
];

export const PresetsArtworkGrid: React.FC<Props> = ({ coverImage, onSelectImage }) => {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono text-o1-muted tracking-wider px-0.5">
        Curated Stock Photography &amp; Presets
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
        {STOCK_ASSETS.map((p) => {
          const isSelected = coverImage === p.url;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectImage(p.url);
              }}
              className={`relative aspect-video rounded-xl overflow-hidden border border-white/[0.07] transition-all cursor-pointer group ${
                isSelected ? 'opacity-100 shadow-md' : 'opacity-85 hover:opacity-100 hover:border-white/[0.07]'
              }`}
            >
              <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-1.5 py-1 text-[9px] text-o1-text truncate font-medium">
                {p.title}
              </div>
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-o1-crimson flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 text-o1-text stroke-[3]" />
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

export default PresetsArtworkGrid;
