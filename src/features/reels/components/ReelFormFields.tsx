import React from 'react';
import { Radio } from 'lucide-react';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';

interface ReelFormFieldsProps {
  title: string;
  setTitle: (val: string) => void;
  cues: string;
  setCues: (val: string) => void;
  showOnBuddy: boolean;
  setShowOnBuddy: (val: boolean) => void;
  disabled: boolean;
  selectedCategory: string;
}

export const ReelFormFields: React.FC<ReelFormFieldsProps> = ({
  title,
  setTitle,
  cues,
  setCues,
  showOnBuddy,
  setShowOnBuddy,
}) => {
  const buddy = useBuddyProfileStore();

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold font-mono tracking-wider text-neutral-300 uppercase">
            4. Reel Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Low-Bar Squat Scapular Depress Cue"
            className="w-full px-3.5 py-2.5 bg-[#18181b] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold font-mono tracking-wider text-neutral-300 uppercase">
            5. Biomechanical Directives / Cues
          </label>
          <textarea
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            rows={2}
            placeholder="Direct cues for athletes: elbow angle, breathing cadence, stretch pause..."
            className="w-full px-3.5 py-2 bg-[#18181b] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C4121A] resize-none"
          />
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-[#18181b] border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C4121A]/20 flex items-center justify-center text-[#C4121A]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-tactical font-bold text-white block">
              Show on Buddy Profile / Radar
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Sync to radar discovery card ({buddy.buddyPhotos.length}/6)
            </span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={showOnBuddy}
          onChange={(e) => setShowOnBuddy(e.target.checked)}
          className="accent-[#C4121A] w-4 h-4 cursor-pointer"
        />
      </div>
    </>
  );
};
