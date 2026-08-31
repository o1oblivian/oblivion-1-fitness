import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
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
