import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { AppMode } from '../types';

type ModalCloseCallback = () => void;

interface ModalEntry {
  id: string;
  onClose: ModalCloseCallback;
  priority: number;
}

class BackNavigationManager {
  private modalStack: ModalEntry[] = [];
  private navHistory: AppMode[] = [];
  private currentMode: AppMode = 'home';
  private onModeChangeCallback: ((mode: AppMode) => void) | null = null;
  private onToastCallback: ((msg: string) => void) | null = null;
  private lastExitPressTime: number = 0;
  private isInitialized: boolean = false;

  public init(
    initialMode: AppMode,
    onModeChange: (mode: AppMode) => void,
    onToast?: (msg: string) => void
  ) {
    this.currentMode = initialMode;
    this.onModeChangeCallback = onModeChange;
    if (onToast) this.onToastCallback = onToast;

    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to hardware back button on Android via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        CapApp.addListener('backButton', () => {
          this.handleBack();
        });
      } catch (e) {
        console.warn('Capacitor backButton listener init fallback', e);
      }
    }

    // Also listen to browser / keyboard back (Escape key and popstate)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.handleBack();
        }
      });

      window.addEventListener('popstate', () => {
        this.handleBack();
      });
    }
  }

  public setCurrentMode(mode: AppMode) {
    this.currentMode = mode;
  }

  public recordModeChange(newMode: AppMode) {
    if (newMode === this.currentMode) return;
    // Keep max 20 history items to prevent memory bloat
    if (this.navHistory.length >= 20) {
      this.navHistory.shift();
    }
    this.navHistory.push(this.currentMode);
    this.currentMode = newMode;
  }

  public pushModal(id: string, onClose: ModalCloseCallback, priority: number = 0): () => void {
    // Remove if already exists with same id to prevent duplicates
    this.modalStack = this.modalStack.filter((entry) => entry.id !== id);
    this.modalStack.push({ id, onClose, priority });

    // Push a dummy history state so browser/webview back gesture fires popstate
    try {
      if (typeof window !== 'undefined') {
        window.history.pushState({ ofc_modal: id, ts: Date.now() }, '');
      }
    } catch {}

    // Return unregister cleanup function
    return () => {
      this.removeModal(id);
    };
  }

  public removeModal(id: string) {
    this.modalStack = this.modalStack.filter((entry) => entry.id !== id);
  }

  public hasOpenModals(): boolean {
    return this.modalStack.length > 0;
  }

  public handleBack(): boolean {
    // Priority 1: Top-most open modal/overlay
    if (this.modalStack.length > 0) {
      // Pop the highest priority / newest modal
      const topModal = this.modalStack.pop();
      if (topModal) {
        try {
          topModal.onClose();
        } catch (err) {
          console.warn('Error closing modal on back:', err);
        }
        return true;
      }
    }

    // Priority 2: In-app Navigation History (Return to previous page/view)
    if (this.navHistory.length > 0) {
      const prevMode = this.navHistory.pop();
      if (prevMode && prevMode !== this.currentMode) {
        this.currentMode = prevMode;
        if (this.onModeChangeCallback) {
          this.onModeChangeCallback(prevMode);
        }
        return true;
      }
    }

    // Priority 3: If not on default tracker/home tab and history empty, return to main Workout tracker
    if (this.currentMode !== 'tracker' && this.currentMode !== 'home') {
      const defaultMode: AppMode = 'tracker';
      this.currentMode = defaultMode;
      if (this.onModeChangeCallback) {
        this.onModeChangeCallback(defaultMode);
      }
      return true;
    }

    // Priority 4: We are on main screen with zero open modals -> Double back to exit
    const now = Date.now();
    if (now - this.lastExitPressTime < 2000) {
      if (Capacitor.isNativePlatform()) {
        try {
          CapApp.exitApp();
        } catch {}
      }
      return false;
    } else {
      this.lastExitPressTime = now;
      if (this.onToastCallback) {
        this.onToastCallback('Press back again to exit');
      }
      return true;
    }
  }
}

export const backNavManager = new BackNavigationManager();
