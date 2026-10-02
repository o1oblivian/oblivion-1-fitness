import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (
      msg.includes('NotAllowedError') ||
      msg.includes('Permission') ||
      msg.includes('audio') ||
      msg.includes('media') ||
      msg.includes('navigator.mediaDevices') ||
      msg.includes('SecurityError')
    ) {
      console.warn('Silently handled device permission/security rejection:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event?.message?.includes('SecurityError') || event?.message?.includes('localStorage')) {
      console.warn('Silently handled storage access security error:', event.message);
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
  errorInfo: React.ErrorInfo | null;
}

class RootErrorBoundary extends Component<RootBoundaryProps, RootBoundaryState> {
  override state: RootBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<RootBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[Root Error Boundary Caught Error]:', error, errorInfo);
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
      return (
        <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-14 h-14 rounded-2xl bg-[#C4121A]/10 border border-[#C4121A]/40 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(196,18,26,0.3)]">
            <span className="text-xl font-black text-[#C4121A]">O1</span>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-1 text-neutral-100 font-mono">
            Preview Recovery Interface
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
            {this.state.error?.message || 'A render synchronization exception occurred.'}
          </p>
          {this.state.errorInfo?.componentStack && (
            <div className="w-full max-w-md bg-[#121214] border border-neutral-800 rounded-xl p-3 mb-4 text-left overflow-x-auto max-h-36">
              <span className="text-[10px] font-mono uppercase text-[#C4121A] font-bold block mb-1">Stack Trace</span>
              <pre className="text-[10px] font-mono text-neutral-400 leading-tight whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
          >
            Reset Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
}
