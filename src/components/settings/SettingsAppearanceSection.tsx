import React, { useState } from 'react';
import { Images, ChevronRight } from 'lucide-react';
import { InputStyleType } from '../../hooks/useAthleteSettings';
import { tactileEngine } from '../../services/tactileEngine';
import { useWallpaperStore } from '../../stores/useWallpaperStore';
import { wallpaperTopicLabel } from '../../services/liveWallpaperService';
import { WallpaperSelectorModal } from './WallpaperSelectorModal';
import { DetailPref, TextSize, TextSizePref, useDetail, useDisplayPrefs, useTextSize } from '../../stores/useDisplayPrefs';

const TEXT_SIZE_LABEL: Record<TextSize, string> = { standard: 'Standard', large: 'Large', xlarge: 'Extra large' };
const TEXT_SIZE_OPTIONS: { value: TextSizePref; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'standard', label: 'Aa' },
  { value: 'large', label: 'Aa+' },
  { value: 'xlarge', label: 'Aa++' },
];
const DETAIL_OPTIONS: { value: DetailPref; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'simple', label: 'Simple' },
  { value: 'pro', label: 'Pro' },
];

function Segmented<T extends string>({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <span className="text-xs font-tactical font-semibold text-neutral-100 block">{title}</span>
        <span className="text-[11px] font-sans text-neutral-400 block">{subtitle}</span>
      </div>
      <div
        role="radiogroup"
        aria-label={title}
        className="grid gap-1.5 p-1 rounded-xl bg-white/[0.03]"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onChange(option.value);
            }}
            className={`py-1.5 min-h-[44px] rounded-xl text-xs font-tactical transition-all cursor-pointer ${
              value === option.value ? 'bg-o1-crimson text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  const textSizePref = useDisplayPrefs((s) => s.textSize);
  const detailPref = useDisplayPrefs((s) => s.detail);
  const setTextSize = useDisplayPrefs((s) => s.setTextSize);
  const setDetail = useDisplayPrefs((s) => s.setDetail);
  const textSize = useTextSize();
  const detail = useDetail();

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Display &amp; controls
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] p-3 space-y-2.5 text-white">
        <Segmented
          title="Text size"
          subtitle={textSizePref === 'auto' ? `Auto · ${TEXT_SIZE_LABEL[textSize]} for your age` : 'Applies across the whole app'}
          options={TEXT_SIZE_OPTIONS}
          value={textSizePref}
          onChange={setTextSize}
        />

        <div className="pt-2.5 border-t border-white/[0.05]">
          <Segmented
            title="Detail"
            subtitle={
              detail === 'simple'
                ? `${detailPref === 'auto' ? 'Auto · ' : ''}Simple: plain words and fewer numbers`
                : `${detailPref === 'auto' ? 'Auto · ' : ''}Pro: every number, including RPE and training load`
            }
            options={DETAIL_OPTIONS}
            value={detailPref}
            onChange={setDetail}
          />
        </div>

        {/* Input Style Segmented Control */}
        <div className="pt-2.5 border-t border-white/[0.05]">
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
              className="o1-pill bg-o1-well hover:bg-o1-crimson text-neutral-200 hover:text-white border border-white/[0.07] text-xs font-sans font-semibold cursor-pointer active:scale-95"
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
