import React from 'react';
interface ReelFormFieldsProps {
  title: string;
  setTitle: (val: string) => void;
  cues: string;
  setCues: (val: string) => void;
}

export const ReelFormFields: React.FC<ReelFormFieldsProps> = ({
  title,
  setTitle,
  cues,
  setCues,
}) => {
  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-o1-label font-bold font-mono tracking-wider text-neutral-300">
            4. Reel Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Low-Bar Squat Scapular Depress Cue"
            className="w-full px-3.5 py-2.5 bg-o1-well border border-white/[0.07] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson"
          />
        </div>
        <div className="space-y-1">
          <label className="text-o1-label font-bold font-mono tracking-wider text-neutral-300">
            5. Biomechanical Directives / Cues
          </label>
          <textarea
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            rows={2}
            placeholder="Reels play without sound, so write the cues here: elbow angle, breathing, tempo..."
            className="w-full px-3.5 py-2 bg-o1-well border border-white/[0.07] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-o1-crimson resize-none"
          />
        </div>
      </div>
    </>
  );
};
