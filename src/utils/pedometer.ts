// Browser-based pedometer using DeviceMotion accelerometer.
// Uses a peak-detection algorithm on acceleration magnitude to count steps.
// Designed for mobile browsers; will be replaced by native HealthKit / Health Connect
// when the app ships as a Capacitor native build.

export interface PedometerState {
  isTracking: boolean;
  stepCount: number;
  isSupported: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  distanceKm: number;
  caloriesBurned: number;
  elapsedSecs: number;
}

type PedometerListener = (state: PedometerState) => void;

const STEP_THRESHOLD = 1.35;
const STEP_COOLDOWN_MS = 280;
const STRIDE_LENGTH_M = 0.762;
const CAL_PER_STEP = 0.04;
const SAVE_KEY = 'o1fc_pedometer_session';

interface SavedSession {
  date: string;
  stepCount: number;
  elapsedSecs: number;
  startTime: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadSession(): SavedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s: SavedSession = JSON.parse(raw);
    if (s.date !== todayStr()) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

function saveSession(s: SavedSession) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {}
}

class Pedometer {
  private listeners = new Set<PedometerListener>();
  private state: PedometerState = {
    isTracking: false,
    stepCount: 0,
    isSupported: false,
    permissionState: 'unknown',
    distanceKm: 0,
    caloriesBurned: 0,
    elapsedSecs: 0,
  };

  private lastStepTime = 0;
  private prevMag = 0;
  private prevPrevMag = 0;
  private startTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private boundHandler: ((e: DeviceMotionEvent) => void) | null = null;

  constructor() {
    this.state.isSupported = typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined' && 'addEventListener' in window;

    if (this.state.isSupported && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      this.state.permissionState = 'prompt';
    } else if (this.state.isSupported) {
      this.state.permissionState = 'granted';
    }

    const saved = loadSession();
    if (saved) {
      this.state.stepCount = Math.max(0, Number(saved.stepCount) || 0);
      this.state.elapsedSecs = Math.max(0, Number(saved.elapsedSecs) || 0);
      this.state.distanceKm = (this.state.stepCount * STRIDE_LENGTH_M) / 1000;
      this.state.caloriesBurned = this.state.stepCount * CAL_PER_STEP;
      this.startTime = saved.startTime || Date.now();
    }
  }

  getState(): PedometerState {
    return { ...this.state };
  }

  subscribe(listener: PedometerListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => { this.listeners.delete(listener); };
  }

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach(fn => fn(snapshot));
  }

  async requestPermission(): Promise<boolean> {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission();
        this.state.permissionState = result === 'granted' ? 'granted' : 'denied';
        this.emit();
        return result === 'granted';
      } catch {
        this.state.permissionState = 'denied';
        this.emit();
        return false;
      }
    }
    this.state.permissionState = 'granted';
    this.emit();
    return true;
  }

  async start(): Promise<boolean> {
    if (this.state.isTracking) return true;
    if (!this.state.isSupported) return false;

    if (this.state.permissionState !== 'granted') {
      const ok = await this.requestPermission();
      if (!ok) return false;
    }

    const saved = loadSession();
    if (saved) {
      this.state.stepCount = saved.stepCount;
      this.state.elapsedSecs = saved.elapsedSecs;
      this.startTime = Date.now() - (saved.elapsedSecs * 1000);
    } else {
      this.startTime = Date.now();
    }

    this.lastStepTime = 0;
    this.prevMag = 0;
    this.prevPrevMag = 0;
    this.state.isTracking = true;

    this.boundHandler = (e: DeviceMotionEvent) => this.handleMotion(e);
    window.addEventListener('devicemotion', this.boundHandler, { passive: true });

    this.timerInterval = setInterval(() => {
      this.state.elapsedSecs = Math.floor((Date.now() - this.startTime) / 1000);
      this.emit();
    }, 1000);

    this.saveInterval = setInterval(() => {
      saveSession({
        date: todayStr(),
        stepCount: this.state.stepCount,
        elapsedSecs: this.state.elapsedSecs,
        startTime: this.startTime,
      });
    }, 5000);

    this.emit();
    return true;
  }

  stop() {
    if (!this.state.isTracking) return;
    this.state.isTracking = false;

    if (this.boundHandler) {
      window.removeEventListener('devicemotion', this.boundHandler);
      this.boundHandler = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    saveSession({
      date: todayStr(),
      stepCount: this.state.stepCount,
      elapsedSecs: this.state.elapsedSecs,
      startTime: this.startTime,
    });

    this.emit();
  }

  resetToday() {
    this.stop();
    this.state.stepCount = 0;
    this.state.distanceKm = 0;
    this.state.caloriesBurned = 0;
    this.state.elapsedSecs = 0;
    this.startTime = 0;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {}
    }
    this.emit();
  }

  setSteps(count: number, customCalories?: number, customDistKm?: number) {
    this.state.stepCount = Math.max(0, count);
    this.state.distanceKm = customDistKm !== undefined ? customDistKm : parseFloat(((this.state.stepCount * STRIDE_LENGTH_M) / 1000).toFixed(2));
    this.state.caloriesBurned = customCalories !== undefined ? customCalories : Math.round(this.state.stepCount * CAL_PER_STEP);
    saveSession({
      date: todayStr(),
      stepCount: this.state.stepCount,
      elapsedSecs: this.state.elapsedSecs,
      startTime: this.startTime || Date.now(),
    });
    this.emit();
  }

  private handleMotion(event: DeviceMotionEvent) {
    const accel = event.accelerationIncludingGravity;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) return;
    if (typeof accel.x !== 'number' || typeof accel.y !== 'number' || typeof accel.z !== 'number') return;

    // Verification log for accelerometer telemetry
    if (Math.random() < 0.05) {
      console.log('[Pedometer:Motion]', { x: accel.x.toFixed(2), y: accel.y.toFixed(2), z: accel.z.toFixed(2) });
    }

    const sumSq = accel.x ** 2 + accel.y ** 2 + accel.z ** 2;
    if (isNaN(sumSq) || !isFinite(sumSq)) return;

    const mag = Math.sqrt(sumSq) / 9.81;
    if (isNaN(mag) || !isFinite(mag)) return;
    const now = Date.now();

    // Peak detection: prev was a local maximum above threshold
    if (
      this.prevMag > STEP_THRESHOLD &&
      this.prevMag > this.prevPrevMag &&
      this.prevMag > mag &&
      (now - this.lastStepTime) > STEP_COOLDOWN_MS
    ) {
      this.state.stepCount = Math.max(0, this.state.stepCount + 1);
      this.state.distanceKm = (this.state.stepCount * STRIDE_LENGTH_M) / 1000;
      this.state.caloriesBurned = this.state.stepCount * CAL_PER_STEP;
      this.lastStepTime = now;
      console.log('[Pedometer:StepDetected]', { stepCount: this.state.stepCount, calories: this.state.caloriesBurned });
    }

    this.prevPrevMag = this.prevMag;
    this.prevMag = mag;
  }
}

export const pedometer = new Pedometer();
