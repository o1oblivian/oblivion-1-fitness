import React, { Component, ReactNode } from 'react';
import { recordLocalCrash } from '../../utils/crashLog';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

function crashLogEnabled(): boolean {
  try {
    const raw = localStorage.getItem('o1fc_production_settings_v3');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (typeof parsed.crashReports === 'boolean') return parsed.crashReports;
    return true;
  } catch {
    return true;
  }
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (!crashLogEnabled()) return;
    console.error('[AppErrorBoundary]', error, errorInfo.componentStack);
    recordLocalCrash(error, errorInfo.componentStack || undefined);
  }

  override render(): ReactNode {
    if (this.state.error) {
      const err = this.state.error;
      const showStack = crashLogEnabled();
      const details = showStack
        ? [err.name, err.message, err.stack].filter(Boolean).join('\n\n')
        : 'A render error stopped the screen. Turn on On-device crash log in Settings to keep a local stack trace.';
      return (
        <div className="min-h-screen w-full max-w-md mx-auto overflow-x-hidden bg-black text-white flex flex-col p-5 select-text font-sans">
          <p className="text-[10px] font-mono uppercase tracking-widest text-o1-crimson mb-2">Runtime exception</p>
          <h1 className="text-sm font-bold uppercase tracking-wider mb-3">App failed to render</h1>
          <pre className="flex-1 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-amber-200 bg-black/50 border border-white/[0.07] rounded-xl p-3 overflow-auto">
            {details}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2.5 rounded-xl bg-o1-crimson text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
