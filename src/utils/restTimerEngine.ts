/**
 * Oblivion 1 Fitness Club (O1FC) - Rest Timer Engine
 * 
 * Provides bulletproof background rest timer counting that survives:
 * 1. Screen lock & pocketing (via Web Worker ticker + WakeLock API)
 * 2. Background tab throttling (Web Workers are not clamped to 1Hz like window.setInterval)
 * 3. Lock-screen notifications with acoustic bell & vibration when rest completes
 */

import { playRealBellSound } from './audio';
import { triggerHaptic } from './haptics';
import { sendInstantNotification } from './notificationPreferences';

export interface RestTimerState {
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  endTime: number;
}

type TimerListener = (state: RestTimerState) => void;

class RestTimerEngine {
  private listeners: Set<TimerListener> = new Set();
  private worker: Worker | null = null;
  private wakeLockSentinel: any = null;
  private totalSeconds: number = 0;
  private remainingSeconds: number = 0;
  private endTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private pausedRemaining: number = 0;
  private completionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initWorker();
    this.setupVisibilityRecovery();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;
    try {
      // Inline worker code that sends a tick message every 200ms
      const workerCode = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(function() {
              self.postMessage('tick');
            }, 200);
          } else if (e.data === 'stop') {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);

      this.worker.onmessage = (e) => {
        if (e.data === 'tick') {
          this.handleTick();
        }
      };
    } catch {
      // Web Workers blocked or unavailable - fallback to window timer
      this.worker = null;
    }
  }

  private setupVisibilityRecovery() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isRunning && !this.isPaused) {
        this.handleTick();
        this.requestWakeLock();
      }
    });
  }

  private async requestWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch {
      // Wake Lock might be refused if low battery or permission denied
      this.wakeLockSentinel = null;
    }
  }

  private releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch {
      this.wakeLockSentinel = null;
    }
  }

  public subscribe(listener: TimerListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error('Error in RestTimer listener:', err);
      }
    });
  }

  public getState(): RestTimerState {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      endTime: this.endTime,
    };
  }

  public start(seconds: number) {
    if (seconds <= 0) return;
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.endTime = Date.now() + seconds * 1000;
    this.isRunning = true;
    this.isPaused = false;

    this.requestWakeLock();

    // Start worker
    if (this.worker) {
      this.worker.postMessage('start');
    }

    // Schedule guaranteed completion timeout
    if (this.completionTimeoutId) clearTimeout(this.completionTimeoutId);
    this.completionTimeoutId = setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.complete();
      }
    }, seconds * 1000 + 50);

    this.notify();
  }

  public pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.pausedRemaining = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
    this.remainingSeconds = this.pausedRemaining;

    if (this.worker) this.worker.postMessage('stop');
    if (this.completionTimeoutId) clearTimeout(this.completionTimeoutId);
    this.releaseWakeLock();
    this.notify();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.endTime = Date.now() + this.pausedRemaining * 1000;

    this.requestWakeLock();
    if (this.worker) this.worker.postMessage('start');

    if (this.completionTimeoutId) clearTimeout(this.completionTimeoutId);
    this.completionTimeoutId = setTimeout(() => {
      if (this.isRunning && !this.isPaused) {
        this.complete();
      }
    }, this.pausedRemaining * 1000 + 50);

    this.notify();
  }

  public addTime(extraSecs: number) {
    if (!this.isRunning) return;
    if (this.isPaused) {
      this.pausedRemaining += extraSecs;
      this.remainingSeconds = this.pausedRemaining;
    } else {
      this.endTime += extraSecs * 1000;
      this.remainingSeconds = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
      if (this.completionTimeoutId) clearTimeout(this.completionTimeoutId);
      this.completionTimeoutId = setTimeout(() => {
        if (this.isRunning && !this.isPaused) {
          this.complete();
        }
      }, Math.max(0, this.endTime - Date.now()) + 50);
    }
    this.notify();
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.remainingSeconds = 0;
    this.endTime = 0;

    if (this.worker) this.worker.postMessage('stop');
    if (this.completionTimeoutId) clearTimeout(this.completionTimeoutId);
    this.releaseWakeLock();
    if (typeof document !== 'undefined') {
      document.title = 'Oblivion 1 Fitness Club | OFC Official';
    }
    this.notify();
  }

  private handleTick() {
    if (!this.isRunning || this.isPaused) return;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((this.endTime - now) / 1000));
    this.remainingSeconds = remaining;

    if (remaining <= 0) {
      this.complete();
    } else {
      if (typeof document !== 'undefined') {
        document.title = `(${remaining}s) Rest • O1FC`;
      }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && (window as any).MediaMetadata) {
        try {
          navigator.mediaSession.metadata = new (window as any).MediaMetadata({
            title: `Rest Interval (${remaining}s)`,
            artist: 'Oblivion 1 Fitness Club',
            album: 'Training OS Pro Live Activity',
          });
        } catch {}
      }
      this.notify();
    }
  }

  private complete() {
    this.stop();

    if (typeof document !== 'undefined') {
      document.title = 'Oblivion 1 Fitness Club | OFC Official';
    }

    // 1. Acoustic bell cue
    playRealBellSound();

    // 2. Tactile haptic pulse
    triggerHaptic('double');

    // 3. Lock-screen & OS Notification
    sendInstantNotification({
      title: 'Rest Time Complete',
      body: 'Rest interval finished. Next set ready!',
      channel: 'coachUpdates',
    });

    // 4. Dispatch global event for in-app toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ofc_rest_timer_completed', {
          detail: { message: 'Rest time over! Next set ready.' },
        })
      );
    }
  }
}

export const restTimerEngine = new RestTimerEngine();
