import React from 'react';

export const REEL_CATEGORIES = [
  { id: 'HYPERTROPHY', label: 'Hypertrophy', desc: 'Muscle Growth & Tension' },
  { id: 'BIOMECHANICS', label: 'Biomechanics', desc: 'Form Cues & Levers' },
  { id: 'STRENGTH', label: 'Strength', desc: 'Force & Power Protocols' },
  { id: 'MOBILITY', label: 'Mobility', desc: 'Kinetic Flow & Joint Decompression' },
  { id: 'HYROX', label: 'Hyrox', desc: 'Conditioning & Race Engine' },
  { id: 'REHAB', label: 'Rehab', desc: 'Clinical Pre-hab & Orthopedics' },
] as const;

export const SUB_FILTER_TAGS = [
  'CHEST & TRICEPS',
  'BACK & BICEPS',
  'QUADS & GLUTES',
  'SHOULDERS & ARMS',
  'MOBILITY & REHAB',
  'HYROX / CONDITIONING',
] as const;

interface ReelCategorySelectorProps {
  selectedCategory: (typeof REEL_CATEGORIES)[number]['id'];
  onSelectCategory: (id: (typeof REEL_CATEGORIES)[number]['id']) => void;
  selectedFilterTag: (typeof SUB_FILTER_TAGS)[number];
  onSelectFilterTag: (tag: (typeof SUB_FILTER_TAGS)[number]) => void;
}

export const ReelCategorySelector: React.FC<ReelCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedFilterTag,
  onSelectFilterTag,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono tracking-wider text-neutral-300 uppercase block">
          2. Train Ring Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REEL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-o1-crimson/10 border-o1-crimson text-white shadow-xs'
                    : 'bg-o1-well border-white/[0.07] text-neutral-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold">{cat.label}</span>
                <span className="text-[9px] text-neutral-500 font-mono mt-0.5">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold font-mono tracking-wider text-neutral-300 uppercase block">
          3. Sub-Discipline Tag
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUB_FILTER_TAGS.map((tag) => {
            const isSelected = selectedFilterTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectFilterTag(tag)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'bg-o1-crimson text-white shadow-xs'
                    : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
