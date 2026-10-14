import React from 'react';
import { titleCase } from '../../../utils/displayCase';
import { BODY_PART_TAGS, COACH_REEL_CATEGORIES, type BodyPartTag, type ReelCategoryId } from '../reelCategories';

interface ReelCategorySelectorProps {
  selectedCategory: ReelCategoryId | null;
  onSelectCategory: (id: ReelCategoryId) => void;
  selectedFilterTag: BodyPartTag | null;
  onSelectFilterTag: (tag: BodyPartTag | null) => void;
}

export const ReelCategorySelector: React.FC<ReelCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedFilterTag,
  onSelectFilterTag,
}) => (
  <div className="space-y-4">
    <fieldset className="space-y-2">
      <legend className="text-[12px] text-o1-text">
        2. Category <span className="text-o1-muted">· required</span>
      </legend>
      <p className="text-[11px] text-o1-muted">The reel shows only in this circle on the Workout tab.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COACH_REEL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col gap-0.5 transition-colors cursor-pointer ${
                isSelected ? 'bg-o1-crimson/10 border-o1-crimson text-white' : 'bg-o1-well border-white/[0.07] text-neutral-300 hover:text-white'
              }`}
            >
              <span className="text-[12px]">{cat.label}</span>
              <span className="text-[10px] text-neutral-500 leading-snug">{cat.desc}</span>
            </button>
          );
        })}
      </div>
    </fieldset>

    <fieldset className="space-y-2">
      <legend className="text-[12px] text-o1-text">
        3. Body part <span className="text-o1-muted">· optional</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {BODY_PART_TAGS.map((tag) => {
          const isSelected = selectedFilterTag === tag;
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectFilterTag(isSelected ? null : tag)}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition-colors cursor-pointer ${
                isSelected ? 'bg-o1-crimson text-white' : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
              }`}
            >
              {titleCase(tag)}
            </button>
          );
        })}
      </div>
    </fieldset>
  </div>
);
