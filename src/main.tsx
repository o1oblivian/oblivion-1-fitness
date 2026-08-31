import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { AlertTriangle } from 'lucide-react';
import App from './App.tsx';
import { reportError, initGlobalErrorHandlers } from '@/utils/errorReporter';
import { initAnalytics } from '@/utils/analytics';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    reportError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack?.slice(0, 2000),
    });
  }

  render() {
    const instance = this as unknown as React.Component<Props, State>;
    const state = instance.state || { hasError: false, error: null };

    if (state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#0a0a0c', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <AlertTriangle style={{ width: '36px', height: '36px', color: '#ef4444', margin: '0 auto 12px', display: 'block' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#f4f4f5' }}>Application Error Caught</h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '20px', lineHeight: '1.5', wordBreak: 'break-word', background: '#09090b', padding: '10px', borderRadius: '8px', border: '1px solid #27272a', textAlign: 'left' }}>
              {state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => instance.setState({ hasError: false, error: null })}
                style={{ backgroundColor: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return instance.props.children;
  }
}

async function setupNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('capacitor-native');

  try {
    const isDark = document.documentElement.classList.contains('dark');
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? '#0D0F14' : '#F7F5F0' });
  } catch (e) {
    // StatusBar not available on web
  }

  try {
    await SplashScreen.hide();
  } catch (e) {
    // SplashScreen not available
  }

  try {
    CapApp.addListener('backButton', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  } catch (e) {
    // App plugin not available
  }
}

setupNativeApp();
initGlobalErrorHandlers();
initAnalytics();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
