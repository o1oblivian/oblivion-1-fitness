import { safeStorage } from '../utils/safeStorage';
import {
  playDialClickAudio,
  playTimerChimeAudio,
  playPRCelebrationAudio,
  playSelectionBuzzAudio,
} from './audioSynthesis';

export interface TactileEngineSettings {
  dialClicks: boolean;
  restChime: boolean;
  prChime: boolean;
}

const STORAGE_KEY = 'o1fc_tactile_settings';

const DEFAULT_SETTINGS: TactileEngineSettings = {
  dialClicks: true,
  restChime: true,
  prChime: true,
};

class TactileEngineService {
  private audioCtx: AudioContext | null = null;
  private settings: TactileEngineSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settings = safeStorage.getItem<TactileEngineSettings>(
      STORAGE_KEY,
      DEFAULT_SETTINGS
    );
  }

  public getSettings(): TactileEngineSettings {
    return { ...this.settings };
  }

  public configureSettings(newSettings: Partial<TactileEngineSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    safeStorage.setItem(STORAGE_KEY, this.settings);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public triggerDialHaptic(): void {
    if (!this.settings.dialClicks) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    playDialClickAudio(ctx);
  }

  public triggerLightTick(): void {
    this.triggerDialHaptic();
  }

  public playTimerChime(): void {
    if (!this.settings.restChime) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {}
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    playTimerChimeAudio(ctx);
  }

  public playPRCelebration(): void {
    if (!this.settings.prChime) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([50, 40, 60, 40, 100]);
      } catch {}
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    playPRCelebrationAudio(ctx);
  }

  public triggerSelectionBuzz(): void {
    if (!this.settings.dialClicks) return;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(12);
      } catch {}
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    playSelectionBuzzAudio(ctx);
  }

  public selection(): void {
    this.triggerSelectionBuzz();
  }

  public triggerImpactPulse(): void {
    this.triggerSelectionBuzz();
  }

  public impact(_type?: string): void {
    this.triggerSelectionBuzz();
  }
}

export const tactileEngine = new TactileEngineService();
export const TactileEngine = tactileEngine;
export { TactileEngineService };

export const triggerDialHaptic = (): void => tactileEngine.triggerDialHaptic();
export const playTimerChime = (): void => tactileEngine.playTimerChime();
export const playPRCelebration = (): void => tactileEngine.playPRCelebration();
export const triggerSelectionBuzz = (): void => tactileEngine.triggerSelectionBuzz();
