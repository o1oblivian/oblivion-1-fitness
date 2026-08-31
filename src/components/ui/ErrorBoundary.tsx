import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false, showDetails: false });
  };

  handlePurgeAndReload = () => {
    try {
      // Clear non-critical transient caches while preserving user identity if possible
      const preserveKeys = ['o1fc_session_email', 'supabase.auth.token'];
      const saved: Record<string, string> = {};
      preserveKeys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val) saved[k] = val;
      });
      sessionStorage.clear();
      // Only clear potential corrupted transient UI state
      localStorage.removeItem('lumina_weekly_schedule');
      localStorage.removeItem('lumina_custom_foods');
      localStorage.removeItem('o1fc_pedometer_session');
    } catch {}
    window.location.reload();
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message || 'Unknown Error'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected rendering error occurred';
      const errorStack = this.state.error?.stack || '';

      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0C10] p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-md text-center space-y-4 my-auto py-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                The app encountered an unexpected issue. Your workout and fuel logs are safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>

              <button
                onClick={this.handlePurgeAndReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-semibold hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clean Reload
              </button>
            </div>

            {/* Error Diagnostics Tray */}
            <div className="pt-2 text-left">
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Diagnostics ({errorMsg.slice(0, 32)}...)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-lg bg-black/80 border border-white/10 text-[10px] font-mono text-red-300/90 space-y-2 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="font-bold text-red-400 truncate">{errorMsg}</span>
                    <button
                      onClick={this.handleCopyError}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] font-sans font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {this.state.copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  {errorStack && (
                    <pre className="max-h-36 overflow-y-auto text-[9px] text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {errorStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

