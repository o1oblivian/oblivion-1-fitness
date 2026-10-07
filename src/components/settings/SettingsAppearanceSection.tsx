import React, { useState } from 'react';
import { Images, ChevronRight } from 'lucide-react';
import { InputStyleType } from '../../hooks/useAthleteSettings';
import { tactileEngine } from '../../services/tactileEngine';
import { useWallpaperStore } from '../../stores/useWallpaperStore';
import { wallpaperTopicLabel } from '../../services/liveWallpaperService';
import { WallpaperSelectorModal } from './WallpaperSelectorModal';

interface AppearanceSectionProps {
  inputStyle: InputStyleType;
  onSetInputStyle: (style: InputStyleType) => void;
  onShowToast?: (msg: string) => void;
}

export const SettingsAppearanceSection: React.FC<AppearanceSectionProps> = ({
  inputStyle,
  onSetInputStyle,
  onShowToast,
}) => {
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const { isEnabled, isPaused, intervalSeconds, topic, pool } = useWallpaperStore();

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold uppercase px-1">
        Controls
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] p-3 space-y-2.5 text-white">
        {/* Input Style Segmented Control */}
        <div>
          <div className="mb-2">
            <span className="text-xs font-tactical font-semibold text-neutral-100 block">
              Input Style
            </span>
            <span className="text-[11px] font-sans text-neutral-400 block">
              Workout entry dial or keypad
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.03]">
            {(['Rotary Dial', 'Keypad'] as InputStyleType[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSetInputStyle(style);
                }}
                className={`py-1.5 min-h-[44px] rounded-xl text-xs font-tactical transition-all cursor-pointer ${
                  inputStyle === style
                    ? 'bg-o1-crimson text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper Row */}
        <div className="pt-2.5 border-t border-white/[0.05]">
          <div className="flex items-center justify-between gap-3 min-h-[44px]">
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-neutral-100 block">
                Workout wallpaper
              </span>
              <span className="text-[11px] font-sans text-neutral-400 block truncate">
                {isEnabled
                  ? `${wallpaperTopicLabel(topic)} · ${isPaused ? 'Paused' : `${intervalSeconds}s`} · ${pool.length || 'live'} frames`
                  : 'Off — battery saver'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowWallpaperModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-o1-crimson text-neutral-200 hover:text-white border border-white/[0.07] text-xs font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Change</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      <WallpaperSelectorModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
export default SettingsAppearanceSection;
