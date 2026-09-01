import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp, URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Browser } from '@capacitor/browser';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Register hardware back button listener for Android
 */
export function registerAndroidBackButton(handler: () => boolean | void): () => void {
  if (!isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return () => {};
  }

  const listenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const handled = handler();
    if (!handled && canGoBack) {
      window.history.back();
    }
  });

  return () => {
    listenerPromise.then(l => l.remove()).catch(() => {});
  };
}

/**
 * Register deep-link handler for OAuth and payment return URLs (e.g., com.ofc.fitness://)
 */
export function registerAppUrlListener(handler: (event: URLOpenListenerEvent) => void): () => void {
  if (!isNativePlatform()) {
    return () => {};
  }

  const listenerPromise = CapacitorApp.addListener('appUrlOpen', (event) => {
    handler(event);
  });

  return () => {
    listenerPromise.then(l => l.remove()).catch(() => {});
  };
}

/**
 * Open external URL safely (Chrome Custom Tab on Android / Safari View on iOS to bypass WebView OAuth & checkout blocks)
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isNativePlatform()) {
    try {
      await Browser.open({
        url,
        windowName: '_blank',
        presentationStyle: 'fullscreen',
        toolbarColor: '#000000',
      });
      return;
    } catch (e) {
      console.warn('Native Browser.open fallback:', e);
    }
  }

  try {
    window.location.href = url;
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Close in-app browser instance if open
 */
export async function closeInAppBrowser(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await Browser.close();
    } catch {}
  }
}

/**
 * Initialize native mobile features (status bar styling, hide splash screen safely, configure keyboard)
 */
export async function initNativeMobileApp(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    // Configure Status Bar for dark luxury aesthetics
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (err) {
    console.debug('StatusBar initialization fallback:', err);
  }

  try {
    // Configure Keyboard behavior
    if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    }
  } catch (err) {
    console.debug('Keyboard initialization fallback:', err);
  }

  try {
    // Hide splash screen smoothly once web UI is ready
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.debug('SplashScreen hide fallback:', err);
  }
}

