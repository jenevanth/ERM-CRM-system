import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
          <div className="max-w-lg w-full p-6 rounded-xl bg-surface-container-lowest border border-error/20 shadow-xl text-center space-y-4">
            <span className="material-symbols-outlined text-error text-5xl">warning</span>
            <h2 className="text-title-lg font-bold text-on-surface">Something went wrong</h2>
            <p className="text-body-sm text-on-surface-variant">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Reload Page</span>
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="btn-secondary flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
