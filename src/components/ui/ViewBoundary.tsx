import React from 'react';
import { AlertTriangle, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

export class ViewBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[ViewBoundary: ${this.props.fallbackLabel || 'View'}]`, error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false, copied: false });
  };

  handleCopy = () => {
    const text = `Section: ${this.props.fallbackLabel || 'Unknown'}\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      const isOverlay = this.props.fallbackLabel === 'Dialogs & Overlays';
      const errorMsg = this.state.error?.message || 'Unexpected exception';

      if (isOverlay) {
        return (
          <div className="fixed bottom-20 left-4 right-4 z-[999] max-w-sm mx-auto p-3.5 rounded-2xl bg-[#18181B]/95 border border-red-500/30 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-white text-xs animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">Overlay Notice</div>
                <div className="text-[11px] text-neutral-400 truncate">{errorMsg}</div>
              </div>
            </div>
            <button
              onClick={this.handleRecover}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
            >
              Reset
            </button>
          </div>
        );
      }

      return (
        <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            {this.props.fallbackLabel || 'This section'} hit an issue
          </p>
          <p className="text-xs text-neutral-400 mb-4">Your workout and fuel data is safe.</p>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={this.handleRecover}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recover View
            </button>
          </div>

          <div className="w-full text-left mt-2">
            <button
              onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="truncate">Debug: {errorMsg.slice(0, 30)}</span>
              {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {this.state.showDetails && (
              <div className="mt-2 p-2.5 rounded-lg bg-black/80 border border-white/10 text-[9px] font-mono text-red-300/90 space-y-1.5">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                  <span className="font-bold text-red-400 truncate">{errorMsg}</span>
                  <button
                    onClick={this.handleCopy}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] font-sans transition-colors shrink-0 cursor-pointer"
                  >
                    {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {this.state.copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {this.state.error?.stack && (
                  <pre className="max-h-28 overflow-y-auto text-[8.5px] text-neutral-400 whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

