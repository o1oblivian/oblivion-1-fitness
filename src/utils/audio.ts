// Web Audio API — Soft warm bell for rest-timer completion, mechanical clicks, and audio feedback
import { getFeedbackPreferences } from './feedbackPreferences';

let audioCtx: AudioContext | null = null;
let isUnlocked = false;

function unlockAudioContext() {
  if (isUnlocked || !audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      isUnlocked = true;
    }).catch(() => {});
  } else if (audioCtx.state === 'running') {
    isUnlocked = true;
  }
}

// Automatically warm up AudioContext on the first touch, click, or keypress
if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    getAudioContext();
    unlockAudioContext();
    window.removeEventListener('pointerdown', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };
  window.addEventListener('pointerdown', handleFirstInteraction, { passive: true, once: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true, once: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const prefs = getFeedbackPreferences();
  if (!prefs.audioEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
      } catch {
        audioCtx = new AudioContextClass();
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Subtle, muted high-frequency mechanical clicks (like Apple Watch digital crown)
 * during rotary dial adjustments, fine stepping, and discrete snaps.
 */
export function playDigitalCrownClick(pitchMultiplier: number = 1.0) {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled || !prefs.dialTicks) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // High frequency mechanical transient click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    // 2400Hz - 3200Hz mechanical sweet spot
    const baseFreq = 2650 * Math.max(0.6, Math.min(1.8, pitchMultiplier));
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.012);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(4.0, now);

    // Extremely short, crisp burst (10ms)
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.012);
  } catch {
    // ignore audio errors silently
  }
}

/**
 * Inspiring personal record breakthrough chime
 */
export function playPRBreakthroughChime() {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled || !prefs.prChime) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // A5 (880Hz) -> D6 (1174.66Hz) -> A6 (1760Hz) ascending triumph chime
    const notes = [880, 1174.66, 1760];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  } catch {
    // ignore
  }
}

export function playRealBellSound() {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled || !prefs.restTimerAlarm) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primary tone — C5 (523.25 Hz), sine, gentle attack, 2.5s decay
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(1800, now);
    filter1.Q.setValueAtTime(0.7, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 2.5);

    // Soft harmonic — C6 (1046.5 Hz), delayed, quieter, shorter
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.25);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1400, now);
    filter2.Q.setValueAtTime(0.5, now);
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.14, now + 0.28);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 2.0);
  } catch (e) {
    console.warn('Could not play bell sound:', e);
  }
}

export function playSoftTickSound(pitchMultiplier: number = 1) {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled || !prefs.dialTicks) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * Math.max(0.2, pitchMultiplier), now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // ignore
  }
}

export function playSweetConfirmChime() {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  } catch {
    // ignore
  }
}

export function speakNumberVoice(val: string | number) {
  try {
    const prefs = getFeedbackPreferences();
    if (!prefs.audioEnabled || !prefs.speechVoice) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(val));
    utterance.rate = 1.2;
    utterance.pitch = 1.0;
    utterance.volume = 0.6;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

