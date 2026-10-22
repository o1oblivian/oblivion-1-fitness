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
      console.warn(
        `[Telemetry Error Boundary] Fault in ${this.props.featureName || 'Module'}:`,
        error,
        errorInfo,
      );
    }
  }

  public override componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && prevProps.featureName !== this.props.featureName) {
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
        <div
          id="feature-error-boundary-card"
          className="p-4 max-w-md mx-auto my-6 animate-in fade-in duration-200"
        >
          <div className="bg-o1-well border border-white/[0.07] text-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-o1-crimson/15 border border-o1-crimson/30 flex items-center justify-center text-o1-crimson shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-o1-label font-num font-bold tracking-wider text-o1-crimson block">
                  Module fault isolation // crash shield
                </span>
                <h3 className="font-tactical font-black text-sm text-white tracking-wide">
                  {name} Suspended
                </h3>
              </div>
            </div>

            <p className="text-xs text-o1-stone leading-relaxed font-sans">
              The telemetry feed encountered an unhandled exception. The failure has been safely
              isolated to prevent whole-application disruption.
            </p>

            <div className="bg-black rounded-xl p-3 border border-white/[0.07] flex items-start gap-2">
              <Terminal className="w-3.5 h-3.5 text-o1-faint shrink-0 mt-0.5" />
              <code className="text-o1-label font-num text-o1-crimson-pale/90 break-all leading-tight">
                {this.state.errorMessage}
              </code>
            </div>

            <button
              type="button"
              id="error-boundary-reload-btn"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson active:scale-95 text-white text-xs font-tactical font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
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
