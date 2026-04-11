"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Section name for error reporting */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for graceful failure handling.
 * Catches render errors in child components and shows a HUD-styled fallback.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.section || "unknown"}]`, error, errorInfo.componentStack);

    // Lazy-load Sentry only when an error actually occurs — avoids ~150KB in initial bundle
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          section: this.props.section,
        },
      });
    }).catch(() => { /* Sentry unavailable */ });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="bg-hud-surface border border-severity-critical/30 rounded-md p-4 text-center">
          <div className="font-mono text-[10px] text-severity-critical font-bold tracking-wider mb-2">
            ⚠ {this.props.section?.toUpperCase() || "COMPONENT"} ERROR
          </div>
          <p className="font-mono text-[10px] text-hud-muted mb-3">
            {this.state.error?.message?.slice(0, 100) || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className="font-mono text-[9px] text-hud-accent border border-hud-accent/30 px-3 py-1 rounded hover:bg-hud-accent/10 transition-colors"
          >
            RETRY
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
