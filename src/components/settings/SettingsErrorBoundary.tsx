import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SettingsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SettingsErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-o1-crimson-wash/20 border border-o1-crimson/30 rounded-2xl text-center space-y-3 m-4">
          <AlertTriangle className="w-8 h-8 text-o1-crimson mx-auto" />
          <h3 className="text-sm font-num font-bold text-white">Settings Diagnostics Alert</h3>
          <p className="text-xs font-num text-o1-muted">
            An unexpected error occurred while loading settings panels.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-o1-crimson hover:bg-o1-crimson text-white rounded-xl text-xs font-num font-bold flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Settings View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
