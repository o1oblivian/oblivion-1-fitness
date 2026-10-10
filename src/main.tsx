import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(function installNativeApiBaseFetch() {
  if (typeof window === 'undefined') return;
  const base = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (!base || /onrender\.com$/i.test(base)) return;
  const orig = window.fetch.bind(window);
  const rewrite = (input: RequestInfo | URL): RequestInfo | URL => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return `${base}${input}`;
    }
    if (input instanceof URL && input.pathname.startsWith('/api/')) {
      return new URL(`${base}${input.pathname}${input.search}${input.hash}`);
    }
    if (typeof Request !== 'undefined' && input instanceof Request) {
      try {
        const parsed = new URL(input.url, window.location.origin);
        if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')) {
          return new Request(`${base}${parsed.pathname}${parsed.search}${parsed.hash}`, input);
        }
      } catch {
        /* keep original request */
      }
    }
    return input;
  };
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => orig(rewrite(input), init);
})();

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('audio') ||
      msg.includes('media') || msg.includes('SecurityError') || msg.includes('key')
    ) {
      console.warn('[O1 FC Global Guard] Handled unhandled rejection:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event?.message?.includes('SecurityError') || event?.message?.includes('localStorage')) {
      console.warn('[O1 FC Global Guard] Handled startup error:', event.message);
      event.preventDefault();
    }
  });
}

interface RootBoundaryProps {
  children: ReactNode;
}

interface RootBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<RootBoundaryProps, RootBoundaryState> {
  override state: RootBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<RootBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[O1 FC Launch Guard]:', error, errorInfo);
  }

  handleReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      const err = this.state.error;
      const details = err
        ? [err.name, err.message, err.stack].filter(Boolean).join('\n\n')
        : 'Unknown render error';
      return (
        <div className="min-h-dvh w-full bg-black text-white flex flex-col items-stretch justify-start p-6 select-text font-sans">
          <h1 className="text-base font-bold tracking-wider mb-2 text-neutral-100">
            Launch error
          </h1>
          <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-amber-200 bg-black/60 border border-white/[0.07] rounded-xl p-3 overflow-auto mb-6">
            {details}
          </pre>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-bold tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
          >
            Retry Launch
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const mount = () => {
      createRoot(rootElement).render(
        <StrictMode>
          <RootErrorBoundary>
            <App />
          </RootErrorBoundary>
        </StrictMode>
      );
      rootElement.setAttribute('data-o1-mounted', '1');
    };
    if (import.meta.env.DEV) {
      import('./devPreviewBoot')
        .then((mod) => mod.applyDevPreview())
        .catch(() => undefined)
        .finally(mount);
    } else {
      mount();
    }
  }
} catch (startupError) {
  console.error('[O1 FC Cold Boot Exception Caught]:', startupError);
  const el = document.getElementById('root');
  const message = startupError instanceof Error
    ? `${startupError.name}: ${startupError.message}\n\n${startupError.stack || ''}`
    : String(startupError);
  if (el) {
    el.innerHTML = `
      <div style="min-height:100dvh;width:100%;background:#000000;color:#fff;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;font-family:sans-serif;padding:24px;box-sizing:border-box;">
        <h1 style="font-size:16px;font-weight:700;letter-spacing:1px;margin:0 0 12px 0;text-transform:uppercase;">Launch error</h1>
        <pre style="font-size:11px;color:#D4A017;white-space:pre-wrap;word-break:break-word;background:#000;border:1px solid #333;border-radius:12px;padding:12px;overflow:auto;">${message.replace(/</g, '&lt;')}</pre>
        <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 24px;border-radius:12px;background:#C4121A;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;">Retry Launch</button>
      </div>`;
  }
}
