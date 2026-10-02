import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  featureName?: string;
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown runtime telemetry fault.',
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Graceful error logging without crashing user session
    if (process.env.NODE_ENV !== 'production') {
      // Keep dev log minimal
      // eslint-disable-next-line no-console
      console.warn(`[Telemetry Error Boundary] Fault in ${this.props.featureName || 'Module'}:`, error, errorInfo);
    }
  }

  public override componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && (prevProps.featureName !== this.props.featureName || prevProps.children !== this.props.children)) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleReset = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error during feature reboot:', err);
      }
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      const name = this.props.featureName || 'Application View';
      return (
        <div id="feature-error-boundary-card" className="p-4 max-w-md mx-auto my-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-telemetry font-bold uppercase tracking-wider text-red-400 block">
                  MODULE FAULT ISOLATION // CRASH SHIELD
                </span>
                <h3 className="font-tactical font-black text-sm uppercase text-white tracking-wide">
                  {name} Suspended
                </h3>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              The telemetry feed encountered an unhandled exception. The failure has been safely isolated
              to prevent whole-application disruption.
            </p>

            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 flex items-start gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <code className="text-[11px] font-mono text-red-300/90 break-all leading-tight">
                {this.state.errorMessage}
              </code>
            </div>

            <button
              type="button"
              id="error-boundary-reload-btn"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-tactical font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Application View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
